package gal.galiciawear.app.ui.buscador;

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
import gal.galiciawear.app.databinding.FragmentoBuscadorBinding;
import gal.galiciawear.app.modelovista.ModeloVistaProductos;
import gal.galiciawear.app.ui.detalle.ActividadDetalleProducto;
import gal.galiciawear.app.ui.inicio.AdaptadorProducto;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla de búsqueda con filtros avanzados de sostenibilidad.
 *
 * Criterio Ley de Hick: filtros agrupados en chips/dropdowns en lugar de
 * una lista interminable de opciones. Máximo 4 filtros visibles a la vez.
 */
@AndroidEntryPoint
public class FragmentoBuscador extends Fragment {

    private FragmentoBuscadorBinding enlace;
    private ModeloVistaProductos modeloVista;
    private AdaptadorProducto adaptador;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoBuscadorBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaProductos.class);

        adaptador = new AdaptadorProducto(producto -> {
            Intent intent = new Intent(requireContext(), ActividadDetalleProducto.class);
            intent.putExtra(Constantes.EXTRA_PRODUCTO_SLUG, producto.slug);
            startActivity(intent);
        });

        enlace.resultados.setLayoutManager(new LinearLayoutManager(requireContext()));
        enlace.resultados.setAdapter(adaptador);

        enlace.botonBuscar.setOnClickListener(v -> aplicarFiltros());
        enlace.botonLimpiar.setOnClickListener(v -> {
            modeloVista.limpiarFiltros();
            enlace.entradaBusqueda.setText("");
            enlace.entradaMaterial.setText("");
            enlace.entradaMaxKm.setText("");
            enlace.chipGots.setChecked(false);
            enlace.chipOekoTex.setChecked(false);
        });

        modeloVista.observarProductos().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            enlace.indicadorCarga.setVisibility(
                recurso.estaCargando() ? View.VISIBLE : View.GONE
            );
            if (recurso.esExito() && recurso.datos != null) {
                adaptador.establecerDtos(recurso.datos);
            }
        });
    }

    private void aplicarFiltros() {
        String busqueda = enlace.entradaBusqueda.getText().toString();
        String material = enlace.entradaMaterial.getText().toString();
        Integer maxKm   = enlace.entradaMaxKm.getText().toString().isEmpty() ? null
            : Integer.parseInt(enlace.entradaMaxKm.getText().toString());

        // Chips de certificados
        StringBuilder certificados = new StringBuilder();
        if (enlace.chipGots.isChecked())    certificados.append("GOTS,");
        if (enlace.chipOekoTex.isChecked()) certificados.append("OEKO_TEX,");
        String certStr = certificados.length() > 0
            ? certificados.toString().replaceAll(",$", "") : "";

        modeloVista.aplicarFiltros(busqueda, material, "", maxKm, certStr);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
