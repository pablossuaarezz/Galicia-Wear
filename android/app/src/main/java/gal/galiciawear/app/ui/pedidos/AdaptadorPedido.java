package gal.galiciawear.app.ui.pedidos;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.databinding.ElementoPedidoBinding;

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
            enlace.textoNumeroPedido.setText(pedido.numeroPedido);
            enlace.textoEstado.setText(pedido.estado);
            enlace.textoTotal.setText(String.format("%.2f €", pedido.total));
            enlace.textoFecha.setText(pedido.fechaCreacion);
            enlace.getRoot().setOnClickListener(v -> listener.onClick(pedido));
        }
    }
}
