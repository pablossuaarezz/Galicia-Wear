package gal.galiciawear.app.ui.perfil;

import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadEditarPerfilBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionActualizarPerfil;
import gal.galiciawear.app.modelovista.ModeloVistaPerfil;
import gal.galiciawear.app.utilidades.ImagenBase64;

/**
 * Edición del perfil del cliente: nombre, apellidos, teléfono y foto de perfil.
 * La foto se elige de la galería, se reduce y se sube como base64 (data URI)
 * que el backend guarda en SQL.
 */
@AndroidEntryPoint
public class ActividadEditarPerfil extends AppCompatActivity {

    private ActividadEditarPerfilBinding enlace;
    private ModeloVistaPerfil modeloVista;
    private final ExecutorService ejecutorIo = Executors.newSingleThreadExecutor();

    // null = avatar sin cambios; "" = quitar; data URI = nueva foto.
    private String avatarParaEnviar = null;
    private boolean prefilado = false;

    // Selector de imagen del sistema (sin permisos: SAF concede acceso al Uri).
    private final ActivityResultLauncher<String> selectorImagen =
        registerForActivityResult(new ActivityResultContracts.GetContent(), this::procesarImagen);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadEditarPerfilBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaPerfil.class);

        setSupportActionBar(enlace.barraHerramientas);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.editar_perfil);
        }
        enlace.barraHerramientas.setNavigationOnClickListener(v -> finish());

        enlace.tarjetaAvatar.setOnClickListener(v -> selectorImagen.launch("image/*"));
        enlace.botonCambiarFoto.setOnClickListener(v -> selectorImagen.launch("image/*"));
        enlace.botonQuitarFoto.setOnClickListener(v -> quitarFoto());
        enlace.botonGuardar.setOnClickListener(v -> guardar());

        observarPerfil();
        observarActualizacion();
        modeloVista.cargarPerfil();
    }

    // ── Carga inicial ──────────────────────────────────────────────────────────

    private void observarPerfil() {
        modeloVista.observarPerfil().observe(this, recurso -> {
            if (recurso == null || !recurso.esExito() || recurso.datos == null || prefilado) return;
            prefilado = true;

            String nombre    = recurso.datos.nombre    != null ? recurso.datos.nombre    : "";
            String apellidos = recurso.datos.apellidos != null ? recurso.datos.apellidos : "";
            enlace.entradaNombre.setText(nombre);
            enlace.entradaApellidos.setText(apellidos);
            enlace.entradaTelefono.setText(recurso.datos.telefono);
            enlace.entradaCorreo.setText(recurso.datos.correo);

            pintarInicial(nombre);
            mostrarAvatar(recurso.datos.avatarUrl);
        });
    }

    private void pintarInicial(String nombre) {
        if (!nombre.isEmpty()) {
            enlace.textoInicial.setText(nombre.substring(0, 1).toUpperCase());
        }
    }

    /** Muestra el avatar guardado (base64) o, si no hay, la inicial. */
    private void mostrarAvatar(String avatarUrl) {
        Bitmap bitmap = ImagenBase64.aBitmap(avatarUrl);
        boolean hayFoto = bitmap != null;
        if (hayFoto) enlace.imagenAvatar.setImageBitmap(bitmap);
        enlace.imagenAvatar.setVisibility(hayFoto ? View.VISIBLE : View.GONE);
        enlace.textoInicial.setVisibility(hayFoto ? View.GONE : View.VISIBLE);
        enlace.botonQuitarFoto.setVisibility(hayFoto ? View.VISIBLE : View.GONE);
    }

    // ── Selección de foto ──────────────────────────────────────────────────────

    private void procesarImagen(Uri uri) {
        if (uri == null) return;
        enlace.indicadorCarga.setVisibility(View.VISIBLE);
        ejecutorIo.execute(() -> {
            String dataUri = ImagenBase64.desdeUri(getContentResolver(), uri);
            runOnUiThread(() -> {
                enlace.indicadorCarga.setVisibility(View.GONE);
                if (dataUri == null) {
                    Snackbar.make(enlace.getRoot(), R.string.error_generico, Snackbar.LENGTH_LONG).show();
                    return;
                }
                avatarParaEnviar = dataUri;
                mostrarAvatar(dataUri);
            });
        });
    }

    private void quitarFoto() {
        avatarParaEnviar = "";            // cadena vacía → el backend borra el avatar
        mostrarAvatar(null);
    }

    // ── Guardado ───────────────────────────────────────────────────────────────

    private void guardar() {
        String nombre    = texto(enlace.entradaNombre);
        String apellidos = texto(enlace.entradaApellidos);
        String telefono  = texto(enlace.entradaTelefono);

        boolean valido = true;
        if (nombre.isEmpty()) {
            enlace.entradaNombre.setError(getString(R.string.error_nombre_obligatorio));
            valido = false;
        }
        if (apellidos.isEmpty()) {
            enlace.entradaApellidos.setError(getString(R.string.error_apellidos_obligatorio));
            valido = false;
        }
        if (!telefono.isEmpty() && !telefono.matches("\\+?[0-9]{9,15}")) {
            enlace.entradaTelefono.setError(getString(R.string.error_telefono));
            valido = false;
        }
        if (!valido) return;

        DtoPeticionActualizarPerfil cuerpo = new DtoPeticionActualizarPerfil();
        cuerpo.nombre    = nombre;
        cuerpo.apellidos = apellidos;
        cuerpo.telefono  = telefono.isEmpty() ? null : telefono;
        cuerpo.avatarUrl = avatarParaEnviar;   // null = no tocar; "" = quitar; data URI = nueva

        modeloVista.actualizarPerfil(cuerpo);
    }

    private void observarActualizacion() {
        modeloVista.observarActualizacion().observe(this, recurso -> {
            if (recurso == null) return;
            boolean cargando = recurso.estaCargando();
            enlace.indicadorCarga.setVisibility(cargando ? View.VISIBLE : View.GONE);
            enlace.botonGuardar.setEnabled(!cargando);

            if (recurso.esExito()) {
                setResult(RESULT_OK);
                Snackbar.make(enlace.getRoot(), R.string.perfil_actualizado, Snackbar.LENGTH_SHORT).show();
                enlace.getRoot().postDelayed(this::finish, 600);
            } else if (recurso.esError()) {
                Snackbar.make(enlace.getRoot(),
                    recurso.mensaje != null ? recurso.mensaje : getString(R.string.error_generico),
                    Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private String texto(com.google.android.material.textfield.TextInputEditText campo) {
        campo.setError(null);
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        ejecutorIo.shutdown();
    }
}
