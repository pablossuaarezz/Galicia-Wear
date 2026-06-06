package gal.galiciawear.app.ui.pedidos;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;

/** Adaptador simple para las líneas de un pedido en ActividadDetallePedido. */
public class AdaptadorLineasPedido extends RecyclerView.Adapter<AdaptadorLineasPedido.VH> {

    private final List<DtoRespuestaPedido.DtoLineaPedido> lineas;

    public AdaptadorLineasPedido(List<DtoRespuestaPedido.DtoLineaPedido> lineas) {
        this.lineas = lineas;
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        TextView tv = new TextView(parent.getContext());
        tv.setPadding(16, 8, 16, 8);
        return new VH(tv);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int pos) {
        DtoRespuestaPedido.DtoLineaPedido linea = lineas.get(pos);
        StringBuilder texto = new StringBuilder()
            .append(linea.cantidad).append("× ").append(linea.nombreVisible());
        // Detalle de variante (talla / color) si está disponible.
        if (linea.variante != null) {
            String talla = linea.variante.talla;
            String color = linea.variante.color;
            if (talla != null || color != null) {
                texto.append("  (");
                if (talla != null) texto.append(talla);
                if (talla != null && color != null) texto.append(", ");
                if (color != null) texto.append(color);
                texto.append(")");
            }
        }
        texto.append("  —  ")
            .append(String.format(java.util.Locale.getDefault(), "%.2f €", linea.totalLinea()));
        holder.texto.setText(texto.toString());
    }

    @Override
    public int getItemCount() { return lineas != null ? lineas.size() : 0; }

    static class VH extends RecyclerView.ViewHolder {
        TextView texto;
        VH(TextView tv) { super(tv); texto = tv; }
    }
}
