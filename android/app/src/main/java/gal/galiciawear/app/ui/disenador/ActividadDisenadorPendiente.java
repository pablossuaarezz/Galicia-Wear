package gal.galiciawear.app.ui.disenador;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadDisenadorPendienteBinding;
import gal.galiciawear.app.modelovista.ModeloVistaAutenticacion;
import gal.galiciawear.app.ui.autenticacion.ActividadAutenticacion;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;

/**
 * Pantalla mostrada a un diseñador cuya cuenta aún no ha sido validada por un
 * administrador. Ofrece "Refrescar" (revuelve a comprobar el estado) y
 * "Iniciar sesión como cliente" (cierra la sesión y vuelve al login).
 *
 * Esta actividad es una "sala de espera": el diseñador queda bloqueado aquí
 * hasta que un administrador valide su perfil desde el panel JavaFX. No tiene
 * navegación al resto de la app salvo a través de las dos acciones ofrecidas.
 */
@AndroidEntryPoint
public class ActividadDisenadorPendiente extends AppCompatActivity {

    private ActividadDisenadorPendienteBinding enlace;
    private ModeloVistaAutenticacion modeloVista;

    /**
     * Infla el layout mediante ViewBinding, obtiene el ViewModel de autenticación
     * y conecta los listeners de los dos botones disponibles en esta pantalla.
     */
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadDisenadorPendienteBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaAutenticacion.class);

        enlace.botonRefrescar.setOnClickListener(v -> comprobarValidacion());
        enlace.botonIniciarCliente.setOnClickListener(v -> iniciarSesionComoCliente());
    }

    /**
     * Lanza la comprobación contra el backend de si el diseñador ya ha sido
     * validado por un administrador. Muestra un indicador de carga mientras
     * se espera la respuesta y deshabilita el botón para evitar pulsaciones
     * repetidas.
     *
     * Según el resultado:
     *  - Validado (true): navega a la pantalla principal y limpia la pila de
     *    actividades (el usuario ya no debe volver a esta pantalla de espera).
     *  - Éxito pero aún no validado: muestra un Snackbar informando de que
     *    sigue pendiente.
     *  - Error de red/servidor: muestra el mensaje de error en un Snackbar.
     */
    private void comprobarValidacion() {
        enlace.indicadorCarga.setVisibility(View.VISIBLE);
        enlace.botonRefrescar.setEnabled(false);
        modeloVista.estaValidadoComoDisenador().observe(this, recurso -> {
            if (recurso == null || recurso.estaCargando()) return;
            enlace.indicadorCarga.setVisibility(View.GONE);
            enlace.botonRefrescar.setEnabled(true);
            if (recurso.esExito() && Boolean.TRUE.equals(recurso.datos)) {
                // Ya validado: entra a la app.
                startActivity(new Intent(this, ActividadPrincipal.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
                finish();
            } else if (recurso.esExito()) {
                Snackbar.make(enlace.getRoot(), R.string.aun_pendiente, Snackbar.LENGTH_LONG).show();
            } else {
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    /**
     * Cierra la sesión actual del diseñador pendiente y vuelve a la pantalla
     * de autenticación, limpiando toda la pila de actividades para que no se
     * pueda regresar a esta pantalla con el botón "atrás".
     */
    private void iniciarSesionComoCliente() {
        modeloVista.cerrarSesion();
        startActivity(new Intent(this, ActividadAutenticacion.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
        finish();
    }

    /** Libera la referencia al ViewBinding para evitar fugas de memoria. */
    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
