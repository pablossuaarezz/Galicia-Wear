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
 */
@AndroidEntryPoint
public class ActividadDisenadorPendiente extends AppCompatActivity {

    private ActividadDisenadorPendienteBinding enlace;
    private ModeloVistaAutenticacion modeloVista;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadDisenadorPendienteBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaAutenticacion.class);

        enlace.botonRefrescar.setOnClickListener(v -> comprobarValidacion());
        enlace.botonIniciarCliente.setOnClickListener(v -> iniciarSesionComoCliente());
    }

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

    private void iniciarSesionComoCliente() {
        modeloVista.cerrarSesion();
        startActivity(new Intent(this, ActividadAutenticacion.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
