package gal.galiciawear.app.ui.disenador;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.snackbar.Snackbar;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadMisPrendasBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.modelovista.ModeloVistaDisenador;
import gal.galiciawear.app.modelovista.ModeloVistaPrendas;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Estudio del diseñador: hub centrado en crear prendas. Comprueba que exista
 * perfil de diseñador (requisito de BD) y muestra el catálogo propio con su
 * estado de publicación, permitiendo crear, editar y publicar/despublicar.
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

        adaptador = new AdaptadorMiPrenda(new AdaptadorMiPrenda.AlActuar() {
            @Override public void alEditar(DtoRespuestaProducto prenda) { abrirEdicion(prenda.id); }
            @Override public void alPublicar(DtoRespuestaProducto prenda) { alternarPublicacion(prenda); }
        });
        enlace.listaPrendas.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaPrendas.setAdapter(adaptador);

        enlace.botonCrear.setOnClickListener(v -> abrirEdicion(null));

        // El observer del perfil se registra una sola vez; onResume dispara la recarga.
        modeloDisenador.observarPerfil().observe(this, recurso -> {
            if (recurso == null || recurso.estaCargando()) return;
            if (recurso.esExito()) {
                perfilListo = recurso.datos != null;
                if (perfilListo) {
                    enlace.botonCrear.setEnabled(true);
                    cargarPrendas();
                } else {
                    enlace.indicadorCarga.setVisibility(View.GONE);
                    enlace.botonCrear.setEnabled(false);
                    enlace.listaPrendas.setVisibility(View.GONE);
                    enlace.estadoVacio.setVisibility(View.VISIBLE);
                    enlace.textoVacio.setText(R.string.completar_perfil_primero);
                    enlace.textoContador.setText("");
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
                List<DtoRespuestaProducto> prendas = recurso.datos;
                boolean vacio = prendas == null || prendas.isEmpty();
                enlace.estadoVacio.setVisibility(vacio ? View.VISIBLE : View.GONE);
                enlace.textoVacio.setText(R.string.sin_prendas);
                enlace.listaPrendas.setVisibility(vacio ? View.GONE : View.VISIBLE);
                adaptador.establecer(prendas);
                actualizarContador(prendas);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void actualizarContador(List<DtoRespuestaProducto> prendas) {
        if (prendas == null) { enlace.textoContador.setText(""); return; }
        int total = prendas.size();
        int publicadas = 0;
        for (DtoRespuestaProducto p : prendas) if (p.activo) publicadas++;
        enlace.textoContador.setText(
            getString(R.string.mis_prendas_contador, total, publicadas));
    }

    private void alternarPublicacion(DtoRespuestaProducto prenda) {
        boolean nuevoEstado = !prenda.activo;
        modeloPrendas.publicarPrenda(prenda.id, nuevoEstado).observe(this, recurso -> {
            if (recurso == null || recurso.estaCargando()) return;
            if (recurso.esExito()) {
                Snackbar.make(enlace.getRoot(),
                    nuevoEstado ? R.string.prenda_publicada : R.string.prenda_despublicada,
                    Snackbar.LENGTH_SHORT).show();
                cargarPrendas();
            } else if (recurso.esError()) {
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void abrirEdicion(@Nullable String prendaId) {
        Intent intent = new Intent(this, ActividadEditarPrenda.class);
        if (prendaId != null) {
            intent.putExtra(Constantes.EXTRA_PRENDA_ID, prendaId);
        }
        startActivity(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
