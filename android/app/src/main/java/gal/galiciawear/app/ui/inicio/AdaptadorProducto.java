package gal.galiciawear.app.ui.inicio;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.local.entidad.EntidadProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.databinding.ElementoProductoBinding;

/**
 * Adaptador dual: acepta tanto DTOs de red como entidades de Room.
 * Esto permite mostrar la caché offline sin duplicar el adaptador.
 *
 * JUSTIFICACIÓN: El RecyclerView recicla las vistas y solo renderiza
 * los elementos visibles en pantalla (eficiente con listas largas).
 * Usamos DiffUtil implícito reemplazando la lista completa — para
 * una app de producción se implementaría DiffUtil.ItemCallback.
 */
public class AdaptadorProducto extends RecyclerView.Adapter<AdaptadorProducto.VistaPreviaDato> {

    public interface OnProductoClickListener {
        void onClick(DtoRespuestaProducto producto);
    }

    private final List<DtoRespuestaProducto> items = new ArrayList<>();
    private final OnProductoClickListener listener;

    public AdaptadorProducto(OnProductoClickListener listener) {
        this.listener = listener;
    }

    // Desde la red (DTOs completos)
    public void establecerDtos(List<DtoRespuestaProducto> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    // Desde Room (entidades cacheadas → se convierten a DTOs básicos)
    public void establecerEntidades(List<EntidadProducto> entidades) {
        items.clear();
        if (entidades != null) {
            for (EntidadProducto e : entidades) {
                DtoRespuestaProducto dto = new DtoRespuestaProducto();
                dto.id     = e.id;
                dto.nombre = e.nombre;
                dto.slug   = e.slug;
                dto.precio = e.precio;
                dto.materialPrincipal = e.materialPrincipal;
                dto.kmOrigen = e.kmOrigen;
                // Crear imagen mínima para mostrar la URL cacheada
                DtoRespuestaProducto.DtoImagenProducto img = new DtoRespuestaProducto.DtoImagenProducto();
                img.url = e.urlImagenPrincipal;
                img.esPrincipal = true;
                dto.imagenes = new ArrayList<>();
                dto.imagenes.add(img);
                // Diseñador resumido
                DtoRespuestaProducto.DtoDisenadorResumen dis = new DtoRespuestaProducto.DtoDisenadorResumen();
                dis.nombreMarca = e.nombreMarcaDisenador;
                dto.disenador = dis;
                items.add(dto);
            }
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VistaPreviaDato onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ElementoProductoBinding enlace = ElementoProductoBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false
        );
        return new VistaPreviaDato(enlace);
    }

    @Override
    public void onBindViewHolder(@NonNull VistaPreviaDato holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class VistaPreviaDato extends RecyclerView.ViewHolder {
        private final ElementoProductoBinding enlace;

        VistaPreviaDato(ElementoProductoBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoRespuestaProducto producto, OnProductoClickListener listener) {
            enlace.textoNombre.setText(producto.nombre);
            enlace.textoPrecio.setText(String.format("%.2f €", producto.precio));

            if (producto.disenador != null) {
                enlace.textoMarca.setText(producto.disenador.nombreMarca);
            }
            if (producto.materialPrincipal != null) {
                enlace.textoMaterial.setText(producto.materialPrincipal);
            }
            enlace.textoKm.setText(producto.kmOrigen + " km");

            // Imagen — contentDescription para accesibilidad AA
            if (producto.imagenes != null && !producto.imagenes.isEmpty()) {
                Glide.with(enlace.imagenProducto.getContext())
                    .load(producto.imagenes.get(0).url)
                    .placeholder(R.drawable.ic_placeholder_producto)
                    .centerCrop()
                    .into(enlace.imagenProducto);
            }
            enlace.imagenProducto.setContentDescription("Imagen de " + producto.nombre);

            enlace.getRoot().setOnClickListener(v -> listener.onClick(producto));
        }
    }
}
