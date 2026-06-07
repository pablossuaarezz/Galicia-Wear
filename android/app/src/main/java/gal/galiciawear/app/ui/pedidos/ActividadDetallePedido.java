package gal.galiciawear.app.ui.pedidos;

import android.os.Bundle;
import android.view.View;

import android.content.Intent;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.ColorUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadDetallePedidoBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.modelovista.ModeloVistaPedidos;
import gal.galiciawear.app.ui.chat.ActividadChat;
import gal.galiciawear.app.utilidades.Constantes;
import gal.galiciawear.app.utilidades.EstadoPedidoUi;
import gal.galiciawear.app.utilidades.FormatoFechas;

@AndroidEntryPoint
public class ActividadDetallePedido extends AppCompatActivity {

    private ActividadDetallePedidoBinding enlace;
    private ModeloVistaPedidos modeloVista;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadDetallePedidoBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaPedidos.class);

        setSupportActionBar(enlace.barraHerramientas);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        String pedidoId = getIntent().getStringExtra(Constantes.EXTRA_PEDIDO_ID);
        if (pedidoId != null) {
            modeloVista.cargarDetalle(pedidoId);
        }

        modeloVista.observarDetalle().observe(this, recurso -> {
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                mostrarDetalle(recurso.datos);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
            }
        });
    }

    private void mostrarDetalle(DtoRespuestaPedido pedido) {
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(getString(R.string.pedido_numero, pedido.numeroPedido));
        }
        pintarEstado(pedido.estado);
        enlace.textoTotal.setText(String.format(Locale.getDefault(), "%.2f €", pedido.total));
        enlace.textoMetodoPago.setText(pedido.metodoPago);
        enlace.textoFecha.setText(FormatoFechas.fechaConHora(pedido.fechaCreacion));

        if (pedido.envio != null) {
            enlace.textoSeguimiento.setText(
                pedido.envio.numeroSeguimiento != null
                    ? pedido.envio.numeroSeguimiento
                    : "Pendiente de envío"
            );
            enlace.textoTransportista.setText(
                pedido.envio.transportista != null
                    ? pedido.envio.transportista
                    : "—"
            );
        }

        // Líneas del pedido
        if (pedido.lineas != null) {
            enlace.listaLineas.setLayoutManager(new LinearLayoutManager(this));
            enlace.listaLineas.setAdapter(new AdaptadorLineasPedido(pedido.lineas));
        }

        configurarContactarTienda(pedido);
    }

    /**
     * Botón de soporte postventa. Un pedido puede tener artículos de varias tiendas;
     * si hay más de una, se muestra un selector para elegir con cuál contactar.
     */
    private void configurarContactarTienda(DtoRespuestaPedido pedido) {
        // Tiendas distintas presentes en el pedido (id -> nombre de marca).
        Map<String, String> tiendas = new LinkedHashMap<>();
        if (pedido.lineas != null) {
            for (DtoRespuestaPedido.DtoLineaPedido linea : pedido.lineas) {
                if (linea.disenadorId != null && !linea.disenadorId.isEmpty()) {
                    tiendas.put(linea.disenadorId, linea.nombreTienda());
                }
            }
        }

        if (tiendas.isEmpty()) {
            enlace.botonContactarTienda.setVisibility(View.GONE);
            return;
        }

        enlace.botonContactarTienda.setVisibility(View.VISIBLE);
        enlace.botonContactarTienda.setOnClickListener(v -> {
            if (tiendas.size() == 1) {
                Map.Entry<String, String> unica = tiendas.entrySet().iterator().next();
                abrirChatTienda(unica.getKey(), unica.getValue());
            } else {
                mostrarSelectorTienda(tiendas);
            }
        });
    }

    private void mostrarSelectorTienda(Map<String, String> tiendas) {
        List<String> ids = new ArrayList<>(tiendas.keySet());
        String[] nombres = tiendas.values().toArray(new String[0]);
        new AlertDialog.Builder(this)
            .setTitle(R.string.elegir_tienda)
            .setItems(nombres, (dialogo, indice) ->
                abrirChatTienda(ids.get(indice), nombres[indice]))
            .show();
    }

    private void abrirChatTienda(String disenadorId, String nombreMarca) {
        Intent intent = new Intent(this, ActividadChat.class);
        intent.putExtra(Constantes.EXTRA_DISENADOR_ID, disenadorId);
        intent.putExtra(Constantes.EXTRA_DISENADOR_NOMBRE, nombreMarca);
        startActivity(intent);
    }

    /** Badge de estado: texto en color fuerte y fondo tintado claro. */
    private void pintarEstado(String estado) {
        int color = ContextCompat.getColor(this, EstadoPedidoUi.color(estado));
        enlace.textoEstado.setText(EstadoPedidoUi.etiqueta(estado));
        enlace.textoEstado.setTextColor(color);
        if (enlace.textoEstado.getBackground() != null) {
            enlace.textoEstado.getBackground().mutate()
                .setTint(ColorUtils.setAlphaComponent(color, 28));
        }
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
