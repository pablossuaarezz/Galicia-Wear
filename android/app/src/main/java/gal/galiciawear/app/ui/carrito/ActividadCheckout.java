package gal.galiciawear.app.ui.carrito;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.RadioButton;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputEditText;

import java.util.List;
import java.util.Locale;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadCheckoutBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDireccion;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaDireccion;
import gal.galiciawear.app.modelovista.ModeloVistaCarrito;
import gal.galiciawear.app.modelovista.ModeloVistaDirecciones;
import gal.galiciawear.app.modelovista.ModeloVistaPedidos;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla de checkout: dirección de envío (elegir una guardada o crear una
 * nueva), método de pago y método de envío como selectores, resumen del total
 * y confirmación. Al confirmar crea el pedido contra el backend (que vacía el
 * carrito) y navega al detalle del pedido recién creado.
 */
@AndroidEntryPoint
public class ActividadCheckout extends AppCompatActivity {

    private ActividadCheckoutBinding enlace;
    private ModeloVistaPedidos modeloVistaPedidos;
    private ModeloVistaCarrito modeloVistaCarrito;
    private ModeloVistaDirecciones modeloVistaDirecciones;

    private String direccionSeleccionadaId;

    // Índices de los selectores (coinciden con el orden de las opciones).
    private static final int PAGO_TARJETA = 0;
    private static final int PAGO_TRANSFERENCIA = 1;
    private static final int ENVIO_ESTANDAR = 0;
    private static final int ENVIO_ECOLOGICO = 1;

    private int metodoPagoSeleccionado = PAGO_TARJETA;
    private int metodoEnvioSeleccionado = ENVIO_ESTANDAR;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadCheckoutBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVistaPedidos     = new ViewModelProvider(this).get(ModeloVistaPedidos.class);
        modeloVistaCarrito     = new ViewModelProvider(this).get(ModeloVistaCarrito.class);
        modeloVistaDirecciones = new ViewModelProvider(this).get(ModeloVistaDirecciones.class);

        setSupportActionBar(enlace.barraHerramientas);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.confirmar_pedido);
        }
        enlace.barraHerramientas.setNavigationOnClickListener(v -> finish());

        // Hasta tener una dirección elegida no se puede confirmar.
        enlace.botonConfirmarPedido.setEnabled(false);
        enlace.botonConfirmarPedido.setOnClickListener(v -> confirmarPedido());

        configurarSelectores();
        configurarFormularioDireccion();

        observarResumenCarrito();
        observarDirecciones();
        observarCreacionDireccion();
        observarCreacionPedido();
    }

    // ── Selectores de pago y envío ─────────────────────────────────────────────

    private void configurarSelectores() {
        ArrayAdapter<String> adaptadorPago = new ArrayAdapter<>(
            this, android.R.layout.simple_list_item_1, new String[]{
                getString(R.string.tarjeta_credito),
                getString(R.string.transferencia_bancaria)
            });
        enlace.selectorMetodoPago.setAdapter(adaptadorPago);
        enlace.selectorMetodoPago.setText(adaptadorPago.getItem(PAGO_TARJETA), false);
        enlace.selectorMetodoPago.setOnItemClickListener(
            (parent, view, posicion, id) -> metodoPagoSeleccionado = posicion);

        ArrayAdapter<String> adaptadorEnvio = new ArrayAdapter<>(
            this, android.R.layout.simple_list_item_1, new String[]{
                getString(R.string.envio_estandar),
                getString(R.string.envio_ecologico)
            });
        enlace.selectorMetodoEnvio.setAdapter(adaptadorEnvio);
        enlace.selectorMetodoEnvio.setText(adaptadorEnvio.getItem(ENVIO_ESTANDAR), false);
        enlace.selectorMetodoEnvio.setOnItemClickListener(
            (parent, view, posicion, id) -> metodoEnvioSeleccionado = posicion);
    }

    // ── Formulario de nueva dirección ──────────────────────────────────────────

    private void configurarFormularioDireccion() {
        enlace.botonAnadirDireccion.setOnClickListener(v -> mostrarFormulario(true));
        enlace.botonCancelarDireccion.setOnClickListener(v -> mostrarFormulario(false));
        enlace.botonGuardarDireccion.setOnClickListener(v -> guardarDireccion());
    }

    private void mostrarFormulario(boolean visible) {
        enlace.formularioDireccion.setVisibility(visible ? View.VISIBLE : View.GONE);
        enlace.botonAnadirDireccion.setVisibility(visible ? View.GONE : View.VISIBLE);
    }

    private void guardarDireccion() {
        String alias  = textoDe(enlace.entradaAlias);
        String linea1 = textoDe(enlace.entradaLinea1);
        String linea2 = textoDe(enlace.entradaLinea2);
        String ciudad = textoDe(enlace.entradaCiudad);
        String cp     = textoDe(enlace.entradaCp);
        String provincia = textoDe(enlace.entradaProvincia);

        boolean valido = true;
        if (alias.isEmpty()) {
            enlace.entradaAlias.setError(getString(R.string.campo_obligatorio));
            valido = false;
        }
        if (linea1.length() < 5) {
            enlace.entradaLinea1.setError(getString(R.string.campo_obligatorio));
            valido = false;
        }
        if (ciudad.isEmpty()) {
            enlace.entradaCiudad.setError(getString(R.string.campo_obligatorio));
            valido = false;
        }
        if (!cp.matches("\\d{5}")) {
            enlace.entradaCp.setError(getString(R.string.error_codigo_postal));
            valido = false;
        }
        if (!valido) return;

        if (provincia.isEmpty()) provincia = getString(R.string.provincia_por_defecto);

        enlace.botonGuardarDireccion.setEnabled(false);
        modeloVistaDirecciones.crearDireccion(new DtoPeticionDireccion(
            alias, linea1, linea2.isEmpty() ? null : linea2, ciudad, cp, provincia, "ES"));
    }

    private void observarCreacionDireccion() {
        modeloVistaDirecciones.observarCreacion().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.botonGuardarDireccion.setEnabled(false);
            } else if (recurso.esExito()) {
                enlace.botonGuardarDireccion.setEnabled(true);
                limpiarFormulario();
                mostrarFormulario(false);
                Snackbar.make(enlace.getRoot(), R.string.direccion_guardada, Snackbar.LENGTH_SHORT).show();
                // La lista se recarga sola desde el ViewModel; el observador de
                // direcciones la repinta y selecciona la nueva (la última).
            } else if (recurso.esError()) {
                enlace.botonGuardarDireccion.setEnabled(true);
                Snackbar.make(enlace.getRoot(),
                    recurso.mensaje != null ? recurso.mensaje : getString(R.string.error_generico),
                    Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void limpiarFormulario() {
        enlace.entradaAlias.setText("");
        enlace.entradaLinea1.setText("");
        enlace.entradaLinea2.setText("");
        enlace.entradaCiudad.setText("");
        enlace.entradaCp.setText("");
        enlace.entradaProvincia.setText(R.string.provincia_por_defecto);
    }

    private String textoDe(TextInputEditText campo) {
        campo.setError(null);
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    // ── Resumen del carrito ──────────────────────────────────────────────────

    private void observarResumenCarrito() {
        modeloVistaCarrito.observarCarrito().observe(this, recurso -> {
            if (recurso == null || !recurso.esExito() || recurso.datos == null) return;
            double total = recurso.datos.calcularTotal();
            String totalFmt = String.format(Locale.getDefault(), "%.2f €", total);
            enlace.textoSubtotal.setText(totalFmt);
            enlace.textoTotal.setText(totalFmt);
            enlace.botonConfirmarPedido.setText(
                getString(R.string.pagar) + "  " + totalFmt);
        });
        modeloVistaCarrito.cargarCarrito();
    }

    // ── Direcciones ──────────────────────────────────────────────────────────

    private void observarDirecciones() {
        modeloVistaDirecciones.obtenerDirecciones().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                pintarDirecciones(recurso.datos);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                mostrarSinDirecciones();
                if (recurso.mensaje != null) {
                    Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
                }
            }
        });
    }

    private void pintarDirecciones(List<DtoRespuestaDireccion> direcciones) {
        enlace.contenedorDirecciones.removeAllViews();
        if (direcciones == null || direcciones.isEmpty()) {
            mostrarSinDirecciones();
            return;
        }
        enlace.textoSinDirecciones.setVisibility(View.GONE);

        for (DtoRespuestaDireccion direccion : direcciones) {
            RadioButton opcion = new RadioButton(this);
            opcion.setId(View.generateViewId());
            opcion.setTag(direccion.id);
            opcion.setPadding(24, 24, 24, 24);
            opcion.setText(textoDireccion(direccion));
            enlace.contenedorDirecciones.addView(opcion);
        }

        enlace.contenedorDirecciones.setOnCheckedChangeListener((grupo, idMarcado) -> {
            RadioButton marcado = grupo.findViewById(idMarcado);
            if (marcado != null) {
                direccionSeleccionadaId = (String) marcado.getTag();
                enlace.botonConfirmarPedido.setEnabled(direccionSeleccionadaId != null);
            }
        });

        // Selecciona la última (si se acaba de crear, es la nueva); si no, la primera.
        RadioButton aMarcar = (RadioButton) enlace.contenedorDirecciones.getChildAt(
            enlace.contenedorDirecciones.getChildCount() - 1);
        aMarcar.setChecked(true);
    }

    private void mostrarSinDirecciones() {
        enlace.contenedorDirecciones.removeAllViews();
        enlace.textoSinDirecciones.setVisibility(View.VISIBLE);
        direccionSeleccionadaId = null;
        enlace.botonConfirmarPedido.setEnabled(false);
    }

    private String textoDireccion(DtoRespuestaDireccion direccion) {
        String alias = direccion.alias != null ? direccion.alias : "";
        return alias + "\n" + direccion.resumen();
    }

    // ── Creación del pedido ──────────────────────────────────────────────────

    private void confirmarPedido() {
        if (direccionSeleccionadaId == null) {
            Snackbar.make(enlace.getRoot(), R.string.sin_direcciones, Snackbar.LENGTH_LONG).show();
            return;
        }
        String metodoPago = metodoPagoSeleccionado == PAGO_TRANSFERENCIA ? "TRANSFERENCIA" : "TARJETA";
        boolean envioEcologico = metodoEnvioSeleccionado == ENVIO_ECOLOGICO;
        modeloVistaPedidos.realizarPedido(direccionSeleccionadaId, metodoPago, envioEcologico);
    }

    private void observarCreacionPedido() {
        modeloVistaPedidos.observarCreacion().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.botonConfirmarPedido.setEnabled(false);
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                // El backend ya vació el carrito; lo reflejamos en local (badge, lista).
                modeloVistaCarrito.vaciarTrasPedido();
                Intent intent = new Intent(this, ActividadCompraCompletada.class);
                intent.putExtra(Constantes.EXTRA_PEDIDO_ID, recurso.datos.id);
                intent.putExtra(Constantes.EXTRA_PEDIDO_NUMERO, recurso.datos.numeroPedido);
                intent.putExtra(Constantes.EXTRA_PEDIDO_TOTAL, recurso.datos.total);
                intent.putExtra(Constantes.EXTRA_PEDIDO_METODO_PAGO,
                    metodoPagoSeleccionado == PAGO_TRANSFERENCIA ? "TRANSFERENCIA" : "TARJETA");
                intent.putExtra(Constantes.EXTRA_PEDIDO_ECO,
                    metodoEnvioSeleccionado == ENVIO_ECOLOGICO);
                startActivity(intent);
                finish();
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonConfirmarPedido.setEnabled(true);
                Snackbar.make(enlace.getRoot(),
                    recurso.mensaje != null ? recurso.mensaje : getString(R.string.error_generico),
                    Snackbar.LENGTH_LONG).show();
            }
        });
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
