package gal.galiciawear.app.ui.disenador;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.ColorUtils;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ItemMiPrendaBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;

/**
 * Lista las prendas del diseñador con su foto, precio, estado de publicación
 * (Publicada / Borrador) y acciones rápidas: editar y publicar/despublicar.
 */
public class AdaptadorMiPrenda extends RecyclerView.Adapter<AdaptadorMiPrenda.Vista> {

    public interface AlActuar {
        void alEditar(DtoRespuestaProducto prenda);
        void alPublicar(DtoRespuestaProducto prenda);
    }

    private final List<DtoRespuestaProducto> items = new ArrayList<>();
    private final AlActuar listener;

    public AdaptadorMiPrenda(AlActuar listener) {
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

        void enlazar(DtoRespuestaProducto prenda, AlActuar listener) {
            Context contexto = enlace.getRoot().getContext();

            enlace.textoNombre.setText(prenda.nombre);
            enlace.textoPrecio.setText(String.format(Locale.getDefault(), "%.2f €", prenda.precioBase));

            // Estado de publicación con color.
            int colorEstado = ContextCompat.getColor(contexto,
                prenda.activo ? R.color.exito : R.color.aviso);
            enlace.textoEstado.setText(prenda.activo
                ? R.string.estado_publicada : R.string.estado_borrador);
            enlace.textoEstado.setTextColor(colorEstado);
            Drawable fondo = enlace.textoEstado.getBackground();
            if (fondo != null) {
                fondo.mutate().setTint(ColorUtils.setAlphaComponent(colorEstado, 28));
            }

            // Resumen de tallas (variantes).
            int tallas = prenda.variantes != null ? prenda.variantes.size() : 0;
            enlace.textoResumen.setText(
                contexto.getString(R.string.resumen_variantes, tallas));

            // Foto principal (Glide carga URL o data URI base64 automáticamente).
            String url = urlPrincipal(prenda);
            if (url != null) {
                Glide.with(contexto)
                    .load(url)
                    .placeholder(R.drawable.ic_placeholder_producto)
                    .centerCrop()
                    .into(enlace.imagenPrenda);
            } else {
                enlace.imagenPrenda.setImageResource(R.drawable.ic_placeholder_producto);
            }

            // Botón publicar/despublicar según estado actual.
            enlace.botonPublicar.setText(prenda.activo
                ? R.string.despublicar : R.string.publicar);

            enlace.botonEditar.setOnClickListener(v -> listener.alEditar(prenda));
            enlace.getRoot().setOnClickListener(v -> listener.alEditar(prenda));
            enlace.botonPublicar.setOnClickListener(v -> listener.alPublicar(prenda));
        }

        private String urlPrincipal(DtoRespuestaProducto prenda) {
            if (prenda.imagenes == null || prenda.imagenes.isEmpty()) return null;
            for (DtoRespuestaProducto.DtoImagenProducto img : prenda.imagenes) {
                if (img.esPrincipal && img.url != null) return img.url;
            }
            return prenda.imagenes.get(0).url;
        }
    }
}
