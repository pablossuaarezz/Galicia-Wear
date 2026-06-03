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

/** Lista las fotos de una prenda (guardadas en SQL como URL) con previsualización. */
public class AdaptadorFotoPrenda extends RecyclerView.Adapter<AdaptadorFotoPrenda.Vista> {

    public interface AlActuarSobreFoto {
        void alEliminar(DtoImagen imagen);
        void alMarcarPrincipal(DtoImagen imagen);
    }

    private final List<DtoImagen> items = new ArrayList<>();
    private final AlActuarSobreFoto listener;

    public AdaptadorFotoPrenda(AlActuarSobreFoto listener) {
        this.listener = listener;
    }

    public void establecer(List<DtoImagen> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemFotoPrendaBinding enlace = ItemFotoPrendaBinding.inflate(
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
        private final ItemFotoPrendaBinding enlace;

        Vista(ItemFotoPrendaBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

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
