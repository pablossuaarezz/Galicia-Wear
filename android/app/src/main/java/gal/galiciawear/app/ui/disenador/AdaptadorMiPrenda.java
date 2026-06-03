package gal.galiciawear.app.ui.disenador;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ItemMiPrendaBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;

/** Lista las prendas del diseñador (incluye inactivas) con su foto principal y precio. */
public class AdaptadorMiPrenda extends RecyclerView.Adapter<AdaptadorMiPrenda.Vista> {

    public interface AlPulsarPrenda {
        void alPulsar(DtoRespuestaProducto prenda);
    }

    private final List<DtoRespuestaProducto> items = new ArrayList<>();
    private final AlPulsarPrenda listener;

    public AdaptadorMiPrenda(AlPulsarPrenda listener) {
        this.listener = listener;
    }

    public void establecer(List<DtoRespuestaProducto> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemMiPrendaBinding enlace = ItemMiPrendaBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new Vista(enlace);
    }

    @Override
    public void onBindViewHolder(@NonNull Vista holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class Vista extends RecyclerView.ViewHolder {
        private final ItemMiPrendaBinding enlace;

        Vista(ItemMiPrendaBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoRespuestaProducto prenda, AlPulsarPrenda listener) {
            enlace.textoNombre.setText(prenda.nombre);
            enlace.textoPrecio.setText(String.format("%.2f €", prenda.precioBase));
            enlace.textoEstado.setVisibility(prenda.activo ? View.GONE : View.VISIBLE);

            if (prenda.imagenes != null && !prenda.imagenes.isEmpty()) {
                Glide.with(enlace.imagenPrenda.getContext())
                    .load(prenda.imagenes.get(0).url)
                    .placeholder(R.drawable.ic_placeholder_producto)
                    .centerCrop()
                    .into(enlace.imagenPrenda);
            } else {
                enlace.imagenPrenda.setImageResource(R.drawable.ic_placeholder_producto);
            }

            enlace.getRoot().setOnClickListener(v -> listener.alPulsar(prenda));
        }
    }
}
