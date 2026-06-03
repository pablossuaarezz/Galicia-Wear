package gal.galiciawear.app.ui.disenador;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadMisPrendasBinding;
import gal.galiciawear.app.modelovista.ModeloVistaDisenador;
import gal.galiciawear.app.modelovista.ModeloVistaPrendas;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Catálogo de prendas del diseñador. Antes de permitir crear prendas comprueba
 * que el perfil de diseñador exista (es requisito de la relación en BD); si no,
 * invita a completarlo. Recarga la lista en cada onResume para reflejar altas
 * y ediciones realizadas en {@link ActividadEditarPrenda}.
 */
@AndroidEntryPoint
public class ActividadMisPrendas extends AppCompatActivity {

    private ActividadMisPrendasBinding enlace;
    private ModeloVistaPrendas modeloPrendas;
    private ModeloVistaDisenador modeloDisenador;
    private AdaptadorMiPrenda adaptador;

    private boolean perfilListo = false;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadMisPrendasBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloPrendas   = new ViewModelProvider(this).get(ModeloVistaPrendas.class);
        modeloDisenador = new ViewModelProvider(this).get(ModeloVistaDisenador.class);

        enlace.barraHerramientas.setNavigationOnClickListener(v -> finish());

        adaptador = new AdaptadorMiPrenda(this::abrirEdicion);
        enlace.listaPrendas.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaPrendas.setAdapter(adaptador);

        enlace.botonAnadir.setOnClickListener(v -> abrirEdicion(null));

        // El observer del perfil se registra una sola vez; onResume solo dispara la recarga.
        modeloDisenador.observarPerfil().observe(this, recurso -> {
            if (recurso == null || recurso.estaCargando()) return;
            if (recurso.esExito()) {
                perfilListo = recurso.datos != null;
                if (perfilListo) {
                    enlace.botonAnadir.setVisibility(View.VISIBLE);
                    cargarPrendas();
                } else {
                    enlace.indicadorCarga.setVisibility(View.GONE);
                    enlace.botonAnadir.setVisibility(View.GONE);
                    enlace.listaPrendas.setVisibility(View.GONE);
                    enlace.textoVacio.setVisibility(View.VISIBLE);
                    enlace.textoVacio.setText(R.string.completar_perfil_primero);
                }
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Verifica que exista perfil de diseñador antes de listar/crear prendas.
        enlace.indicadorCarga.setVisibility(View.VISIBLE);
        modeloDisenador.cargarPerfil();
    }

    private void cargarPrendas() {
        modeloPrendas.listarMisPrendas().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                boolean vacio = recurso.datos == null || recurso.datos.isEmpty();
                enlace.textoVacio.setVisibility(vacio ? View.VISIBLE : View.GONE);
                enlace.textoVacio.setText(R.string.sin_prendas);
                enlace.listaPrendas.setVisibility(vacio ? View.GONE : View.VISIBLE);
                adaptador.establecer(recurso.datos);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void abrirEdicion(@Nullable gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto prenda) {
        Intent intent = new Intent(this, ActividadEditarPrenda.class);
        if (prenda != null) {
            intent.putExtra(Constantes.EXTRA_PRENDA_ID, prenda.id);
        }
        startActivity(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
