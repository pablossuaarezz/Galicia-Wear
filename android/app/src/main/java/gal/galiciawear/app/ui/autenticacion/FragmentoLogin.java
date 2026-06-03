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

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoLoginBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(requireActivity()).get(ModeloVistaAutenticacion.class);

        configurarValidacionReactiva();
        configurarBotonLogin();
    }

    // Validación en tiempo real: actualiza el error del TextInputLayout al escribir
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

    private void actualizarEstadoBoton() {
        String correo     = enlace.entradaCorreo.getText() != null
            ? enlace.entradaCorreo.getText().toString() : "";
        String contrasena = enlace.entradaContrasena.getText() != null
            ? enlace.entradaContrasena.getText().toString() : "";
        enlace.botonLogin.setEnabled(
            correo.contains("@") && correo.contains(".") && contrasena.length() >= 6
        );
    }

    private void configurarBotonLogin() {
        enlace.botonLogin.setOnClickListener(v -> {
            String correo     = enlace.entradaCorreo.getText().toString().trim();
            String contrasena = enlace.entradaContrasena.getText().toString();
            modeloVista.iniciarSesion(correo, contrasena);
        });

        modeloVista.observarLogin().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.botonLogin.setEnabled(false);
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
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
     */
    private void decidirDestino() {
        if (!(getActivity() instanceof ActividadAutenticacion)) return;
        ActividadAutenticacion act = (ActividadAutenticacion) getActivity();

        if (gal.galiciawear.app.utilidades.Constantes.ROL_DISENADOR.equals(modeloVista.obtenerRol())) {
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
            act.navegarAPrincipal();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
