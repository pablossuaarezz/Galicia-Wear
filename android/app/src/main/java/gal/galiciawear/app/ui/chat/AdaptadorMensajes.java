package gal.galiciawear.app.ui.chat;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaMensaje;

/**
 * Adaptador de mensajes de chat con dos tipos de vista:
 * - Mensaje propio (alineado a la derecha, fondo primario)
 * - Mensaje del diseñador (alineado a la izquierda, fondo superficie)
 *
 * JUSTIFICACIÓN: Usar viewType permite reciclar correctamente vistas con
 * layouts distintos sin lógica de visibilidad condicional en bind().
 */
public class AdaptadorMensajes extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TIPO_PROPIO   = 0;
    private static final int TIPO_AJENO    = 1;

    private final List<DtoRespuestaMensaje> mensajes = new ArrayList<>();
    private final String miId;

    /**
     * Crea el adaptador de mensajes del chat.
     *
     * @param miId id del usuario actual, usado para distinguir los mensajes
     *             propios de los del otro interlocutor
     */
    public AdaptadorMensajes(String miId) {
        this.miId = miId;
    }

    /**
     * Sustituye la lista completa de mensajes y notifica al RecyclerView para
     * que se vuelva a pintar.
     *
     * @param nuevos nueva lista de mensajes de la conversación, o {@code null} para dejarla vacía
     */
    public void establecerMensajes(List<DtoRespuestaMensaje> nuevos) {
        mensajes.clear();
        if (nuevos != null) mensajes.addAll(nuevos);
        notifyDataSetChanged();
    }

    /**
     * Determina el tipo de vista del mensaje en la posición indicada según si
     * el remitente coincide con el usuario actual ({@link #TIPO_PROPIO}) o no
     * ({@link #TIPO_AJENO}), para usar el layout (y por tanto el estilo y
     * alineación) correspondiente.
     */
    @Override
    public int getItemViewType(int posicion) {
        String remitenteId = mensajes.get(posicion).remitenteId;
        return (miId != null && miId.equals(remitenteId)) ? TIPO_PROPIO : TIPO_AJENO;
    }

    /**
     * Infla el layout correspondiente al tipo de vista (mensaje propio o
     * ajeno) y crea el ViewHolder genérico {@link VHMensaje}.
     */
    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layout = viewType == TIPO_PROPIO
            ? R.layout.elemento_mensaje_propio
            : R.layout.elemento_mensaje_ajeno;
        View v = LayoutInflater.from(parent.getContext()).inflate(layout, parent, false);
        return new VHMensaje(v);
    }

    /** Busca el TextView del contenido dentro del layout inflado y le asigna el texto del mensaje. */
    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int pos) {
        DtoRespuestaMensaje msg = mensajes.get(pos);
        TextView tv = holder.itemView.findViewById(R.id.texto_mensaje);
        if (tv != null) tv.setText(msg.contenido);
    }

    /** Número total de mensajes en la conversación. */
    @Override
    public int getItemCount() { return mensajes.size(); }

    /**
     * ViewHolder genérico para ambos tipos de mensaje (propio/ajeno); la
     * diferencia entre ambos se resuelve a nivel de layout inflado, no de
     * lógica en el ViewHolder.
     */
    static class VHMensaje extends RecyclerView.ViewHolder {
        VHMensaje(View v) { super(v); }
    }
}
