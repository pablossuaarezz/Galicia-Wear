package gal.galiciawear.app.ui.notificaciones;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ItemNotificacionBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoNotificacion;
import gal.galiciawear.app.utilidades.FormatoFechas;

/**
 * Adaptador de RecyclerView para la bandeja de notificaciones del usuario
 * ({@link FragmentoNotificaciones}).
 *
 * Cada elemento muestra: un icono representativo según el tipo de notificación
 * (pedido, mensaje o genérico), el título, el cuerpo del mensaje, la fecha de
 * creación y un punto indicador de "no leída". Al pulsar sobre cualquier
 * elemento se delega en el listener, que es el fragmento contenedor quien
 * decide la navegación según el tipo de notificación recibida.
 */
public class AdaptadorNotificaciones
        extends RecyclerView.Adapter<AdaptadorNotificaciones.Vista> {

    /** Callback que delega en el fragmento la apertura/navegación de una notificación. */
    public interface AlPulsar {
        void alAbrir(DtoNotificacion notificacion);
    }

    private final List<DtoNotificacion> items = new ArrayList<>();
    private final AlPulsar listener;

    public AdaptadorNotificaciones(AlPulsar listener) {
        this.listener = listener;
    }

    /**
     * Sustituye la lista completa de notificaciones mostradas y refresca el
     * RecyclerView. Se invoca tras cada carga (inicial o por refresco en
     * tiempo real) del listado de notificaciones desde el ViewModel.
     */
    public void establecer(List<DtoNotificacion> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    /** Crea un nuevo ViewHolder inflando el layout de un elemento de notificación. */
    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemNotificacionBinding enlace = ItemNotificacionBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new Vista(enlace);
    }

    /** Vincula los datos de la notificación en la posición indicada con su ViewHolder. */
    @Override
    public void onBindViewHolder(@NonNull Vista holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    @Override
    public int getItemCount() { return items.size(); }

    /**
     * Devuelve el recurso de icono adecuado según el prefijo/valor del campo
     * {@code tipo} de la notificación: las notificaciones de pedido
     * ("PEDIDO_*") usan el icono de pedidos, las de mensaje nuevo el icono de
     * chat, y cualquier otro tipo (o {@code null}) usa el icono genérico de
     * campana.
     */
    // Icono representativo del tipo: pedidos, mensaje o genérico (campana).
    private static int iconoPara(String tipo) {
        if (tipo == null) return R.drawable.ic_notificacion;
        if (tipo.startsWith("PEDIDO_")) return R.drawable.ic_nav_pedidos;
        if (tipo.equals("MENSAJE_NUEVO")) return R.drawable.ic_chat;
        return R.drawable.ic_notificacion;
    }

    /** ViewHolder de un elemento de la bandeja de notificaciones. */
    static class Vista extends RecyclerView.ViewHolder {
        private final ItemNotificacionBinding enlace;

        Vista(ItemNotificacionBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        /**
         * Rellena la vista de un elemento de notificación: título (con texto
         * por defecto si viene vacío), cuerpo, fecha con hora, icono según el
         * tipo, visibilidad del punto de "no leída" y el listener de pulsación
         * sobre toda la fila.
         */
        void enlazar(DtoNotificacion n, AlPulsar listener) {
            enlace.textoTitulo.setText(n.titulo != null ? n.titulo : "Notificación");
            enlace.textoCuerpo.setText(n.cuerpo != null ? n.cuerpo : "");
            enlace.textoFecha.setText(FormatoFechas.fechaConHora(n.fechaCreacion));
            enlace.iconoTipo.setImageResource(iconoPara(n.tipo));
            // El punto solo se muestra si la notificación todavía no ha sido leída.
            enlace.puntoNoLeida.setVisibility(n.leida ? View.GONE : View.VISIBLE);
            enlace.getRoot().setOnClickListener(v -> listener.alAbrir(n));
        }
    }
}
