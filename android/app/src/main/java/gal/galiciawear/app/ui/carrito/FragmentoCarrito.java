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

import com.google.android.material.snackbar.Snackbar;

import java.util.Locale;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoCarritoBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.modelovista.ModeloVistaCarrito;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * Pestaña del carrito.
 *
 * Observa el estado compartido del carrito (fuente única en el repositorio): al
 * añadir desde el detalle de un producto o al modificar la cantidad aquí, la lista
 * y el total se actualizan al instante. Las operaciones (cantidad/eliminar) se
 * observan con el ciclo de vida de la vista para no filtrar observadores.
 */
@AndroidEntryPoint
public class FragmentoCarrito extends Fragment {

    private FragmentoCarritoBinding enlace;
    private ModeloVistaCarrito modeloVista;
    private AdaptadorItemCarrito adaptador;

    /**
     * Infla el layout del fragmento mediante ViewBinding y devuelve su vista raíz.
     */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoCarritoBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Obtiene el ViewModel del carrito, crea el adaptador del RecyclerView con
     * las acciones de cambiar cantidad y eliminar (delegando en
     * {@link #observarOperacion} para mostrar feedback de cada operación),
     * configura el botón de ir al checkout, y observa el estado del carrito
     * para renderizar la lista y el total.
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaCarrito.class);

        adaptador = new AdaptadorItemCarrito(new AdaptadorItemCarrito.Acciones() {
            @Override
            public void onCambiarCantidad(String varianteId, int nuevaCantidad) {
                // No se muestra mensaje de éxito al cambiar cantidad: el cambio
                // visual en la propia línea ya es suficiente feedback.
                observarOperacion(modeloVista.actualizarCantidad(varianteId, nuevaCantidad), null);
            }

            @Override
            public void onEliminar(String varianteId) {
                // Al eliminar sí se muestra un Snackbar de confirmación.
                observarOperacion(modeloVista.eliminarDelCarrito(varianteId),
                    getString(gal.galiciawear.app.R.string.articulo_eliminado));
            }
        });
        enlace.listaCarrito.setLayoutManager(new LinearLayoutManager(requireContext()));
        enlace.listaCarrito.setAdapter(adaptador);

        // Navega a la pantalla de checkout para confirmar el pedido.
        enlace.botonCheckout.setOnClickListener(v ->
            startActivity(new Intent(requireContext(), ActividadCheckout.class))
        );

        modeloVista.observarCarrito().observe(getViewLifecycleOwner(), this::renderizar);
        modeloVista.cargarCarrito();
    }

    /**
     * Actualiza la UI según el estado del carrito recibido: muestra el
     * indicador de carga a pantalla completa solo si aún no hay items
     * pintados, gestiona el caso de error sin datos previos, y en caso de
     * éxito muestra la lista de items (o el estado vacío) junto con el total.
     */
    private void renderizar(RecursoUi<DtoRespuestaCarrito> recurso) {
        if (recurso == null) return;

        boolean cargando = recurso.estaCargando();
        boolean tieneItems = recurso.esExito() && recurso.datos != null && !recurso.datos.estaVacio();

        // Solo mostramos el spinner a pantalla completa si aún no hay nada que enseñar.
        enlace.indicadorCarga.setVisibility(
            cargando && adaptador.getItemCount() == 0 ? View.VISIBLE : View.GONE);

        if (recurso.esError() && adaptador.getItemCount() == 0) {
            enlace.grupoVacio.setVisibility(View.GONE);
            enlace.pieCarrito.setVisibility(View.GONE);
            if (recurso.mensaje != null) {
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
            return;
        }

        if (recurso.esExito()) {
            DtoRespuestaCarrito carrito = recurso.datos;
            enlace.grupoVacio.setVisibility(tieneItems ? View.GONE : View.VISIBLE);
            enlace.pieCarrito.setVisibility(tieneItems ? View.VISIBLE : View.GONE);
            adaptador.establecerItems(carrito != null ? carrito.items : null);
            if (tieneItems) {
                enlace.textoTotal.setText(
                    String.format(Locale.getDefault(), "%.2f €", carrito.calcularTotal()));
            }
        }
    }

    /** Observa una operación de un solo uso para mostrar errores/confirmaciones. */
    private void observarOperacion(
        androidx.lifecycle.LiveData<RecursoUi<DtoRespuestaCarrito>> operacion,
        @Nullable String mensajeExito) {
        operacion.observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            if (recurso.esError() && recurso.mensaje != null) {
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            } else if (recurso.esExito() && mensajeExito != null) {
                Snackbar.make(enlace.getRoot(), mensajeExito, Snackbar.LENGTH_SHORT).show();
            }
        });
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
}
