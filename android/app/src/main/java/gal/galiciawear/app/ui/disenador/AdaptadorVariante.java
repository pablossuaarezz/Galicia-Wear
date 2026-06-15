package gal.galiciawear.app.ui.disenador;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.databinding.ItemVarianteBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoVariante;

/**
 * Lista las variantes (talla/color) de una prenda, con acción de eliminar.
 *
 * Se usa en el paso "Tallas y stock" del asistente {@link ActividadEditarPrenda}.
 * Cada variante corresponde a una combinación talla/color con su propio SKU,
 * stock y ajuste de precio.
 */
public class AdaptadorVariante extends RecyclerView.Adapter<AdaptadorVariante.Vista> {

    /** Callback que delega en la actividad la eliminación de una variante. */
    public interface AlEliminar {
        void alEliminar(DtoVariante variante);
    }

    private final List<DtoVariante> items = new ArrayList<>();
    private final AlEliminar listener;

    public AdaptadorVariante(AlEliminar listener) {
        this.listener = listener;
    }

    /**
     * Sustituye la lista completa de variantes mostradas y refresca el RecyclerView.
     * Se invoca cada vez que se recarga el listado de variantes de la prenda.
     */
    public void establecer(List<DtoVariante> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    /** Crea un nuevo ViewHolder inflando el layout de un elemento de variante. */
    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemVarianteBinding enlace = ItemVarianteBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new Vista(enlace);
    }

    /** Vincula los datos de la variante en la posición indicada con su ViewHolder. */
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

        /**
         * Rellena la vista de un elemento de variante: muestra "talla · color"
         * como título, "SKU ... · stock ..." como detalle, y conecta el botón
         * de eliminar con el callback correspondiente.
         */
        void enlazar(DtoVariante v, AlEliminar listener) {
            enlace.textoVariante.setText(v.talla + " · " + v.color);
            enlace.textoDetalleVariante.setText("SKU " + v.sku + " · stock " + v.stock);
            enlace.botonEliminarVariante.setOnClickListener(x -> listener.alEliminar(v));
        }
    }
}
