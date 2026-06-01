package gal.galiciawear.app.ui.detalle;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

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

        // Botón AR stub — demuestra preparación para ARCore sin implementación completa
        // JUSTIFICACIÓN: La entrevista con Carlos mencionó RA; lo dejamos como stub
        // documentado para la defensa oral.
        enlace.botonVerEnHabitacion.setOnClickListener(v ->
            Toast.makeText(this,
                "Realidad Aumentada: requiere ARCore configurado con google-services real",
                Toast.LENGTH_LONG).show()
        );

        observarEstadoCarrito();
    }

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

    private void mostrarProducto(DtoRespuestaProducto producto) {
        this.productoActual = producto;

        enlace.textoNombreProducto.setText(producto.nombre);
        enlace.textoPrecio.setText(String.format("%.2f €", producto.precio));
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
        enlace.grupoChipsTallas.removeAllViews();
        if (producto.variantes != null) {
            for (DtoRespuestaProducto.DtoVariante v : producto.variantes) {
                if (v.stock <= 0) continue;
                Chip chip = new Chip(this);
                chip.setText(v.talla + " - " + v.color);
                chip.setCheckable(true);
                chip.setOnCheckedChangeListener((btn, marcado) -> {
                    if (marcado) varianteSeleccionadaId = v.id;
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
        }
    }

    private void añadirAlCarrito() {
        if (varianteSeleccionadaId == null) {
            Snackbar.make(enlace.getRoot(), "Selecciona una talla/color", Snackbar.LENGTH_SHORT).show();
            return;
        }
        modeloVistaCarrito.añadirAlCarrito(varianteSeleccionadaId, 1);
    }

    private void observarEstadoCarrito() {
        modeloVistaCarrito.observarOperacion().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.botonAnadirCarrito.setEnabled(false);
            } else if (recurso.esExito()) {
                enlace.botonAnadirCarrito.setEnabled(true);
                Snackbar.make(enlace.getRoot(), "Añadido al carrito", Snackbar.LENGTH_SHORT)
                    .setAction("Ver carrito", v -> finish())
                    .show();
            } else if (recurso.esError()) {
                enlace.botonAnadirCarrito.setEnabled(true);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
