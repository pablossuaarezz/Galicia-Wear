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
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.FragmentoPedidosBinding;
import gal.galiciawear.app.modelovista.ModeloVistaPedidos;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Fragmento que muestra el listado de pedidos realizados por el usuario.
 *
 * Carga los pedidos a través de {@link ModeloVistaPedidos}, los presenta en un
 * RecyclerView mediante {@link AdaptadorPedido} y permite refrescar la lista
 * con un gesto de "pull to refresh". Al pulsar sobre un pedido, navega a
 * {@link ActividadDetallePedido} pasando su identificador por Intent.
 */
@AndroidEntryPoint
public class FragmentoPedidos extends Fragment {

    private FragmentoPedidosBinding enlace;
    private ModeloVistaPedidos modeloVista;
    private AdaptadorPedido adaptador;

    /** Infla el layout del fragmento mediante ViewBinding. */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoPedidosBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Inicializa el ViewModel, configura el RecyclerView con su adaptador y
     * el gesto de "pull to refresh", se suscribe a la lista de pedidos
     * observada desde el ViewModel y lanza la carga inicial de pedidos.
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaPedidos.class);

        // Al pulsar un pedido, abrimos su pantalla de detalle pasando el id por Intent.
        adaptador = new AdaptadorPedido(pedido -> {
            Intent intent = new Intent(requireContext(), ActividadDetallePedido.class);
            intent.putExtra(Constantes.EXTRA_PEDIDO_ID, pedido.id);
            startActivity(intent);
        });
        enlace.listaPedidos.setLayoutManager(new LinearLayoutManager(requireContext()));
        enlace.listaPedidos.setAdapter(adaptador);
        // El tamaño de cada elemento no cambia, lo que permite optimizar el RecyclerView.
        enlace.listaPedidos.setHasFixedSize(true);

        enlace.refrescarPedidos.setColorSchemeResources(R.color.primario);
        // Gesto de "deslizar para refrescar": vuelve a pedir el listado de pedidos al backend.
        enlace.refrescarPedidos.setOnRefreshListener(() -> modeloVista.cargarMisPedidos());

        modeloVista.observarLista().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            boolean cargando = recurso.estaCargando();
            // El spinner central solo en la primera carga; luego usamos el del swipe.
            enlace.indicadorCarga.setVisibility(
                cargando && adaptador.getItemCount() == 0 ? View.VISIBLE : View.GONE
            );
            // Si ya había datos cargados, el indicador de progreso es el del propio swipe-refresh.
            enlace.refrescarPedidos.setRefreshing(
                cargando && adaptador.getItemCount() > 0
            );

            if (recurso.esExito() && recurso.datos != null) {
                adaptador.establecerPedidos(recurso.datos);
                // Muestra el mensaje de "sin pedidos" si la lista recibida está vacía.
                enlace.estadoVacio.setVisibility(
                    recurso.datos.isEmpty() ? View.VISIBLE : View.GONE
                );
            }
        });

        // Carga inicial de los pedidos del usuario al crear la vista.
        modeloVista.cargarMisPedidos();
    }

    /** Libera la referencia al ViewBinding para evitar fugas de memoria. */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
