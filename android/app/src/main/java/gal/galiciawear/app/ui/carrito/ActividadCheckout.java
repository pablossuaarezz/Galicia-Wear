package gal.galiciawear.app.ui.carrito;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadCheckoutBinding;
import gal.galiciawear.app.modelovista.ModeloVistaPedidos;
import gal.galiciawear.app.ui.pedidos.ActividadDetallePedido;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla de checkout: confirma dirección, método de pago y envío eco.
 *
 * STUB de dirección: en el TFG se usa la primera dirección del backend.
 * Una implementación completa mostraría un selector de direcciones.
 */
@AndroidEntryPoint
public class ActividadCheckout extends AppCompatActivity {

    private ActividadCheckoutBinding enlace;
    private ModeloVistaPedidos modeloVista;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadCheckoutBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaPedidos.class);

        setSupportActionBar(enlace.barraHerramientas);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Confirmar pedido");
        }

        enlace.botonConfirmarPedido.setOnClickListener(v -> confirmarPedido());

        modeloVista.observarCreacion().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.botonConfirmarPedido.setEnabled(false);
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                // Navegar a detalle del pedido recién creado
                Intent intent = new Intent(this, ActividadDetallePedido.class);
                intent.putExtra(Constantes.EXTRA_PEDIDO_ID, recurso.datos.id);
                startActivity(intent);
                finish();
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonConfirmarPedido.setEnabled(true);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void confirmarPedido() {
        String metodoPago     = enlace.radioGrupoMetodoPago.getCheckedRadioButtonId() != -1
            ? "TARJETA" : "TRANSFERENCIA";
        boolean envioEcologico = enlace.switchEnvioEco.isChecked();
        // STUB: direccionId real vendría de un selector de direcciones
        String direccionId = "stub_direccion_id";
        modeloVista.realizarPedido(direccionId, metodoPago, envioEcologico);
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
