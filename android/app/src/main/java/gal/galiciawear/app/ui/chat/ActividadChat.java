package gal.galiciawear.app.ui.chat;

import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadChatBinding;
import gal.galiciawear.app.modelovista.ModeloVistaChat;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Chat en tiempo real con el diseñador vía Socket.IO.
 *
 * JUSTIFICACIÓN: Socket.IO permite mensajería bidireccional sin polling.
 * La Activity se conecta al sala de diseñador específico usando su ID,
 * y los mensajes se muestran en un RecyclerView con scroll automático
 * al último mensaje (criterio UX: feedback inmediato).
 */
@AndroidEntryPoint
public class ActividadChat extends AppCompatActivity {

    private ActividadChatBinding enlace;
    private ModeloVistaChat modeloVista;
    private AdaptadorMensajes adaptadorMensajes;
    private String disenadorId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadChatBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaChat.class);

        disenadorId = getIntent().getStringExtra(Constantes.EXTRA_DISENADOR_ID);
        String nombreDisenador = getIntent().getStringExtra(Constantes.EXTRA_DISENADOR_NOMBRE);

        setSupportActionBar(enlace.barraHerramientas);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(nombreDisenador != null ? nombreDisenador : "Chat");
        }

        // RecyclerView con scroll al último mensaje
        adaptadorMensajes = new AdaptadorMensajes(modeloVista.obtenerUsuarioId());
        enlace.listaMensajes.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaMensajes.setAdapter(adaptadorMensajes);

        configurarEnvioMensaje();
        observarEstados();

        // Iniciar chat (conecta socket y se une a la sala del diseñador)
        if (disenadorId != null) {
            modeloVista.iniciarChat(disenadorId);
        }
    }

    private void configurarEnvioMensaje() {
        enlace.botonEnviar.setOnClickListener(v -> {
            String texto = enlace.campoMensaje.getText().toString().trim();
            if (!texto.isEmpty()) {
                modeloVista.enviarMensaje(texto);
                enlace.campoMensaje.setText("");
            }
        });
    }

    private void observarEstados() {
        modeloVista.observarMensajes().observe(this, mensajes -> {
            adaptadorMensajes.establecerMensajes(mensajes);
            if (!mensajes.isEmpty()) {
                // Scroll al último mensaje para que sea visible siempre
                enlace.listaMensajes.scrollToPosition(mensajes.size() - 1);
            }
        });

        modeloVista.observarConexion().observe(this, conectado -> {
            enlace.textoEstadoConexion.setText(conectado ? "Conectado" : "Reconectando…");
            enlace.textoEstadoConexion.setVisibility(conectado ? View.GONE : View.VISIBLE);
            enlace.botonEnviar.setEnabled(conectado);
        });
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
