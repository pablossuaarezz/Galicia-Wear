package gal.galiciawear.app.ui.disenador;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.databinding.ItemVarianteBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoVariante;

/** Lista las variantes (talla/color) de una prenda, con acción de eliminar. */
public class AdaptadorVariante extends RecyclerView.Adapter<AdaptadorVariante.Vista> {

    public interface AlEliminar {
        void alEliminar(DtoVariante variante);
    }

    private final List<DtoVariante> items = new ArrayList<>();
    private final AlEliminar listener;

    public AdaptadorVariante(AlEliminar listener) {
        this.listener = listener;
    }

    public void establecer(List<DtoVariante> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemVarianteBinding enlace = ItemVarianteBinding.inflate(
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
        private final ItemVarianteBinding enlace;

        Vista(ItemVarianteBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoVariante v, AlEliminar listener) {
            enlace.textoVariante.setText(v.talla + " · " + v.color);
            enlace.textoDetalleVariante.setText("SKU " + v.sku + " · stock " + v.stock);
            enlace.botonEliminarVariante.setOnClickListener(x -> listener.alEliminar(v));
        }
    }
}
