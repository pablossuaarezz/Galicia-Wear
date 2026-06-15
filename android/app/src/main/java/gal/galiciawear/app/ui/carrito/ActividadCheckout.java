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

    /**
     * Inicializa la pantalla de checkout: infla el binding, obtiene los
     * ViewModels necesarios (pedidos, carrito y direcciones), configura la
     * barra de herramientas con botón de retroceso, deja el botón de
     * confirmar pedido deshabilitado hasta que haya una dirección seleccionada,
     * y registra los listeners y observadores de selectores, formulario de
     * dirección, resumen del carrito, direcciones y creación del pedido.
     */
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

    /**
     * Configura los desplegables (AutoCompleteTextView de Material) de método
     * de pago (tarjeta/transferencia) y método de envío (estándar/ecológico),
     * fijando una selección por defecto y actualizando las variables de
     * estado {@link #metodoPagoSeleccionado} y {@link #metodoEnvioSeleccionado}
     * cuando el usuario elige otra opción.
     */
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

    /**
     * Registra los listeners para mostrar/ocultar el formulario de nueva
     * dirección de envío y para guardar la dirección introducida.
     */
    private void configurarFormularioDireccion() {
        enlace.botonAnadirDireccion.setOnClickListener(v -> mostrarFormulario(true));
        enlace.botonCancelarDireccion.setOnClickListener(v -> mostrarFormulario(false));
        enlace.botonGuardarDireccion.setOnClickListener(v -> guardarDireccion());
    }

    /** Muestra u oculta el formulario de nueva dirección y el botón "añadir dirección" de forma exclusiva. */
    private void mostrarFormulario(boolean visible) {
        enlace.formularioDireccion.setVisibility(visible ? View.VISIBLE : View.GONE);
        enlace.botonAnadirDireccion.setVisibility(visible ? View.GONE : View.VISIBLE);
    }

    /**
     * Valida los campos del formulario de nueva dirección (alias, línea 1,
     * ciudad y código postal obligatorios; provincia opcional con valor por
     * defecto) y, si son correctos, deshabilita el botón de guardar y solicita
     * al ViewModel de direcciones la creación de la nueva dirección.
     */
    private void guardarDireccion() {
        String alias  = textoDe(enlace.entradaAlias);
        String linea1 = textoDe(enlace.entradaLinea1);
        String linea2 = textoDe(enlace.entradaLinea2);
        String ciudad = textoDe(enlace.entradaCiudad);
        String cp     = textoDe(enlace.entradaCp);
        String provincia = textoDe(enlace.entradaProvincia);

        // Validación de campos obligatorios (alias, dirección, ciudad y CP).
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

        // Si no se indica provincia, se usa el valor por defecto del proyecto.
        if (provincia.isEmpty()) provincia = getString(R.string.provincia_por_defecto);

        enlace.botonGuardarDireccion.setEnabled(false);
        modeloVistaDirecciones.crearDireccion(new DtoPeticionDireccion(
            alias, linea1, linea2.isEmpty() ? null : linea2, ciudad, cp, provincia, "ES"));
    }

    /**
     * Observa el resultado de la creación de una nueva dirección de envío:
     * mientras carga deshabilita el botón de guardar; en caso de éxito limpia
     * y oculta el formulario y muestra un mensaje de confirmación (la lista de
     * direcciones se recarga automáticamente desde el ViewModel); en caso de
     * error muestra el mensaje correspondiente.
     */
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

    /** Vacía todos los campos del formulario de nueva dirección tras guardarla con éxito. */
    private void limpiarFormulario() {
        enlace.entradaAlias.setText("");
        enlace.entradaLinea1.setText("");
        enlace.entradaLinea2.setText("");
        enlace.entradaCiudad.setText("");
        enlace.entradaCp.setText("");
        enlace.entradaProvincia.setText(R.string.provincia_por_defecto);
    }

    /** Limpia el error previo del campo y devuelve su texto sin espacios al inicio/final (o vacío si es nulo). */
    private String textoDe(TextInputEditText campo) {
        campo.setError(null);
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    // ── Resumen del carrito ──────────────────────────────────────────────────

    /**
     * Observa el contenido del carrito para calcular y mostrar el subtotal,
     * el total y el texto del botón de confirmar pedido (que incluye el
     * importe a pagar), y solicita la carga inicial del carrito.
     */
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

    /**
     * Observa la lista de direcciones de envío del usuario: muestra el
     * indicador de carga mientras se obtienen, las pinta como radio buttons en
     * caso de éxito, o muestra el mensaje "sin direcciones" junto con un
     * posible mensaje de error si la petición falla.
     */
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

    /**
     * Genera dinámicamente un {@link RadioButton} por cada dirección de envío
     * del usuario dentro de un {@code RadioGroup}, guardando el id de la
     * dirección en el {@code tag} de la vista para recuperarlo al
     * seleccionarla. Si no hay direcciones, muestra el mensaje
     * correspondiente. Tras pintarlas, marca por defecto la última (que será
     * la recién creada si se acaba de añadir una).
     *
     * @param direcciones lista de direcciones de envío del usuario, o {@code null}/vacía si no tiene ninguna
     */
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

        // Al cambiar la selección, se guarda el id de la dirección elegida y
        // se habilita el botón de confirmar pedido (si hay una marcada).
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

    /** Limpia el contenedor de direcciones, muestra el mensaje "sin direcciones" y deshabilita el pago. */
    private void mostrarSinDirecciones() {
        enlace.contenedorDirecciones.removeAllViews();
        enlace.textoSinDirecciones.setVisibility(View.VISIBLE);
        direccionSeleccionadaId = null;
        enlace.botonConfirmarPedido.setEnabled(false);
    }

    /** Construye el texto a mostrar en el radio button: alias en una línea y resumen de la dirección debajo. */
    private String textoDireccion(DtoRespuestaDireccion direccion) {
        String alias = direccion.alias != null ? direccion.alias : "";
        return alias + "\n" + direccion.resumen();
    }

    // ── Creación del pedido ──────────────────────────────────────────────────

    /**
     * Confirma el pedido: comprueba que haya una dirección seleccionada,
     * traduce los índices de los selectores de pago/envío a los valores que
     * espera el backend ("TARJETA"/"TRANSFERENCIA" y envío ecológico
     * booleano) y solicita al ViewModel la creación del pedido.
     */
    private void confirmarPedido() {
        if (direccionSeleccionadaId == null) {
            Snackbar.make(enlace.getRoot(), R.string.sin_direcciones, Snackbar.LENGTH_LONG).show();
            return;
        }
        String metodoPago = metodoPagoSeleccionado == PAGO_TRANSFERENCIA ? "TRANSFERENCIA" : "TARJETA";
        boolean envioEcologico = metodoEnvioSeleccionado == ENVIO_ECOLOGICO;
        modeloVistaPedidos.realizarPedido(direccionSeleccionadaId, metodoPago, envioEcologico);
    }

    /**
     * Observa el resultado de la creación del pedido: mientras carga,
     * deshabilita el botón de confirmar y muestra el indicador de carga; en
     * caso de éxito, refleja en local que el carrito ya fue vaciado por el
     * backend y navega a la pantalla de compra completada pasándole los datos
     * del pedido recién creado; en caso de error, reactiva el botón y muestra
     * un mensaje.
     */
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

    /** Hace que la flecha de retroceso de la barra de herramientas cierre la actividad. */
    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
