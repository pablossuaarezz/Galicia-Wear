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

    public interface Acciones {
        void onCambiarCantidad(String varianteId, int nuevaCantidad);
        void onEliminar(String varianteId);
    }

    private final List<DtoRespuestaCarrito.DtoItemCarrito> items = new ArrayList<>();
    private final Acciones acciones;

    public AdaptadorItemCarrito(Acciones acciones) {
        this.acciones = acciones;
    }

    public void establecerItems(List<DtoRespuestaCarrito.DtoItemCarrito> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ElementoItemCarritoBinding enlace = ElementoItemCarritoBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false
        );
        return new VH(enlace);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int pos) {
        holder.enlazar(items.get(pos), acciones);
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class VH extends RecyclerView.ViewHolder {
        private final ElementoItemCarritoBinding enlace;

        VH(ElementoItemCarritoBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoRespuestaCarrito.DtoItemCarrito item, Acciones acciones) {
            DtoRespuestaCarrito.DtoItemCarrito.DtoVarianteCarrito variante = item.variante;
            if (variante == null) return;

            if (variante.producto != null) {
                enlace.textoNombre.setText(variante.producto.nombre);
                String url = variante.producto.urlImagenPrincipal();
                Glide.with(enlace.imagenProducto.getContext())
                    .load(url)
                    .placeholder(R.drawable.ic_placeholder_producto)
                    .into(enlace.imagenProducto);
            }

            enlace.textoVariante.setText(descripcionVariante(variante));
            enlace.textoPrecio.setText(formatearPrecio(item.subtotal()));
            enlace.textoCantidad.setText(String.valueOf(item.cantidad));

            // Límites del selector: mínimo 1 (para llegar a 0 está la papelera).
            int maximo = variante.stock > 0 ? Math.min(variante.stock, CANTIDAD_MAXIMA) : CANTIDAD_MAXIMA;
            enlace.botonMenos.setEnabled(item.cantidad > 1);
            enlace.botonMenos.setAlpha(item.cantidad > 1 ? 1f : 0.35f);
            enlace.botonMas.setEnabled(item.cantidad < maximo);
            enlace.botonMas.setAlpha(item.cantidad < maximo ? 1f : 0.35f);

            enlace.botonMenos.setOnClickListener(v -> {
                if (item.cantidad > 1) {
                    acciones.onCambiarCantidad(variante.id, item.cantidad - 1);
                }
            });
            enlace.botonMas.setOnClickListener(v -> {
                if (item.cantidad < maximo) {
                    acciones.onCambiarCantidad(variante.id, item.cantidad + 1);
                }
            });
            enlace.botonEliminar.setOnClickListener(v -> acciones.onEliminar(variante.id));
        }

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

        private String formatearPrecio(double valor) {
            return String.format(Locale.getDefault(), "%.2f €", valor);
        }
    }
}
