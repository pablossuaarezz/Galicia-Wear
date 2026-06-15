package gal.galiciawear.app.ui.pedidos;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;

/**
 * Adaptador simple para las líneas de un pedido en ActividadDetallePedido.
 * Cada fila es un único TextView (creado por código, sin layout XML) que
 * muestra la cantidad, el nombre del producto, su variante (talla/color)
 * y el precio total de esa línea.
 */
public class AdaptadorLineasPedido extends RecyclerView.Adapter<AdaptadorLineasPedido.VH> {

    private final List<DtoRespuestaPedido.DtoLineaPedido> lineas;

    /** Recibe la lista de líneas del pedido a representar. */
    public AdaptadorLineasPedido(List<DtoRespuestaPedido.DtoLineaPedido> lineas) {
        this.lineas = lineas;
    }

    /** Crea el ViewHolder: un TextView simple con un pequeño padding. */
    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        TextView tv = new TextView(parent.getContext());
        tv.setPadding(16, 8, 16, 8);
        return new VH(tv);
    }

    /**
     * Construye el texto de la línea con el formato:
     * "{cantidad}× {nombre}  (talla, color)  —  {total} €".
     * La parte de variante (talla/color) solo se añade si hay datos disponibles.
     */
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

    /** Número de líneas a mostrar (0 si la lista es nula). */
    @Override
    public int getItemCount() { return lineas != null ? lineas.size() : 0; }

    /** ViewHolder mínimo: envuelve el TextView donde se pinta cada línea. */
    static class VH extends RecyclerView.ViewHolder {
        TextView texto;
        VH(TextView tv) { super(tv); texto = tv; }
    }
}
