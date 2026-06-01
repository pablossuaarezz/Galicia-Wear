package gal.galiciawear.app.ui.carrito;

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
import gal.galiciawear.app.databinding.FragmentoCarritoBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.modelovista.ModeloVistaCarrito;

@AndroidEntryPoint
public class FragmentoCarrito extends Fragment {

    private FragmentoCarritoBinding enlace;
    private ModeloVistaCarrito modeloVista;
    private AdaptadorItemCarrito adaptador;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoCarritoBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaCarrito.class);

        adaptador = new AdaptadorItemCarrito(varianteId ->
            modeloVista.eliminarDelCarrito(varianteId)
        );
        enlace.listaCarrito.setLayoutManager(new LinearLayoutManager(requireContext()));
        enlace.listaCarrito.setAdapter(adaptador);

        enlace.botonCheckout.setOnClickListener(v ->
            startActivity(new Intent(requireContext(), ActividadCheckout.class))
        );

        modeloVista.cargarCarrito();

        modeloVista.observarCarrito().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            enlace.indicadorCarga.setVisibility(
                recurso.estaCargando() ? View.VISIBLE : View.GONE
            );
            if (recurso.esExito() && recurso.datos != null) {
                mostrarCarrito(recurso.datos);
            }
        });
    }

    private void mostrarCarrito(DtoRespuestaCarrito carrito) {
        boolean vacio = carrito.items == null || carrito.items.isEmpty();
        enlace.textoVacio.setVisibility(vacio ? View.VISIBLE : View.GONE);
        enlace.botonCheckout.setVisibility(vacio ? View.GONE : View.VISIBLE);

        if (!vacio) {
            adaptador.establecerItems(carrito.items);
            enlace.textoTotal.setText(String.format("Total: %.2f €", carrito.total));
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
