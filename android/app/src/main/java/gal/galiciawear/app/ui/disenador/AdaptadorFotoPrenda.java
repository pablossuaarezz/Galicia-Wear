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
import gal.galiciawear.app.databinding.ItemFotoPrendaBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoImagen;

/**
 * Adaptador de RecyclerView que lista las fotos de una prenda durante el
 * asistente de edición ({@link ActividadEditarPrenda}, paso "Fotos").
 *
 * Las imágenes se reciben como {@link DtoImagen}, cuyo campo {@code url} puede
 * apuntar tanto a una URL remota como a un data URI base64 (Glide soporta ambos
 * formatos de forma transparente). Para cada foto se ofrecen dos acciones:
 * marcarla como principal y eliminarla.
 */
public class AdaptadorFotoPrenda extends RecyclerView.Adapter<AdaptadorFotoPrenda.Vista> {

    /** Callbacks que delegan en la actividad las acciones sobre cada foto. */
    public interface AlActuarSobreFoto {
        void alEliminar(DtoImagen imagen);
        void alMarcarPrincipal(DtoImagen imagen);
    }

    private final List<DtoImagen> items = new ArrayList<>();
    private final AlActuarSobreFoto listener;

    public AdaptadorFotoPrenda(AlActuarSobreFoto listener) {
        this.listener = listener;
    }

    /**
     * Sustituye la lista completa de fotos mostradas y refresca el RecyclerView.
     * Se usa cada vez que se recarga el listado de imágenes desde el ViewModel.
     */
    public void establecer(List<DtoImagen> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    /** Crea un nuevo ViewHolder inflando el layout de un elemento de foto. */
    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemFotoPrendaBinding enlace = ItemFotoPrendaBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new Vista(enlace);
    }

    /** Vincula los datos de la foto en la posición indicada con su ViewHolder. */
    @Override
    public void onBindViewHolder(@NonNull Vista holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class Vista extends RecyclerView.ViewHolder {
        private final ItemFotoPrendaBinding enlace;

        Vista(ItemFotoPrendaBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        /**
         * Rellena la vista de un elemento de foto: muestra la URL/data URI en
         * texto, la etiqueta "principal" si corresponde, la miniatura cargada
         * con Glide y conecta los botones de marcar como principal y eliminar.
         */
        void enlazar(DtoImagen img, AlActuarSobreFoto listener) {
            enlace.textoUrl.setText(img.url);
            enlace.etiquetaPrincipal.setVisibility(img.esPrincipal ? View.VISIBLE : View.GONE);
            // Si ya es principal, no tiene sentido ofrecer "hacer principal".
            enlace.botonPrincipal.setVisibility(img.esPrincipal ? View.GONE : View.VISIBLE);

            Glide.with(enlace.imagenFoto.getContext())
                .load(img.url)
                .placeholder(R.drawable.ic_placeholder_producto)
                .centerCrop()
                .into(enlace.imagenFoto);

            enlace.botonPrincipal.setOnClickListener(v -> listener.alMarcarPrincipal(img));
            enlace.botonEliminarFoto.setOnClickListener(v -> listener.alEliminar(img));
        }
    }
}
