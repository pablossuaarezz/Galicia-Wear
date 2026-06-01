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
        holder.texto.setText(
            linea.cantidad + "× " + linea.nombreProducto
            + " — " + String.format("%.2f €", linea.precioUnitario * linea.cantidad)
        );
    }

    @Override
    public int getItemCount() { return lineas != null ? lineas.size() : 0; }

    static class VH extends RecyclerView.ViewHolder {
        TextView texto;
        VH(TextView tv) { super(tv); texto = tv; }
    }
}
