package gal.galiciawear.app.ui.pedidos;

import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadDetallePedidoBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.modelovista.ModeloVistaPedidos;
import gal.galiciawear.app.utilidades.Constantes;

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
            getSupportActionBar().setTitle("Pedido " + pedido.numeroPedido);
        }
        enlace.textoEstado.setText(pedido.estado);
        enlace.textoTotal.setText(String.format("%.2f €", pedido.total));
        enlace.textoMetodoPago.setText(pedido.metodoPago);
        enlace.textoFecha.setText(pedido.fechaCreacion);

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
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
