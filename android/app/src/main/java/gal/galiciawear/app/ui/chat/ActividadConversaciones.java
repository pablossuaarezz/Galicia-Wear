package gal.galiciawear.app.ui.chat;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadConversacionesBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoConversacion;
import gal.galiciawear.app.modelovista.ModeloVistaConversaciones;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Bandeja de conversaciones de soporte. Reutilizable por ambos roles: para el cliente
 * lista las tiendas con las que habla; para la tienda, los clientes que la contactaron.
 * Al pulsar una conversación abre {@link ActividadChat} con ese interlocutor.
 */
@AndroidEntryPoint
public class ActividadConversaciones extends AppCompatActivity {

    private ActividadConversacionesBinding enlace;
    private ModeloVistaConversaciones modeloVista;
    private AdaptadorConversaciones adaptador;

    /**
     * Inicializa la pantalla: infla el binding, obtiene el ViewModel, configura
     * el botón de retroceso de la barra de herramientas y el RecyclerView de
     * conversaciones con su adaptador, cuyo listener de clic abre el chat con
     * el interlocutor seleccionado mediante {@link #abrirChat}.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadConversacionesBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaConversaciones.class);

        enlace.barraHerramientas.setNavigationOnClickListener(v -> finish());

        adaptador = new AdaptadorConversaciones(this::abrirChat);
        enlace.listaConversaciones.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaConversaciones.setAdapter(adaptador);
    }

    /**
     * Recarga la lista de conversaciones cada vez que la pantalla vuelve a
     * primer plano, de forma que se reflejen los mensajes nuevos recibidos
     * mientras el usuario estaba en otra pantalla.
     */
    @Override
    protected void onResume() {
        super.onResume();
        cargarConversaciones();
    }

    /**
     * Solicita al ViewModel la lista de conversaciones del usuario y observa
     * el resultado: muestra el indicador de carga mientras se obtiene, pinta
     * la lista (o el estado vacío si no hay conversaciones) en caso de éxito,
     * y también muestra el estado vacío si la petición falla.
     */
    private void cargarConversaciones() {
        modeloVista.listarConversaciones().observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                List<DtoConversacion> conversaciones = recurso.datos;
                boolean vacio = conversaciones == null || conversaciones.isEmpty();
                enlace.estadoVacio.setVisibility(vacio ? View.VISIBLE : View.GONE);
                enlace.listaConversaciones.setVisibility(vacio ? View.GONE : View.VISIBLE);
                adaptador.establecer(conversaciones);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.estadoVacio.setVisibility(View.VISIBLE);
            }
        });
    }

    /**
     * Abre {@link ActividadChat} pasando el id y nombre del interlocutor
     * (diseñador o cliente, según el rol del usuario actual) de la
     * conversación seleccionada.
     */
    private void abrirChat(DtoConversacion conversacion) {
        Intent intent = new Intent(this, ActividadChat.class);
        intent.putExtra(Constantes.EXTRA_DISENADOR_ID, conversacion.peerId);
        intent.putExtra(Constantes.EXTRA_DISENADOR_NOMBRE, conversacion.nombre);
        startActivity(intent);
    }

    /** Libera la referencia al binding al destruirse la actividad, evitando fugas de memoria. */
    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
