package gal.galiciawear.app.ui.autenticacion;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoLoginBinding;
import gal.galiciawear.app.modelovista.ModeloVistaAutenticacion;

/**
 * Fragmento de login con validación reactiva en tiempo real.
 *
 * Criterios psicológicos aplicados:
 * - Prevención de errores: el botón de login se desactiva si el email o contraseña
 *   no cumplen el formato mínimo (evita llamadas innecesarias al servidor).
 * - Feedback inmediato: errores en TextInputLayout, no popup modal.
 * - Carga cognitiva: solo 2 campos + botón visible (≤7 elementos por pantalla).
 */
@AndroidEntryPoint
public class FragmentoLogin extends Fragment {

    private FragmentoLoginBinding enlace;
    private ModeloVistaAutenticacion modeloVista;

    /**
     * Infla el layout del fragmento mediante ViewBinding y devuelve su vista raíz.
     * No se realiza aquí ninguna configuración adicional: se deja para
     * {@link #onViewCreated(View, Bundle)}, donde la vista ya está completamente
     * disponible.
     */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoLoginBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Obtiene el ViewModel compartido con la actividad contenedora (de modo que
     * Login y Registro puedan usar el mismo {@link ModeloVistaAutenticacion} si
     * fuera necesario) y configura la validación reactiva de los campos y el
     * comportamiento del botón de login.
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(requireActivity()).get(ModeloVistaAutenticacion.class);

        configurarValidacionReactiva();
        configurarBotonLogin();
    }

    // Validación en tiempo real: actualiza el error del TextInputLayout al escribir
    /**
     * Añade un {@link TextWatcher} común a los campos de correo y contraseña.
     * En cada pulsación: recalcula si el botón de login debe estar habilitado
     * y limpia los errores mostrados previamente (para no mostrar un error
     * obsoleto mientras el usuario sigue corrigiendo el texto).
     */
    private void configurarValidacionReactiva() {
        TextWatcher validador = new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int i, int c, int a) { }
            @Override public void onTextChanged(CharSequence s, int i, int b, int c) { }
            @Override
            public void afterTextChanged(Editable s) {
                actualizarEstadoBoton();
                enlace.campoCorreo.setError(null);
                enlace.campoContrasena.setError(null);
            }
        };
        enlace.entradaCorreo.addTextChangedListener(validador);
        enlace.entradaContrasena.addTextChangedListener(validador);
        actualizarEstadoBoton();
    }

    /**
     * Comprueba de forma sencilla (sin llamar al servidor) si el correo tiene
     * formato mínimamente válido (contiene "@" y ".") y la contraseña alcanza
     * la longitud mínima (6 caracteres), y habilita/deshabilita el botón de
     * login en consecuencia. Esta validación es solo de "prevención de
     * errores" en cliente; la validación completa la hace el backend.
     */
    private void actualizarEstadoBoton() {
        String correo     = enlace.entradaCorreo.getText() != null
            ? enlace.entradaCorreo.getText().toString() : "";
        String contrasena = enlace.entradaContrasena.getText() != null
            ? enlace.entradaContrasena.getText().toString() : "";
        enlace.botonLogin.setEnabled(
            correo.contains("@") && correo.contains(".") && contrasena.length() >= 6
        );
    }

    /**
     * Configura el listener del botón de login (envía las credenciales al
     * ViewModel) y observa el {@code LiveData} del resultado del login para
     * reflejar en la UI los tres estados posibles: cargando, éxito y error.
     */
    private void configurarBotonLogin() {
        enlace.botonLogin.setOnClickListener(v -> {
            String correo     = enlace.entradaCorreo.getText().toString().trim();
            String contrasena = enlace.entradaContrasena.getText().toString();
            modeloVista.iniciarSesion(correo, contrasena);
        });

        modeloVista.observarLogin().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                // Mientras se espera la respuesta del backend, se deshabilita el
                // botón (evita doble envío) y se muestra el indicador de carga.
                enlace.botonLogin.setEnabled(false);
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                // Login correcto: decidir a qué pantalla navegar según el rol.
                decidirDestino();
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonLogin.setEnabled(true);
                // Error en el campo en vez de toast — menos disruptivo
                enlace.campoContrasena.setError(recurso.mensaje);
            }
        });
    }

    /**
     * Tras el login: un diseñador validado entra a la app; uno sin validar va a la
     * pantalla de espera. El cliente entra directamente.
     *
     * Si la actividad contenedora no es {@link ActividadAutenticacion} (situación
     * anómala), se aborta sin navegar para evitar un cast inválido.
     */
    private void decidirDestino() {
        if (!(getActivity() instanceof ActividadAutenticacion)) return;
        ActividadAutenticacion act = (ActividadAutenticacion) getActivity();

        if (gal.galiciawear.app.utilidades.Constantes.ROL_DISENADOR.equals(modeloVista.obtenerRol())) {
            // Si el usuario es diseñador, hay que comprobar primero si su cuenta
            // ya ha sido validada por un administrador antes de dejarle pasar.
            enlace.indicadorCarga.setVisibility(View.VISIBLE);
            modeloVista.estaValidadoComoDisenador().observe(getViewLifecycleOwner(), recurso -> {
                if (recurso == null || recurso.estaCargando()) return;
                enlace.indicadorCarga.setVisibility(View.GONE);
                boolean validado = recurso.esExito() && Boolean.TRUE.equals(recurso.datos);
                if (validado) {
                    act.navegarAPrincipal();
                } else {
                    act.navegarAPendienteDisenador();
                }
            });
        } else {
            // Clientes: acceso directo a la app principal.
            act.navegarAPrincipal();
        }
    }

    /**
     * Libera la referencia al binding al destruirse la vista del fragmento,
     * evitando fugas de memoria (el binding no debe usarse tras este punto).
     */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
