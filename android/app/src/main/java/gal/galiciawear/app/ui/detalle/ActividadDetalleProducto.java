package gal.galiciawear.app.ui.detalle;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.bumptech.glide.Glide;
import com.google.android.material.chip.Chip;
import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadDetalleProductoBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.modelovista.ModeloVistaCarrito;
import gal.galiciawear.app.modelovista.ModeloVistaProductos;
import gal.galiciawear.app.utilidades.Constantes;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * Pantalla de detalle del producto.
 *
 * Criterios psicológicos aplicados:
 * - Ley de Fitts: botón "Añadir al carrito" grande, anclado abajo (alcance del pulgar).
 * - Feedback inmediato: Snackbar al añadir con acción "Ver carrito".
 * - Prevención de errores: el botón se desactiva mientras carga.
 * - Accesibilidad: contentDescription en imágenes, contraste AA.
 */
@AndroidEntryPoint
public class ActividadDetalleProducto extends AppCompatActivity {

    private ActividadDetalleProductoBinding enlace;
    private ModeloVistaProductos modeloVistaProductos;
    private ModeloVistaCarrito modeloVistaCarrito;
    private DtoRespuestaProducto productoActual;
    private String varianteSeleccionadaId;
    private double precioBaseProducto;

    /**
     * Inicializa la pantalla de detalle: infla el binding, obtiene los
     * ViewModels de productos y carrito, configura la barra de herramientas
     * con botón de retroceso, lee el slug del producto recibido por
     * {@link android.content.Intent} y carga sus datos, registra el listener
     * del botón de añadir al carrito y refresca el carrito (para mantener el
     * badge actualizado).
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadDetalleProductoBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVistaProductos = new ViewModelProvider(this).get(ModeloVistaProductos.class);
        modeloVistaCarrito   = new ViewModelProvider(this).get(ModeloVistaCarrito.class);

        setSupportActionBar(enlace.barraHerramientas);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        String slug = getIntent().getStringExtra(Constantes.EXTRA_PRODUCTO_SLUG);
        if (slug != null) {
            cargarProducto(slug);
        }

        enlace.botonAnadirCarrito.setOnClickListener(v -> añadirAlCarrito());

        // Mantiene el badge del carrito al día también desde el detalle.
        modeloVistaCarrito.cargarCarrito();
    }

    /**
     * Solicita al ViewModel el detalle del producto identificado por su slug
     * y observa el resultado: muestra el indicador de carga mientras se
     * obtiene, pinta el contenido en caso de éxito, o muestra un Snackbar de
     * error si la petición falla.
     *
     * @param slug identificador legible del producto en la URL/recursos
     */
    private void cargarProducto(String slug) {
        modeloVistaProductos.cargarDetalle(slug);
        modeloVistaProductos.observarDetalle().observe(this, recurso -> {
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
                enlace.contenidoDetalle.setVisibility(View.GONE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.contenidoDetalle.setVisibility(View.VISIBLE);
                mostrarProducto(recurso.datos);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    /**
     * Rellena toda la pantalla con los datos del producto recibido: nombre,
     * precio (con la corrección de "precioBase" frente a "precio"),
     * descripción, material, distancia de origen, imagen principal, chips de
     * variantes (talla/color) disponibles y chips informativos de
     * certificados de sostenibilidad, además de los datos del diseñador y el
     * botón de contacto con la tienda.
     *
     * @param producto datos completos del producto devueltos por el backend
     */
    private void mostrarProducto(DtoRespuestaProducto producto) {
        this.productoActual = producto;

        // El backend envía el precio en "precioBase"; "precio" puede llegar a 0.
        precioBaseProducto = producto.precio > 0 ? producto.precio : producto.precioBase;

        enlace.textoNombreProducto.setText(producto.nombre);
        enlace.textoPrecio.setText(String.format("%.2f €", precioBaseProducto));
        enlace.textoDescripcion.setText(producto.descripcion);
        enlace.textoMaterial.setText(producto.materialPrincipal);
        enlace.textoKm.setText(producto.kmOrigen + " km del origen");

        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(producto.nombre);
        }

        // Imagen principal
        if (producto.imagenes != null && !producto.imagenes.isEmpty()) {
            String url = producto.imagenes.get(0).url;
            Glide.with(this)
                .load(url)
                .placeholder(R.drawable.ic_placeholder_producto)
                .into(enlace.imagenProducto);
            enlace.imagenProducto.setContentDescription(
                "Imagen de " + producto.nombre
            );
        }

        // Chips de variantes (Ley de Hick: chips agrupados, no lista interminable)
        // Solo se muestran las variantes con stock disponible (>0).
        enlace.grupoChipsTallas.removeAllViews();
        if (producto.variantes != null) {
            for (DtoRespuestaProducto.DtoVariante v : producto.variantes) {
                if (v.stock <= 0) continue;
                Chip chip = new Chip(this);
                chip.setText(v.talla + " - " + v.color);
                chip.setCheckable(true);
                // Al marcar una variante, se guarda su id (necesario para
                // añadir al carrito) y se actualiza el precio mostrado
                // sumando el ajuste propio de esa variante al precio base.
                chip.setOnCheckedChangeListener((btn, marcado) -> {
                    if (marcado) {
                        varianteSeleccionadaId = v.id;
                        // El precio de la variante = precio base + ajuste de la variante.
                        double ajuste = v.ajustePrecio != null ? v.ajustePrecio : 0;
                        enlace.textoPrecio.setText(String.format("%.2f €", precioBaseProducto + ajuste));
                    }
                });
                enlace.grupoChipsTallas.addView(chip);
            }
        }

        // Chips de certificados de sostenibilidad
        enlace.grupoChipsCertificados.removeAllViews();
        if (producto.certificados != null) {
            for (DtoRespuestaProducto.DtoCertificado c : producto.certificados) {
                if (c.certificado == null) continue;
                Chip chip = new Chip(this);
                chip.setText(c.certificado.nombre);
                chip.setEnabled(false); // Solo informativo
                enlace.grupoChipsCertificados.addView(chip);
            }
        }

        // Diseñador
        if (producto.disenador != null) {
            enlace.textoMarca.setText(producto.disenador.nombreMarca);
            enlace.textoCiudad.setText(producto.disenador.ciudad);
            // Chat de soporte directo con la tienda (Socket.IO). El id del diseñador
            // (= id de Usuario) viene al nivel superior del producto en `disenadorId`.
            enlace.botonContactarTienda.setVisibility(View.VISIBLE);
            enlace.botonContactarTienda.setOnClickListener(v -> abrirChatTienda(
                producto.disenadorId, producto.disenador.nombreMarca));
        } else {
            enlace.botonContactarTienda.setVisibility(View.GONE);
        }
    }

    /** Abre el chat de soporte con la tienda (diseñador) del producto. */
    private void abrirChatTienda(String disenadorId, String nombreMarca) {
        if (disenadorId == null || disenadorId.isEmpty()) {
            Snackbar.make(enlace.getRoot(), R.string.contactar_no_disponible, Snackbar.LENGTH_SHORT).show();
            return;
        }
        Intent intent = new Intent(this, gal.galiciawear.app.ui.chat.ActividadChat.class);
        intent.putExtra(Constantes.EXTRA_DISENADOR_ID, disenadorId);
        intent.putExtra(Constantes.EXTRA_DISENADOR_NOMBRE, nombreMarca);
        startActivity(intent);
    }

    /**
     * Añade al carrito una unidad de la variante seleccionada. Si el usuario
     * no ha elegido aún ninguna talla/color, se muestra un aviso y no se
     * realiza la petición.
     */
    private void añadirAlCarrito() {
        if (varianteSeleccionadaId == null) {
            mostrarAviso(getString(R.string.selecciona_variante), Snackbar.LENGTH_SHORT, false);
            return;
        }
        // LiveData de un solo uso, observado con el ciclo de vida de la actividad
        // (sin observeForever): no filtra observadores aunque se pulse varias veces.
        modeloVistaCarrito.añadirAlCarrito(varianteSeleccionadaId, 1)
            .observe(this, recurso -> {
                if (recurso == null) return;
                if (recurso.estaCargando()) {
                    enlace.botonAnadirCarrito.setEnabled(false);
                } else if (recurso.esExito()) {
                    enlace.botonAnadirCarrito.setEnabled(true);
                    mostrarAviso(getString(R.string.articulo_anadido), Snackbar.LENGTH_LONG, true);
                } else if (recurso.esError()) {
                    enlace.botonAnadirCarrito.setEnabled(true);
                    mostrarAviso(recurso.mensaje, Snackbar.LENGTH_LONG, false);
                }
            });
    }

    /**
     * Muestra un Snackbar anclado SOBRE la barra inferior de botones. Sin el anclaje,
     * el Snackbar aparece al fondo del CoordinatorLayout y queda tapado por esa barra
     * (opaca y con más elevación), por lo que el usuario no veía ningún aviso.
     */
    private void mostrarAviso(String mensaje, int duracion, boolean conAccionVerCarrito) {
        if (enlace == null || mensaje == null) return;
        Snackbar snackbar = Snackbar.make(enlace.getRoot(), mensaje, duracion)
            .setAnchorView(enlace.botonAnadirCarrito);
        if (conAccionVerCarrito) {
            snackbar.setAction(getString(R.string.ver_carrito), v -> abrirCarrito());
        }
        snackbar.show();
    }

    /**
     * Navega a la pantalla principal indicando que debe abrirse directamente
     * la pestaña del carrito, reutilizando la instancia existente de
     * {@code ActividadPrincipal} (FLAG_ACTIVITY_CLEAR_TOP + SINGLE_TOP) y
     * cerrando esta pantalla de detalle.
     */
    private void abrirCarrito() {
        Intent intent = new Intent(this, gal.galiciawear.app.ui.principal.ActividadPrincipal.class);
        intent.putExtra(Constantes.EXTRA_ABRIR_CARRITO, true);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    /** Hace que la flecha de retroceso de la barra de herramientas cierre la actividad. */
    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
