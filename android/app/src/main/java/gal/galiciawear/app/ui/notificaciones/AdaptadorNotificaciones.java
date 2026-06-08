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
 * Lista de notificaciones: icono según el tipo, título, cuerpo, fecha y un punto de
 * "no leída". Al pulsar, navega según el tipo (lo resuelve el fragmento).
 */
public class AdaptadorNotificaciones
        extends RecyclerView.Adapter<AdaptadorNotificaciones.Vista> {

    public interface AlPulsar {
        void alAbrir(DtoNotificacion notificacion);
    }

    private final List<DtoNotificacion> items = new ArrayList<>();
    private final AlPulsar listener;

    public AdaptadorNotificaciones(AlPulsar listener) {
        this.listener = listener;
    }

    public void establecer(List<DtoNotificacion> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Vista onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemNotificacionBinding enlace = ItemNotificacionBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new Vista(enlace);
    }

    @Override
    public void onBindViewHolder(@NonNull Vista holder, int posicion) {
        holder.enlazar(items.get(posicion), listener);
    }

    @Override
    public int getItemCount() { return items.size(); }

    // Icono representativo del tipo: pedidos, mensaje o genérico (campana).
    private static int iconoPara(String tipo) {
        if (tipo == null) return R.drawable.ic_notificacion;
        if (tipo.startsWith("PEDIDO_")) return R.drawable.ic_nav_pedidos;
        if (tipo.equals("MENSAJE_NUEVO")) return R.drawable.ic_chat;
        return R.drawable.ic_notificacion;
    }

    static class Vista extends RecyclerView.ViewHolder {
        private final ItemNotificacionBinding enlace;

        Vista(ItemNotificacionBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoNotificacion n, AlPulsar listener) {
            enlace.textoTitulo.setText(n.titulo != null ? n.titulo : "Notificación");
            enlace.textoCuerpo.setText(n.cuerpo != null ? n.cuerpo : "");
            enlace.textoFecha.setText(FormatoFechas.fechaConHora(n.fechaCreacion));
            enlace.iconoTipo.setImageResource(iconoPara(n.tipo));
            enlace.puntoNoLeida.setVisibility(n.leida ? View.GONE : View.VISIBLE);
            enlace.getRoot().setOnClickListener(v -> listener.alAbrir(n));
        }
    }
}
