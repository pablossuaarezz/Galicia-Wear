package gal.galiciawear.app.ui.pedidos;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoPedidosBinding;
import gal.galiciawear.app.modelovista.ModeloVistaPedidos;
import gal.galiciawear.app.utilidades.Constantes;

@AndroidEntryPoint
public class FragmentoPedidos extends Fragment {

    private FragmentoPedidosBinding enlace;
    private ModeloVistaPedidos modeloVista;
    private AdaptadorPedido adaptador;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoPedidosBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaPedidos.class);

        adaptador = new AdaptadorPedido(pedido -> {
            Intent intent = new Intent(requireContext(), ActividadDetallePedido.class);
            intent.putExtra(Constantes.EXTRA_PEDIDO_ID, pedido.id);
            startActivity(intent);
        });
        enlace.listaPedidos.setLayoutManager(new LinearLayoutManager(requireContext()));
        enlace.listaPedidos.setAdapter(adaptador);

        modeloVista.cargarMisPedidos();

        modeloVista.observarLista().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            enlace.indicadorCarga.setVisibility(
                recurso.estaCargando() ? View.VISIBLE : View.GONE
            );
            if (recurso.esExito() && recurso.datos != null) {
                adaptador.establecerPedidos(recurso.datos);
                enlace.textoVacio.setVisibility(
                    recurso.datos.isEmpty() ? View.VISIBLE : View.GONE
                );
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
