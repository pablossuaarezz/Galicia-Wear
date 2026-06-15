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

    /** Callback invocado cuando el usuario pulsa una tarjeta de producto. */
    public interface OnProductoClickListener {
        /** Se invoca con el producto pulsado para abrir su pantalla de detalle. */
        void onClick(DtoRespuestaProducto producto);
    }

    private final List<DtoRespuestaProducto> items = new ArrayList<>();
    private final OnProductoClickListener listener;

    /**
     * Crea el adaptador asociando el listener que se invocará al pulsar una
     * tarjeta de producto.
     *
     * @param listener callback a ejecutar al seleccionar un producto
     */
    public AdaptadorProducto(OnProductoClickListener listener) {
        this.listener = listener;
    }

    /**
     * Sustituye la lista completa de productos a partir de DTOs obtenidos
     * directamente del backend, y notifica al RecyclerView para que se
     * vuelva a pintar.
     *
     * @param nuevos lista de productos desde la red, o {@code null} para dejarla vacía
     */
    // Desde la red (DTOs completos)
    public void establecerDtos(List<DtoRespuestaProducto> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    /**
     * Sustituye la lista completa de productos a partir de entidades cacheadas
     * en Room (modo offline), convirtiéndolas a DTOs básicos con los campos
     * mínimos necesarios para pintar la tarjeta (nombre, precio, imagen
     * principal, material, km de origen y marca del diseñador).
     *
     * @param entidades lista de productos cacheados en la base de datos local, o {@code null} para dejarla vacía
     */
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

    /** Infla el layout de una tarjeta de producto mediante ViewBinding y crea su ViewHolder. */
    @NonNull
    @Override
    public VistaPreviaDato onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ElementoProductoBinding enlace = ElementoProductoBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false
        );
        return new VistaPreviaDato(enlace);
    }

    /** Enlaza los datos del producto de la posición indicada con las vistas del ViewHolder. */
    @Override
    public void onBindViewHolder(@NonNull VistaPreviaDato holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    /** Número total de productos en la lista. */
    @Override
    public int getItemCount() { return items.size(); }

    /**
     * ViewHolder de una tarjeta de producto: muestra la imagen principal,
     * nombre, precio, marca del diseñador, material principal y la distancia
     * de origen ("X km").
     */
    static class VistaPreviaDato extends RecyclerView.ViewHolder {
        private final ElementoProductoBinding enlace;

        VistaPreviaDato(ElementoProductoBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        /**
         * Rellena las vistas de la tarjeta con los datos del producto
         * recibido y configura el listener de clic para abrir su detalle.
         *
         * @param producto producto a representar (DTO de red o convertido desde caché local)
         * @param listener callback a invocar al pulsar la tarjeta
         */
        void enlazar(DtoRespuestaProducto producto, OnProductoClickListener listener) {
            enlace.textoNombre.setText(producto.nombre);
            // El backend envía el precio en "precioBase"; "precio" puede llegar a 0.
            double precio = producto.precio > 0 ? producto.precio : producto.precioBase;
            enlace.textoPrecio.setText(String.format("%.2f €", precio));

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
