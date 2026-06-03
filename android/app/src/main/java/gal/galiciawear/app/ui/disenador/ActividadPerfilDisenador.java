package gal.galiciawear.app.ui.disenador;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Patterns;
import android.view.View;
import android.widget.ArrayAdapter;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import android.content.Intent;

import com.bumptech.glide.Glide;
import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadPerfilDisenadorBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDisenador;
import gal.galiciawear.app.modelovista.ModeloVistaDisenador;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla para crear o editar el perfil de diseñador (marca).
 *
 * Flujo: al abrir carga el perfil propio (GET /disenadores/yo). Si no existe,
 * el formulario funciona en modo alta (POST /disenadores/solicitar); si existe,
 * en modo edición (PATCH /disenadores/yo). El perfil nace sin validar: lo activa
 * un administrador desde el panel de administración (JavaFX).
 *
 * La validación cliente replica las reglas del backend (marca 2–100, biografía
 * 10–2000, IBAN ISO 13616, URLs válidas) para evitar 400 confusos.
 */
@AndroidEntryPoint
public class ActividadPerfilDisenador extends AppCompatActivity {

    private ActividadPerfilDisenadorBinding enlace;
    private ModeloVistaDisenador modeloVista;

    private String[] ciudadValores;
    private boolean tienePerfil = false;
    private boolean esOnboarding = false;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadPerfilDisenadorBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaDisenador.class);

        esOnboarding = getIntent().getBooleanExtra(Constantes.EXTRA_ONBOARDING_DISENADOR, false);
        // En onboarding (recién registrado) el "atrás" entra a la app, no cierra sesión.
        enlace.barraHerramientas.setNavigationOnClickListener(v -> salir());

        // Selector de ciudad: etiquetas legibles, valores = enum CiudadGallega.
        ciudadValores = getResources().getStringArray(R.array.ciudad_valores);
        ArrayAdapter<CharSequence> adaptadorCiudad = ArrayAdapter.createFromResource(
            this, R.array.ciudad_etiquetas, android.R.layout.simple_spinner_item);
        adaptadorCiudad.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        enlace.selectorCiudad.setAdapter(adaptadorCiudad);

        // Previsualización del logo a medida que se escribe la URL.
        enlace.entradaUrlLogo.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) { }
            @Override public void onTextChanged(CharSequence s, int a, int b, int c) { }
            @Override public void afterTextChanged(Editable s) { actualizarVistaPreviaLogo(s.toString().trim()); }
        });

        enlace.botonGuardar.setOnClickListener(v -> guardar());

        observarPerfil();
        observarGuardado();
        modeloVista.cargarPerfil();
    }

    private void observarPerfil() {
        modeloVista.observarPerfil().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                tienePerfil = recurso.datos != null;
                if (recurso.datos != null) {
                    rellenarFormulario(recurso.datos);
                }
                actualizarTextosSegunModo();
                actualizarBanner(recurso.datos);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void observarGuardado() {
        modeloVista.observarGuardado().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
                enlace.botonGuardar.setEnabled(false);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonGuardar.setEnabled(true);
                tienePerfil = true;
                actualizarTextosSegunModo();
                actualizarBanner(recurso.datos);
                String mensaje = recurso.datos != null && recurso.datos.validado
                    ? getString(R.string.perfil_validado)
                    : getString(R.string.pendiente_validacion);
                if (esOnboarding) {
                    // Fin del alta: avisamos del estado y entramos a la app.
                    android.widget.Toast.makeText(this, mensaje,
                        android.widget.Toast.LENGTH_LONG).show();
                    irAPrincipal();
                } else {
                    Snackbar.make(enlace.getRoot(), mensaje, Snackbar.LENGTH_LONG).show();
                }
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonGuardar.setEnabled(true);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void rellenarFormulario(DtoDisenador d) {
        enlace.entradaNombreMarca.setText(d.nombreMarca);
        enlace.entradaBiografia.setText(d.biografia);
        enlace.entradaUrlLogo.setText(d.urlLogo);
        enlace.entradaUrlWeb.setText(d.urlWeb);
        // El IBAN nunca se devuelve (dato sensible): se deja vacío y solo se reenvía si cambia.
        int pos = posicionCiudad(d.ciudad);
        if (pos >= 0) enlace.selectorCiudad.setSelection(pos);
    }

    private int posicionCiudad(String valor) {
        if (valor == null) return -1;
        for (int i = 0; i < ciudadValores.length; i++) {
            if (ciudadValores[i].equals(valor)) return i;
        }
        return -1;
    }

    private void actualizarTextosSegunModo() {
        enlace.botonGuardar.setText(tienePerfil
            ? getString(R.string.guardar_cambios)
            : getString(R.string.enviar_solicitud));
    }

    private void actualizarBanner(@Nullable DtoDisenador d) {
        if (d == null) {
            enlace.bannerEstado.setVisibility(View.GONE);
            return;
        }
        enlace.bannerEstado.setVisibility(View.VISIBLE);
        enlace.bannerEstado.setText(d.validado
            ? getString(R.string.perfil_validado)
            : getString(R.string.pendiente_validacion));
    }

    private void actualizarVistaPreviaLogo(String url) {
        if (url.isEmpty() || !Patterns.WEB_URL.matcher(url).matches()) {
            enlace.vistaPreviaLogo.setVisibility(View.GONE);
            return;
        }
        enlace.vistaPreviaLogo.setVisibility(View.VISIBLE);
        Glide.with(this).load(url).into(enlace.vistaPreviaLogo);
    }

    private void guardar() {
        String nombreMarca = texto(enlace.entradaNombreMarca);
        String biografia   = texto(enlace.entradaBiografia);
        String iban        = texto(enlace.entradaIban).replace(" ", "").toUpperCase();
        String urlLogo     = texto(enlace.entradaUrlLogo);
        String urlWeb      = texto(enlace.entradaUrlWeb);
        int posCiudad      = enlace.selectorCiudad.getSelectedItemPosition();
        String ciudad      = posCiudad >= 0 ? ciudadValores[posCiudad] : null;

        enlace.campoNombreMarca.setError(null);
        enlace.campoBiografia.setError(null);
        enlace.campoIban.setError(null);
        enlace.campoUrlLogo.setError(null);
        enlace.campoUrlWeb.setError(null);

        boolean valido = true;
        if (nombreMarca.length() < 2 || nombreMarca.length() > 100) {
            enlace.campoNombreMarca.setError("Entre 2 y 100 caracteres");
            valido = false;
        }
        if (biografia.length() < 10 || biografia.length() > 2000) {
            enlace.campoBiografia.setError("Entre 10 y 2000 caracteres");
            valido = false;
        }
        // En alta el IBAN es obligatorio; en edición puede ir vacío (no se cambia).
        if (!tienePerfil && iban.isEmpty()) {
            enlace.campoIban.setError("IBAN obligatorio");
            valido = false;
        } else if (!iban.isEmpty() && !iban.matches("^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$")) {
            enlace.campoIban.setError("Formato IBAN no válido");
            valido = false;
        }
        if (!urlLogo.isEmpty() && !Patterns.WEB_URL.matcher(urlLogo).matches()) {
            enlace.campoUrlLogo.setError("URL no válida");
            valido = false;
        }
        if (!urlWeb.isEmpty() && !Patterns.WEB_URL.matcher(urlWeb).matches()) {
            enlace.campoUrlWeb.setError("URL no válida");
            valido = false;
        }
        if (!valido) return;

        modeloVista.guardar(new DtoPeticionDisenador(
            nombreMarca, biografia, ciudad, iban, urlLogo, urlWeb));
    }

    private String texto(com.google.android.material.textfield.TextInputEditText campo) {
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    /** En onboarding entra a la app; en edición normal solo cierra la pantalla. */
    private void salir() {
        if (esOnboarding) {
            irAPrincipal();
        } else {
            finish();
        }
    }

    private void irAPrincipal() {
        startActivity(new Intent(this, ActividadPrincipal.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
        finish();
    }

    @Override
    public void onBackPressed() {
        // Evita que el diseñador recién registrado quede atrapado o salga de la app.
        if (esOnboarding) {
            irAPrincipal();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
