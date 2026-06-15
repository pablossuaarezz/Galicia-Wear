package gal.galiciawear.app.ui.carrito;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.databinding.ElementoItemCarritoBinding;

/**
 * Adaptador de las líneas del carrito.
 *
 * Cada línea ofrece un selector de cantidad (− N +) y un botón de eliminar.
 * El precio mostrado es el subtotal de la línea (precio unitario × cantidad),
 * calculado en el DTO para no duplicar la fórmula precioBase + ajustePrecio.
 */
public class AdaptadorItemCarrito extends RecyclerView.Adapter<AdaptadorItemCarrito.VH> {

    /** Tope de seguridad alineado con la validación del backend (máx. 99 por artículo). */
    private static final int CANTIDAD_MAXIMA = 99;

    /**
     * Callbacks que el fragmento contenedor implementa para reaccionar a las
     * acciones del usuario sobre una línea del carrito: cambiar la cantidad
     * de un artículo o eliminarlo por completo.
     */
    public interface Acciones {
        /** Se invoca cuando el usuario pulsa + o − y la nueva cantidad es válida. */
        void onCambiarCantidad(String varianteId, int nuevaCantidad);
        /** Se invoca cuando el usuario pulsa el botón de eliminar (papelera) de una línea. */
        void onEliminar(String varianteId);
    }

    private final List<DtoRespuestaCarrito.DtoItemCarrito> items = new ArrayList<>();
    private final Acciones acciones;

    /**
     * Crea el adaptador asociando el conjunto de callbacks que se invocarán
     * cuando el usuario interactúe con las líneas del carrito.
     *
     * @param acciones implementación de {@link Acciones} proporcionada por el fragmento
     */
    public AdaptadorItemCarrito(Acciones acciones) {
        this.acciones = acciones;
    }

    /**
     * Sustituye la lista completa de líneas del carrito y notifica al
     * RecyclerView para que se vuelva a pintar.
     *
     * @param nuevos nueva lista de items del carrito, o {@code null} para dejarlo vacío
     */
    public void establecerItems(List<DtoRespuestaCarrito.DtoItemCarrito> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    /** Infla el layout de una línea del carrito mediante ViewBinding y crea su ViewHolder. */
    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ElementoItemCarritoBinding enlace = ElementoItemCarritoBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false
        );
        return new VH(enlace);
    }

    /** Enlaza los datos del item de la posición indicada con las vistas del ViewHolder. */
    @Override
    public void onBindViewHolder(@NonNull VH holder, int pos) {
        holder.enlazar(items.get(pos), acciones);
    }

    /** Número de líneas actualmente en el carrito. */
    @Override
    public int getItemCount() { return items.size(); }

    /**
     * ViewHolder de una línea del carrito: muestra la imagen, nombre y
     * variante (talla/color) del producto, el subtotal de la línea, el
     * selector de cantidad (− N +) y el botón de eliminar.
     */
    static class VH extends RecyclerView.ViewHolder {
        private final ElementoItemCarritoBinding enlace;

        VH(ElementoItemCarritoBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        /**
         * Rellena las vistas de la línea del carrito con los datos del item
         * recibido: imagen y nombre del producto (con Glide), descripción de
         * la variante, precio (subtotal), cantidad actual, y configura los
         * listeners de los botones +, − y eliminar respetando los límites de
         * cantidad mínima (1) y máxima (stock disponible o tope de seguridad).
         *
         * @param item línea del carrito a representar
         * @param acciones callbacks para notificar cambios de cantidad o eliminación
         */
        void enlazar(DtoRespuestaCarrito.DtoItemCarrito item, Acciones acciones) {
            DtoRespuestaCarrito.DtoItemCarrito.DtoVarianteCarrito variante = item.variante;
            if (variante == null) return;

            if (variante.producto != null) {
                enlace.textoNombre.setText(variante.producto.nombre);
                String url = variante.producto.urlImagenPrincipal();
                // Carga asíncrona de la imagen del producto con Glide, mostrando
                // un placeholder mientras se descarga o si falla.
                Glide.with(enlace.imagenProducto.getContext())
                    .load(url)
                    .placeholder(R.drawable.ic_placeholder_producto)
                    .into(enlace.imagenProducto);
            }

            enlace.textoVariante.setText(descripcionVariante(variante));
            // El precio mostrado es el subtotal de la línea (precio unitario × cantidad).
            enlace.textoPrecio.setText(formatearPrecio(item.subtotal()));
            enlace.textoCantidad.setText(String.valueOf(item.cantidad));

            // Límites del selector: mínimo 1 (para llegar a 0 está la papelera).
            int maximo = variante.stock > 0 ? Math.min(variante.stock, CANTIDAD_MAXIMA) : CANTIDAD_MAXIMA;
            enlace.botonMenos.setEnabled(item.cantidad > 1);
            enlace.botonMenos.setAlpha(item.cantidad > 1 ? 1f : 0.35f);
            enlace.botonMas.setEnabled(item.cantidad < maximo);
            enlace.botonMas.setAlpha(item.cantidad < maximo ? 1f : 0.35f);

            // Botón "−": solo decrementa si queda por encima de 1 (para llegar a 0 se usa la papelera).
            enlace.botonMenos.setOnClickListener(v -> {
                if (item.cantidad > 1) {
                    acciones.onCambiarCantidad(variante.id, item.cantidad - 1);
                }
            });
            // Botón "+": solo incrementa si no se supera el stock disponible ni el tope de seguridad.
            enlace.botonMas.setOnClickListener(v -> {
                if (item.cantidad < maximo) {
                    acciones.onCambiarCantidad(variante.id, item.cantidad + 1);
                }
            });
            // Botón de eliminar: quita la línea completa del carrito, sin importar la cantidad.
            enlace.botonEliminar.setOnClickListener(v -> acciones.onEliminar(variante.id));
        }

        /**
         * Construye el texto descriptivo de la variante combinando talla y
         * color (si existen), separados por " · ". Si no hay ni talla ni
         * color, devuelve una cadena vacía.
         */
        private String descripcionVariante(
            DtoRespuestaCarrito.DtoItemCarrito.DtoVarianteCarrito variante) {
            StringBuilder sb = new StringBuilder();
            if (variante.talla != null && !variante.talla.isEmpty()) {
                sb.append("Talla ").append(variante.talla);
            }
            if (variante.color != null && !variante.color.isEmpty()) {
                if (sb.length() > 0) sb.append(" · ");
                sb.append(variante.color);
            }
            return sb.toString();
        }

        /** Formatea un importe como cantidad en euros con 2 decimales según el locale del dispositivo. */
        private String formatearPrecio(double valor) {
            return String.format(Locale.getDefault(), "%.2f €", valor);
        }
    }
}
