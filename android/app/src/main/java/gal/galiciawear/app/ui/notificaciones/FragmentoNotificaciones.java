package gal.galiciawear.app.ui.notificaciones;

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

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoNotificacionesBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoNotificacion;
import gal.galiciawear.app.modelovista.ModeloVistaNotificaciones;
import gal.galiciawear.app.ui.chat.ActividadChat;
import gal.galiciawear.app.ui.pedidos.ActividadDetallePedido;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Bandeja de notificaciones in-app. Lee el historial de MongoDB vía API
 * (GET /notificaciones), marca leídas y, al pulsar, navega según el tipo:
 *   - PEDIDO_*      → detalle del pedido.
 *   - MENSAJE_NUEVO → chat con el remitente.
 *
 * Refresca en vivo al recibir "nueva_notificacion" por Socket.IO mientras está visible.
 */
@AndroidEntryPoint
public class FragmentoNotificaciones extends Fragment {

    private FragmentoNotificacionesBinding enlace;
    private ModeloVistaNotificaciones modeloVista;
    private AdaptadorNotificaciones adaptador;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoNotificacionesBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaNotificaciones.class);

        adaptador = new AdaptadorNotificaciones(this::abrirNotificacion);
        enlace.listaNotificaciones.setLayoutManager(new LinearLayoutManager(requireContext()));
        enlace.listaNotificaciones.setAdapter(adaptador);

        // Tiempo real: si llega una notificación mientras la bandeja está abierta, recargar.
        modeloVista.nuevaNotificacion().observe(getViewLifecycleOwner(), notif -> {
            if (notif != null) cargar();
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        cargar();
    }

    private void cargar() {
        modeloVista.listar().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null || enlace == null) return;
            if (recurso.esExito()) {
                List<DtoNotificacion> lista = recurso.datos;
                boolean vacio = lista == null || lista.isEmpty();
                enlace.textoVacio.setVisibility(vacio ? View.VISIBLE : View.GONE);
                if (vacio) enlace.textoVacio.setText("No tienes notificaciones");
                enlace.listaNotificaciones.setVisibility(vacio ? View.GONE : View.VISIBLE);
                adaptador.establecer(lista);
            } else if (recurso.esError()) {
                if (adaptador.getItemCount() == 0) {
                    enlace.textoVacio.setVisibility(View.VISIBLE);
                    enlace.textoVacio.setText("No se pudieron cargar las notificaciones");
                }
            }
        });
    }

    private void abrirNotificacion(DtoNotificacion n) {
        // Marcar leída (servidor) y navegar según el tipo.
        if (n.id != null && !n.leida) modeloVista.marcarLeida(n.id);

        String tipo = n.tipo != null ? n.tipo : "";
        if (tipo.startsWith("PEDIDO_")) {
            String pedidoId = n.dato("pedidoId");
            if (pedidoId != null) {
                Intent intent = new Intent(requireContext(), ActividadDetallePedido.class);
                intent.putExtra(Constantes.EXTRA_PEDIDO_ID, pedidoId);
                startActivity(intent);
            }
        } else if (tipo.equals("MENSAJE_NUEVO")) {
            String peerId = n.dato("peerId");
            if (peerId != null) {
                Intent intent = new Intent(requireContext(), ActividadChat.class);
                intent.putExtra(Constantes.EXTRA_DISENADOR_ID, peerId);
                intent.putExtra(Constantes.EXTRA_DISENADOR_NOMBRE, n.dato("nombre"));
                startActivity(intent);
            }
        }
    }

    /** Marca todas como leídas y refresca la lista. Lo invoca {@link ActividadNotificaciones}. */
    public void marcarTodasLeidas() {
        modeloVista.marcarTodasLeidas().observe(getViewLifecycleOwner(), ok -> {
            if (Boolean.TRUE.equals(ok)) cargar();
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
