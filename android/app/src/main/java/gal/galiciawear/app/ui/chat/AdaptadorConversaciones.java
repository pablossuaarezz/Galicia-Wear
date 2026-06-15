package gal.galiciawear.app.ui.chat;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import gal.galiciawear.app.databinding.ItemConversacionBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoConversacion;
import gal.galiciawear.app.utilidades.FormatoFechas;

/**
 * Lista de conversaciones de soporte: nombre del interlocutor, último mensaje,
 * fecha y un contador de mensajes no leídos. Al pulsar abre el chat con ese peer.
 */
public class AdaptadorConversaciones extends RecyclerView.Adapter<AdaptadorConversaciones.Vista> {

    /** Callback invocado cuando el usuario pulsa una conversación de la lista. */
    public interface AlPulsar {
        /** Se invoca con la conversación seleccionada para abrir el chat correspondiente. */
        void alAbrir(DtoConversacion conversacion);
    }

    private final List<DtoConversacion> items = new ArrayList<>();
    private final AlPulsar listener;

    /**
     * Crea el adaptador asociando el listener que se invocará al pulsar una
     * conversación de la lista.
     *
     * @param listener callback a ejecutar al seleccionar una conversación
     */
    public AdaptadorConversaciones(AlPulsar listener) {
        this.listener = listener;
    }

    /**
     * Sustituye la lista completa de conversaciones y notifica al
     * RecyclerView para que se vuelva a pintar.
     *
     * @param nuevos nueva lista de conversaciones, o {@code null} para dejarla vacía
     */
    public void establecer(List<DtoConversacion> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    /** Infla el layout de un elemento de conversación mediante ViewBinding y crea su ViewHolder. */
    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemConversacionBinding enlace = ItemConversacionBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new Vista(enlace);
    }

    /** Enlaza los datos de la conversación de la posición indicada con las vistas del ViewHolder. */
    @Override
    public void onBindViewHolder(@NonNull Vista holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    /** Número total de conversaciones en la lista. */
    @Override
    public int getItemCount() { return items.size(); }

    /**
     * ViewHolder de una conversación: muestra el nombre del interlocutor (y
     * su inicial como avatar), el último mensaje, la fecha del último mensaje
     * y, si procede, un contador de mensajes no leídos.
     */
    static class Vista extends RecyclerView.ViewHolder {
        private final ItemConversacionBinding enlace;

        Vista(ItemConversacionBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        /**
         * Rellena las vistas del elemento con los datos de la conversación:
         * nombre del interlocutor (con valor por defecto si viene nulo),
         * último mensaje, fecha formateada, inicial del nombre como avatar, y
         * el contador de no leídos (oculto si es 0). Configura también el
         * listener de clic sobre todo el elemento para abrir el chat.
         *
         * @param c conversación a representar
         * @param listener callback a invocar al pulsar el elemento
         */
        void enlazar(DtoConversacion c, AlPulsar listener) {
            String nombre = c.nombre != null ? c.nombre : "Conversación";
            enlace.textoNombre.setText(nombre);
            enlace.textoUltimoMensaje.setText(c.ultimoMensaje != null ? c.ultimoMensaje : "");
            enlace.textoFecha.setText(FormatoFechas.fechaConHora(c.fechaUltimo));

            // Avatar simple: primera letra del nombre en mayúscula.
            if (!nombre.isEmpty()) {
                enlace.textoInicial.setText(nombre.substring(0, 1).toUpperCase(Locale.getDefault()));
            }

            // El contador de no leídos solo se muestra si hay mensajes pendientes.
            if (c.noLeidos > 0) {
                enlace.contadorNoLeidos.setVisibility(View.VISIBLE);
                enlace.contadorNoLeidos.setText(String.valueOf(c.noLeidos));
            } else {
                enlace.contadorNoLeidos.setVisibility(View.GONE);
            }

            // Al pulsar la conversación completa se notifica al listener para abrir el chat.
            enlace.getRoot().setOnClickListener(v -> listener.alAbrir(c));
        }
    }
}
