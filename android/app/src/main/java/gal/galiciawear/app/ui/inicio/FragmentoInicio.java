package gal.galiciawear.app.ui.inicio;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;

import com.google.firebase.messaging.FirebaseMessaging;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.FragmentoInicioBinding;
import gal.galiciawear.app.modelovista.ModeloVistaNotificaciones;
import gal.galiciawear.app.modelovista.ModeloVistaProductos;
import gal.galiciawear.app.ui.detalle.ActividadDetalleProducto;
import gal.galiciawear.app.ui.notificaciones.ActividadNotificaciones;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla de inicio con catálogo de productos en grid 2 columnas.
 *
 * Criterios psicológicos:
 * - Caché offline: muestra datos de Room inmediatamente (sin spinner visible)
 *   mientras se carga la red en segundo plano.
 * - SwipeRefreshLayout: el usuario puede refrescar de forma natural.
 * - Grid 2 columnas: muestra más productos por pantalla sin saturar
 *   (equilibrio entre densidad y legibilidad).
 */
@AndroidEntryPoint
public class FragmentoInicio extends Fragment {

    private static final String TAG = "FragmentoInicio";

    private FragmentoInicioBinding enlace;
    private ModeloVistaProductos modeloVista;
    private ModeloVistaNotificaciones modeloVistaNotif;
    private AdaptadorProducto adaptador;
    private TextView badgeNotificaciones;

    /**
     * Infla el layout del fragmento mediante ViewBinding y devuelve su vista raíz.
     */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoInicioBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Obtiene los ViewModels de productos y notificaciones, configura el
     * RecyclerView del catálogo (grid 2 columnas), el SwipeRefreshLayout, la
     * campana de notificaciones y los observadores de los datos del catálogo
     * (caché local + red). Por último, lanza la carga inicial de productos.
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaProductos.class);
        modeloVistaNotif = new ViewModelProvider(this).get(ModeloVistaNotificaciones.class);

        configurarRecyclerView();
        configurarSwipeRefresh();
        configurarNotificaciones();
        observarDatos();

        // Carga inicial
        modeloVista.cargarProductos();
    }

    /**
     * Cada vez que el fragmento vuelve a primer plano, refresca el contador de
     * notificaciones no leídas (por ejemplo, tras volver de la bandeja de
     * notificaciones donde el usuario las marcó como leídas).
     */
    @Override
    public void onResume() {
        super.onResume();
        // Refrescar el badge al volver a la pantalla (p. ej. tras leer notificaciones).
        refrescarContadorNotificaciones();
    }

    /**
     * Campana de notificaciones en la barra superior: abre la bandeja, mantiene el badge de
     * no leídas (REST + tiempo real por Socket.IO) y registra el token FCM best-effort.
     */
    private void configurarNotificaciones() {
        // Busca la vista personalizada (icono + badge) del item de menú de notificaciones.
        MenuItem item = enlace.barraSuperior.getMenu().findItem(R.id.accion_notificaciones);
        if (item != null && item.getActionView() != null) {
            View accion = item.getActionView();
            badgeNotificaciones = accion.findViewById(R.id.badge_notificaciones);
            // Al pulsar la campana se abre la bandeja de notificaciones.
            accion.setOnClickListener(v ->
                startActivity(new Intent(requireContext(), ActividadNotificaciones.class)));
        }

        // Conectar el socket en cuanto se entra a Inicio para recibir notificaciones en vivo
        // aunque no se abra el chat. El backend une este socket a la sala personal usuario:<sub>.
        modeloVistaNotif.conectarTiempoReal();

        // Notificación en tiempo real → subir el badge (recontar contra el servidor).
        modeloVistaNotif.nuevaNotificacion().observe(getViewLifecycleOwner(), notif -> {
            if (notif != null) refrescarContadorNotificaciones();
        });

        sincronizarTokenFcm();
    }

    /**
     * Observa el contador de notificaciones no leídas y actualiza el badge:
     * lo muestra con el número (o "99+" si supera el límite) si hay no
     * leídas, o lo oculta si no hay ninguna.
     */
    private void refrescarContadorNotificaciones() {
        if (modeloVistaNotif == null) return;
        modeloVistaNotif.contador().observe(getViewLifecycleOwner(), noLeidas -> {
            if (badgeNotificaciones == null) return;
            if (noLeidas != null && noLeidas > 0) {
                badgeNotificaciones.setText(noLeidas > 99 ? "99+" : String.valueOf(noLeidas));
                badgeNotificaciones.setVisibility(View.VISIBLE);
            } else {
                badgeNotificaciones.setVisibility(View.GONE);
            }
        });
    }

    /**
     * Envía el token FCM actual al backend (best-effort). Hoy NO llega push real porque
     * google-services.json es un STUB; el camino fiable es in-app + Socket.IO. Se deja
     * cableado para cuando exista un proyecto Firebase real.
     */
    private void sincronizarTokenFcm() {
        try {
            FirebaseMessaging.getInstance().getToken().addOnCompleteListener(tarea -> {
                if (tarea.isSuccessful() && tarea.getResult() != null) {
                    modeloVistaNotif.registrarTokenFcm(tarea.getResult());
                }
            });
        } catch (Throwable t) {
            // Sin proyecto Firebase real, getToken() falla: se ignora (push opcional).
            Log.d(TAG, "FCM no disponible (stub): " + t.getMessage());
        }
    }

    /**
     * Configura el RecyclerView del catálogo con un {@link GridLayoutManager}
     * de 2 columnas y un {@link AdaptadorProducto} cuyo listener de clic abre
     * la pantalla de detalle del producto seleccionado, pasando su slug como
     * extra del {@link Intent}.
     */
    private void configurarRecyclerView() {
        adaptador = new AdaptadorProducto(producto -> {
            Intent intent = new Intent(requireContext(), ActividadDetalleProducto.class);
            intent.putExtra(Constantes.EXTRA_PRODUCTO_SLUG, producto.slug);
            startActivity(intent);
        });
        enlace.listaProductos.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        enlace.listaProductos.setAdapter(adaptador);
        enlace.listaProductos.setHasFixedSize(true);
    }

    /**
     * Configura el gesto "deslizar para refrescar": al activarlo se limpian
     * los filtros del ViewModel, lo que provoca una nueva carga del catálogo
     * completo desde el backend.
     */
    private void configurarSwipeRefresh() {
        enlace.refrescarContenido.setOnRefreshListener(() -> {
            modeloVista.limpiarFiltros();
        });
    }

    /**
     * Observa dos fuentes de datos del catálogo:
     * <ul>
     *   <li>La caché local (Room): se muestra de inmediato si aún no hay una
     *   respuesta de red exitosa, permitiendo ver contenido sin conexión.</li>
     *   <li>La respuesta de red: tiene prioridad sobre la caché, actualiza el
     *   indicador de "refrescando" del SwipeRefreshLayout, pinta los
     *   productos obtenidos (o el mensaje de catálogo vacío), y en caso de
     *   error muestra un aviso de "sin conexión" si no hay datos en pantalla.</li>
     * </ul>
     */
    private void observarDatos() {
        // Caché Room — respuesta inmediata sin conexión
        modeloVista.observarCache().observe(getViewLifecycleOwner(), entidades -> {
            if (entidades != null && !entidades.isEmpty()
                && (modeloVista.observarProductos() == null
                    || modeloVista.observarProductos().getValue() == null
                    || modeloVista.observarProductos().getValue().estaCargando())) {
                adaptador.establecerEntidades(entidades);
            }
        });

        // Respuesta de red (más reciente)
        modeloVista.observarProductos().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            enlace.refrescarContenido.setRefreshing(recurso.estaCargando());

            if (recurso.esExito() && recurso.datos != null) {
                adaptador.establecerDtos(recurso.datos);
                enlace.textoVacio.setVisibility(
                    recurso.datos.isEmpty() ? View.VISIBLE : View.GONE
                );
            } else if (recurso.esError()) {
                enlace.textoVacio.setText("Sin conexión — mostrando datos guardados");
                // Solo mostramos el aviso de "sin conexión" si no hay nada que enseñar.
                if (adaptador.getItemCount() == 0) {
                    enlace.textoVacio.setVisibility(View.VISIBLE);
                }
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
