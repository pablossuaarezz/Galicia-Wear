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

    public interface AlPulsar {
        void alAbrir(DtoConversacion conversacion);
    }

    private final List<DtoConversacion> items = new ArrayList<>();
    private final AlPulsar listener;

    public AdaptadorConversaciones(AlPulsar listener) {
        this.listener = listener;
    }

    public void establecer(List<DtoConversacion> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemConversacionBinding enlace = ItemConversacionBinding.inflate(
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
        private final ItemConversacionBinding enlace;

        Vista(ItemConversacionBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoConversacion c, AlPulsar listener) {
            String nombre = c.nombre != null ? c.nombre : "Conversación";
            enlace.textoNombre.setText(nombre);
            enlace.textoUltimoMensaje.setText(c.ultimoMensaje != null ? c.ultimoMensaje : "");
            enlace.textoFecha.setText(FormatoFechas.fechaConHora(c.fechaUltimo));

            if (!nombre.isEmpty()) {
                enlace.textoInicial.setText(nombre.substring(0, 1).toUpperCase(Locale.getDefault()));
            }

            if (c.noLeidos > 0) {
                enlace.contadorNoLeidos.setVisibility(View.VISIBLE);
                enlace.contadorNoLeidos.setText(String.valueOf(c.noLeidos));
            } else {
                enlace.contadorNoLeidos.setVisibility(View.GONE);
            }

            enlace.getRoot().setOnClickListener(v -> listener.alAbrir(c));
        }
    }
}
