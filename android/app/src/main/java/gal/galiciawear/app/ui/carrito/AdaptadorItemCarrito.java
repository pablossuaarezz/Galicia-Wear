package gal.galiciawear.app.ui.carrito;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.databinding.ElementoItemCarritoBinding;

public class AdaptadorItemCarrito extends RecyclerView.Adapter<AdaptadorItemCarrito.VH> {

    public interface OnEliminarListener { void onEliminar(String varianteId); }

    private final List<DtoRespuestaCarrito.DtoItemCarrito> items = new ArrayList<>();
    private final OnEliminarListener listener;

    public AdaptadorItemCarrito(OnEliminarListener listener) {
        this.listener = listener;
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
        holder.enlazar(items.get(pos), listener);
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class VH extends RecyclerView.ViewHolder {
        private final ElementoItemCarritoBinding enlace;
        VH(ElementoItemCarritoBinding enlace) { super(enlace.getRoot()); this.enlace = enlace; }

        void enlazar(DtoRespuestaCarrito.DtoItemCarrito item, OnEliminarListener listener) {
            DtoRespuestaCarrito.DtoItemCarrito.DtoVarianteCarrito variante = item.variante;
            if (variante != null && variante.producto != null) {
                enlace.textoNombre.setText(variante.producto.nombre);
                Double precio = variante.precio != null ? variante.precio : variante.producto.precio;
                enlace.textoPrecio.setText(String.format("%.2f €", precio * item.cantidad));
                enlace.textoCantidad.setText("Cantidad: " + item.cantidad);

                if (variante.producto.imagenes != null && !variante.producto.imagenes.isEmpty()) {
                    Glide.with(enlace.imagenProducto.getContext())
                        .load(variante.producto.imagenes.get(0).url)
                        .placeholder(R.drawable.ic_placeholder_producto)
                        .into(enlace.imagenProducto);
                }
            }
            enlace.botonEliminar.setOnClickListener(v -> listener.onEliminar(variante.id));
        }
    }
}
