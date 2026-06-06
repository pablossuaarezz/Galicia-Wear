package gal.galiciawear.app.ui.pedidos;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.ColorUtils;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.databinding.ElementoPedidoBinding;
import gal.galiciawear.app.utilidades.EstadoPedidoUi;
import gal.galiciawear.app.utilidades.FormatoFechas;

public class AdaptadorPedido extends RecyclerView.Adapter<AdaptadorPedido.VistaPreviaDato> {

    public interface OnPedidoClickListener {
        void onClick(DtoRespuestaPedido pedido);
    }

    private final List<DtoRespuestaPedido> items = new ArrayList<>();
    private final OnPedidoClickListener listener;

    public AdaptadorPedido(OnPedidoClickListener listener) {
        this.listener = listener;
    }

    public void establecerPedidos(List<DtoRespuestaPedido> nuevos) {
        items.clear();
        if (nuevos != null) items.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VistaPreviaDato onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ElementoPedidoBinding enlace = ElementoPedidoBinding.inflate(
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
        private final ElementoPedidoBinding enlace;

        VistaPreviaDato(ElementoPedidoBinding enlace) {
            super(enlace.getRoot());
            this.enlace = enlace;
        }

        void enlazar(DtoRespuestaPedido pedido, OnPedidoClickListener listener) {
            Context contexto = enlace.getRoot().getContext();

            enlace.textoNumeroPedido.setText(
                contexto.getString(R.string.pedido_numero, pedido.numeroPedido));
            enlace.textoTotal.setText(String.format(Locale.getDefault(), "%.2f €", pedido.total));

            // Fecha legible · nº de artículos
            String fecha = FormatoFechas.fechaCorta(pedido.fechaCreacion);
            int unidades = contarArticulos(pedido);
            String articulos = contexto.getResources()
                .getQuantityString(R.plurals.num_articulos, unidades, unidades);
            enlace.textoFecha.setText(fecha + " · " + articulos);

            enlace.textoResumenProductos.setText(resumenProductos(pedido));

            pintarEstado(contexto, pedido.estado);

            enlace.getRoot().setOnClickListener(v -> listener.onClick(pedido));
        }

        /** Badge de estado: fondo tintado claro + texto en el color fuerte. */
        private void pintarEstado(Context contexto, String estado) {
            int color = ContextCompat.getColor(contexto, EstadoPedidoUi.color(estado));
            enlace.textoEstado.setText(EstadoPedidoUi.etiqueta(estado));
            enlace.textoEstado.setTextColor(color);
            Drawable fondo = enlace.textoEstado.getBackground();
            if (fondo != null) {
                fondo.mutate().setTint(ColorUtils.setAlphaComponent(color, 28));
            }
        }

        private int contarArticulos(DtoRespuestaPedido pedido) {
            if (pedido.lineas == null) return 0;
            int total = 0;
            for (DtoRespuestaPedido.DtoLineaPedido linea : pedido.lineas) {
                total += linea.cantidad;
            }
            return total;
        }

        /** Lista los nombres de producto separados por comas (se recorta con ellipsis). */
        private String resumenProductos(DtoRespuestaPedido pedido) {
            if (pedido.lineas == null || pedido.lineas.isEmpty()) return "";
            StringBuilder sb = new StringBuilder();
            for (DtoRespuestaPedido.DtoLineaPedido linea : pedido.lineas) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(linea.nombreVisible());
            }
            return sb.toString();
        }
    }
}
