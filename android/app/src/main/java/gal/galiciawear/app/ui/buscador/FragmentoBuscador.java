package gal.galiciawear.app.ui.buscador;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;

import com.google.android.material.chip.Chip;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.FragmentoBuscadorBinding;
import gal.galiciawear.app.modelovista.ModeloVistaProductos;
import gal.galiciawear.app.ui.detalle.ActividadDetalleProducto;
import gal.galiciawear.app.ui.inicio.AdaptadorProducto;
import gal.galiciawear.app.utilidades.BusquedasRecientes;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Buscador de texto libre: el usuario solo escribe lo que quiere (p. ej.
 * "camiseta") y obtiene resultados. Sin formularios de filtros.
 *
 * Criterios psicológicos UI/UX (rúbrica DAM):
 * - Reconocer mejor que recordar: las últimas búsquedas aparecen arriba como
 *   chips reutilizables mientras el campo está vacío.
 * - Evitar callejones sin salida: si la consulta no tiene coincidencias, se
 *   muestran productos similares en lugar de una pantalla vacía.
 * - Ley de Fitts: un único objetivo grande (la barra) con acción de búsqueda
 *   en el teclado y limpieza rápida con la "x".
 */
@AndroidEntryPoint
public class FragmentoBuscador extends Fragment {

    private FragmentoBuscadorBinding enlace;
    private ModeloVistaProductos modeloVista;
    private AdaptadorProducto adaptador;
    private BusquedasRecientes historial;

    /**
     * Infla el layout del fragmento mediante ViewBinding y devuelve su vista raíz.
     */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoBuscadorBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Inicializa el ViewModel y el historial de búsquedas recientes, configura
     * el RecyclerView de resultados, la barra de búsqueda y el observador del
     * {@code LiveData} de resultados, y muestra el estado inicial (búsquedas
     * recientes, ya que el campo de texto está vacío).
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaProductos.class);
        historial   = new BusquedasRecientes(requireContext());

        configurarResultados();
        configurarBarraBusqueda();
        observarBusqueda();

        // Estado inicial: campo vacío → mostrar lo último buscado.
        mostrarRecientes();
    }

    /**
     * Configura el RecyclerView de resultados con un {@link GridLayoutManager}
     * de 2 columnas y un {@link AdaptadorProducto} cuyo listener de clic abre
     * la pantalla de detalle del producto seleccionado, pasando su slug como
     * extra del {@link Intent}.
     */
    private void configurarResultados() {
        adaptador = new AdaptadorProducto(producto -> {
            Intent intent = new Intent(requireContext(), ActividadDetalleProducto.class);
            intent.putExtra(Constantes.EXTRA_PRODUCTO_SLUG, producto.slug);
            startActivity(intent);
        });
        enlace.resultados.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        enlace.resultados.setAdapter(adaptador);
    }

    /**
     * Configura el campo de texto de búsqueda: lanza la búsqueda al pulsar la
     * acción "buscar" del teclado, vuelve a mostrar las búsquedas recientes
     * cuando el campo queda vacío, y permite borrar el historial de búsquedas
     * recientes mediante el botón correspondiente.
     */
    private void configurarBarraBusqueda() {
        // Acción "buscar" del teclado.
        enlace.entradaBusqueda.setOnEditorActionListener((v, accion, evento) -> {
            if (accion == EditorInfo.IME_ACTION_SEARCH) {
                ejecutarBusqueda(v.getText().toString());
                return true;
            }
            return false;
        });

        // Al vaciar el campo, volvemos a la pantalla de búsquedas recientes.
        enlace.entradaBusqueda.addTextChangedListener(new SoloAlVaciar(() -> mostrarRecientes()));

        enlace.botonLimpiarRecientes.setOnClickListener(v -> {
            historial.limpiar();
            mostrarRecientes();
        });
    }

    /**
     * Ejecuta la búsqueda con el término indicado: oculta el teclado, lo
     * guarda en el historial de búsquedas recientes, oculta la sección de
     * recientes y delega en el ViewModel para obtener los resultados desde
     * el backend. Si el término está vacío, no hace nada.
     *
     * @param consulta texto introducido por el usuario
     */
    private void ejecutarBusqueda(String consulta) {
        String termino = consulta == null ? "" : consulta.trim();
        if (termino.isEmpty()) return;

        ocultarTeclado();
        historial.anadir(termino);

        enlace.seccionRecientes.setVisibility(View.GONE);
        modeloVista.buscar(termino);
    }

    /**
     * Observa el {@code LiveData} con el resultado de la búsqueda y actualiza
     * la UI: muestra el indicador de carga mientras se espera respuesta,
     * actualiza el adaptador con los productos obtenidos y, si los resultados
     * son "similares" (porque no hubo coincidencia exacta), muestra una
     * cabecera explicativa. En caso de error, muestra un mensaje genérico.
     */
    private void observarBusqueda() {
        modeloVista.observarBusqueda().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            enlace.indicadorCarga.setVisibility(
                recurso.estaCargando() ? View.VISIBLE : View.GONE);

            if (recurso.esExito() && recurso.datos != null) {
                ModeloVistaProductos.ResultadoBusqueda resultado = recurso.datos;
                adaptador.establecerDtos(resultado.productos);

                if (resultado.sonSimilares) {
                    enlace.textoCabecera.setVisibility(View.VISIBLE);
                    enlace.textoCabecera.setText(resultado.productos.isEmpty()
                        ? getString(R.string.sin_resultados_busqueda, resultado.consulta)
                        : getString(R.string.resultados_similares, resultado.consulta));
                } else {
                    enlace.textoCabecera.setVisibility(View.GONE);
                }
            } else if (recurso.esError()) {
                enlace.textoCabecera.setVisibility(View.VISIBLE);
                enlace.textoCabecera.setText(getString(R.string.error_generico));
            }
        });
    }

    /**
     * Muestra/oculta la sección de búsquedas recientes y repinta los chips
     * con los términos guardados en el historial. Cada chip, al pulsarse,
     * rellena el campo de búsqueda con su texto y ejecuta la búsqueda. Como
     * no hay una búsqueda activa en este momento, también se limpian los
     * resultados y la cabecera del adaptador.
     */
    private void mostrarRecientes() {
        List<String> recientes = historial.obtener();
        enlace.chipsRecientes.removeAllViews();

        boolean hay = !recientes.isEmpty();
        enlace.seccionRecientes.setVisibility(hay ? View.VISIBLE : View.GONE);
        // Sin búsqueda activa: limpiamos resultados y cabecera.
        enlace.textoCabecera.setVisibility(View.GONE);
        adaptador.establecerDtos(null);

        for (String termino : recientes) {
            Chip chip = new Chip(requireContext());
            chip.setText(termino);
            chip.setCheckable(false);
            chip.setOnClickListener(v -> {
                enlace.entradaBusqueda.setText(termino);
                enlace.entradaBusqueda.setSelection(termino.length());
                ejecutarBusqueda(termino);
            });
            enlace.chipsRecientes.addView(chip);
        }
    }

    /** Oculta el teclado virtual y quita el foco del campo de búsqueda. */
    private void ocultarTeclado() {
        InputMethodManager imm = (InputMethodManager)
            requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null && getView() != null) {
            imm.hideSoftInputFromWindow(getView().getWindowToken(), 0);
        }
        enlace.entradaBusqueda.clearFocus();
    }

    /**
     * Libera la referencia al binding al destruirse la vista del fragmento,
     * evitando fugas de memoria.
     */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }

    /** TextWatcher minimalista que solo reacciona cuando el campo queda vacío. */
    private static class SoloAlVaciar implements android.text.TextWatcher {
        private final Runnable alVaciar;
        SoloAlVaciar(Runnable alVaciar) { this.alVaciar = alVaciar; }
        @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) { }
        @Override public void onTextChanged(CharSequence s, int a, int b, int c) { }
        @Override public void afterTextChanged(android.text.Editable s) {
            if (s.length() == 0) alVaciar.run();
        }
    }
}
