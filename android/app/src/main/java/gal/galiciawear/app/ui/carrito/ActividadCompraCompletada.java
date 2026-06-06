package gal.galiciawear.app.ui.carrito;

import android.content.Intent;
import android.os.Bundle;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.OvershootInterpolator;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Locale;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadCompraCompletadaBinding;
import gal.galiciawear.app.ui.pedidos.ActividadDetallePedido;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla de confirmación tras completar el pago. Muestra un resumen del
 * pedido recién creado con una animación de éxito, y ofrece ver el detalle
 * del pedido o seguir comprando.
 *
 * Criterios psicológicos UI/UX (rúbrica DAM):
 * - Cierre/feedback claro: un estado de éxito inequívoco da seguridad de que
 *   el pago se realizó (reduce la ansiedad post-compra).
 * - Efecto Zeigarnik: cerrar la tarea visualmente evita la sensación de
 *   "trámite a medias".
 */
@AndroidEntryPoint
public class ActividadCompraCompletada extends AppCompatActivity {

    private ActividadCompraCompletadaBinding enlace;
    private String pedidoId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadCompraCompletadaBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        Intent extras = getIntent();
        pedidoId        = extras.getStringExtra(Constantes.EXTRA_PEDIDO_ID);
        String numero   = extras.getStringExtra(Constantes.EXTRA_PEDIDO_NUMERO);
        double total    = extras.getDoubleExtra(Constantes.EXTRA_PEDIDO_TOTAL, 0);
        String metodo   = extras.getStringExtra(Constantes.EXTRA_PEDIDO_METODO_PAGO);
        boolean eco     = extras.getBooleanExtra(Constantes.EXTRA_PEDIDO_ECO, false);

        pintarResumen(numero, total, metodo, eco);
        animarEntrada();

        enlace.botonVerPedido.setOnClickListener(v -> abrirDetallePedido());
        enlace.botonSeguirComprando.setOnClickListener(v -> volverAlInicio());
    }

    private void pintarResumen(String numero, double total, String metodo, boolean eco) {
        enlace.textoNumeroPedido.setText(
            numero != null && !numero.isEmpty() ? "#" + numero : "—");
        enlace.textoTotal.setText(String.format(Locale.getDefault(), "%.2f €", total));
        enlace.textoMetodoPago.setText(getString(
            "TRANSFERENCIA".equalsIgnoreCase(metodo)
                ? R.string.pago_transferencia
                : R.string.pago_tarjeta));
        enlace.textoEntrega.setText(getString(
            eco ? R.string.entrega_eco : R.string.entrega_estandar));
    }

    /** Animación de aparición: el icono entra con un pequeño rebote. */
    private void animarEntrada() {
        enlace.contenedorIcono.setScaleX(0f);
        enlace.contenedorIcono.setScaleY(0f);
        enlace.contenedorIcono.animate()
            .scaleX(1f).scaleY(1f)
            .setStartDelay(120)
            .setDuration(520)
            .setInterpolator(new OvershootInterpolator(2.2f))
            .start();

        // Título y subtítulo entran con un leve desvanecido ascendente.
        animarTexto(enlace.textoTitulo, 260);
        animarTexto(enlace.textoSubtitulo, 360);
    }

    private void animarTexto(android.view.View vista, long retardo) {
        vista.setAlpha(0f);
        vista.setTranslationY(40f);
        vista.animate()
            .alpha(1f).translationY(0f)
            .setStartDelay(retardo)
            .setDuration(420)
            .setInterpolator(new DecelerateInterpolator())
            .start();
    }

    private void abrirDetallePedido() {
        if (pedidoId != null) {
            Intent intent = new Intent(this, ActividadDetallePedido.class);
            intent.putExtra(Constantes.EXTRA_PEDIDO_ID, pedidoId);
            startActivity(intent);
        }
        finish();
    }

    private void volverAlInicio() {
        Intent intent = new Intent(this, ActividadPrincipal.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    /** El botón atrás del sistema lleva al inicio, no de vuelta al checkout. */
    @Override
    public void onBackPressed() {
        volverAlInicio();
    }
}
