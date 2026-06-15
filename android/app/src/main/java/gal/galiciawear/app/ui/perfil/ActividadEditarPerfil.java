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
 *
 * Pantalla accesible desde {@link FragmentoPerfil} mediante el botón "Editar perfil".
 * Al guardar con éxito se devuelve {@code RESULT_OK} para que la pantalla anterior
 * recargue los datos del perfil.
 */
@AndroidEntryPoint
public class ActividadEditarPerfil extends AppCompatActivity {

    /** Enlace generado por View Binding para acceder a las vistas del layout. */
    private ActividadEditarPerfilBinding enlace;
    /** ViewModel que gestiona la carga y actualización del perfil del usuario. */
    private ModeloVistaPerfil modeloVista;
    /** Ejecutor de un único hilo usado para tareas de E/S (lectura/conversión de la imagen). */
    private final ExecutorService ejecutorIo = Executors.newSingleThreadExecutor();

    // null = avatar sin cambios; "" = quitar; data URI = nueva foto.
    /** Valor del avatar que se enviará al backend al pulsar "Guardar". */
    private String avatarParaEnviar = null;
    /** Evita rellenar los campos del formulario más de una vez al recibir actualizaciones del perfil. */
    private boolean prefilado = false;

    // Selector de imagen del sistema (sin permisos: SAF concede acceso al Uri).
    /**
     * Lanzador del selector de imágenes del sistema (Storage Access Framework).
     * No requiere permisos de almacenamiento porque el sistema concede acceso
     * temporal al {@link Uri} seleccionado.
     */
    private final ActivityResultLauncher<String> selectorImagen =
        registerForActivityResult(new ActivityResultContracts.GetContent(), this::procesarImagen);

    /**
     * Inicializa la vista, configura la barra de herramientas, los listeners de
     * los botones (cambiar/quitar foto, guardar) y arranca la carga del perfil
     * actual desde el ViewModel.
     *
     * @param savedInstanceState estado previamente guardado de la actividad, o {@code null}.
     */
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

        // Tanto la tarjeta del avatar como el botón "Cambiar foto" abren el selector de imágenes.
        enlace.tarjetaAvatar.setOnClickListener(v -> selectorImagen.launch("image/*"));
        enlace.botonCambiarFoto.setOnClickListener(v -> selectorImagen.launch("image/*"));
        enlace.botonQuitarFoto.setOnClickListener(v -> quitarFoto());
        enlace.botonGuardar.setOnClickListener(v -> guardar());

        observarPerfil();
        observarActualizacion();
        modeloVista.cargarPerfil();
    }

    // ── Carga inicial ──────────────────────────────────────────────────────────

    /**
     * Observa el perfil del usuario y, la primera vez que llega con éxito,
     * rellena los campos del formulario (nombre, apellidos, teléfono, correo)
     * y pinta el avatar o la inicial correspondiente.
     * Se controla con {@link #prefilado} para no sobrescribir lo que el
     * usuario esté editando si el LiveData se vuelve a emitir.
     */
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

    /**
     * Muestra la primera letra del nombre (en mayúscula) como inicial
     * por defecto cuando el usuario no tiene foto de perfil.
     *
     * @param nombre nombre del usuario; si está vacío no se modifica el texto.
     */
    private void pintarInicial(String nombre) {
        if (!nombre.isEmpty()) {
            enlace.textoInicial.setText(nombre.substring(0, 1).toUpperCase());
        }
    }

    /**
     * Muestra el avatar guardado (base64) o, si no hay, la inicial.
     * También controla la visibilidad del botón "Quitar foto", que solo
     * tiene sentido si actualmente hay una foto que eliminar.
     *
     * @param avatarUrl data URI en base64 del avatar, o {@code null}/vacío si no hay foto.
     */
    private void mostrarAvatar(String avatarUrl) {
        Bitmap bitmap = ImagenBase64.aBitmap(avatarUrl);
        boolean hayFoto = bitmap != null;
        if (hayFoto) enlace.imagenAvatar.setImageBitmap(bitmap);
        enlace.imagenAvatar.setVisibility(hayFoto ? View.VISIBLE : View.GONE);
        enlace.textoInicial.setVisibility(hayFoto ? View.GONE : View.VISIBLE);
        enlace.botonQuitarFoto.setVisibility(hayFoto ? View.VISIBLE : View.GONE);
    }

    // ── Selección de foto ──────────────────────────────────────────────────────

    /**
     * Callback del selector de imágenes: recibe el {@link Uri} de la imagen elegida
     * (o {@code null} si el usuario canceló) y la convierte a un data URI base64
     * en un hilo de fondo para no bloquear la interfaz.
     *
     * @param uri URI de la imagen seleccionada de la galería, o {@code null} si se cancela.
     */
    private void procesarImagen(Uri uri) {
        if (uri == null) return;
        enlace.indicadorCarga.setVisibility(View.VISIBLE);
        ejecutorIo.execute(() -> {
            // Conversión pesada (lectura + redimensionado + codificación base64) en hilo de E/S.
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

    /**
     * Marca el avatar para ser eliminado al guardar (enviando una cadena vacía
     * al backend) y actualiza la vista para mostrar la inicial en lugar de la foto.
     */
    private void quitarFoto() {
        avatarParaEnviar = "";            // cadena vacía → el backend borra el avatar
        mostrarAvatar(null);
    }

    // ── Guardado ───────────────────────────────────────────────────────────────

    /**
     * Valida los campos del formulario (nombre y apellidos obligatorios, teléfono
     * con formato válido si se indica) y, si todo es correcto, envía al ViewModel
     * la petición de actualización del perfil con los datos modificados y el
     * avatar pendiente de aplicar.
     */
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

    /**
     * Observa el resultado de la actualización del perfil: muestra/oculta el
     * indicador de carga, deshabilita el botón "Guardar" mientras se procesa
     * y, según el resultado, indica éxito (cerrando la pantalla con
     * {@code RESULT_OK}) o muestra el mensaje de error correspondiente.
     */
    private void observarActualizacion() {
        modeloVista.observarActualizacion().observe(this, recurso -> {
            if (recurso == null) return;
            boolean cargando = recurso.estaCargando();
            enlace.indicadorCarga.setVisibility(cargando ? View.VISIBLE : View.GONE);
            enlace.botonGuardar.setEnabled(!cargando);

            if (recurso.esExito()) {
                setResult(RESULT_OK);
                Snackbar.make(enlace.getRoot(), R.string.perfil_actualizado, Snackbar.LENGTH_SHORT).show();
                // Pequeño retardo para que el usuario vea el snackbar antes de cerrar la pantalla.
                enlace.getRoot().postDelayed(this::finish, 600);
            } else if (recurso.esError()) {
                Snackbar.make(enlace.getRoot(),
                    recurso.mensaje != null ? recurso.mensaje : getString(R.string.error_generico),
                    Snackbar.LENGTH_LONG).show();
            }
        });
    }

    /**
     * Obtiene el texto de un campo de entrada, limpiando primero cualquier
     * error previo mostrado y eliminando espacios sobrantes.
     *
     * @param campo campo de texto del que se quiere leer el contenido.
     * @return el texto del campo sin espacios al principio/final, o cadena vacía si es nulo.
     */
    private String texto(com.google.android.material.textfield.TextInputEditText campo) {
        campo.setError(null);
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    /**
     * Gestiona la pulsación de la flecha "atrás" de la barra de herramientas,
     * cerrando la actividad sin guardar cambios.
     *
     * @return {@code true} indicando que la navegación se ha gestionado.
     */
    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }

    /** Libera el ejecutor de E/S al destruirse la actividad para evitar fugas de hilos. */
    @Override
    protected void onDestroy() {
        super.onDestroy();
        ejecutorIo.shutdown();
    }
}
