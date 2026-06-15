package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoConversacion;
import gal.galiciawear.app.datos.repositorio.RepositorioChat;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de la bandeja de conversaciones de soporte. Lista las conversaciones del
 * usuario (cliente o tienda) vía REST; el chat en tiempo real lo gestiona
 * {@link gal.galiciawear.app.modelovista.ModeloVistaChat}.
 */
@HiltViewModel
public class ModeloVistaConversaciones extends ViewModel {

    private final RepositorioChat repositorioChat;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorioChat repositorio de chat usado para listar conversaciones.
     */
    @Inject
    public ModeloVistaConversaciones(RepositorioChat repositorioChat) {
        this.repositorioChat = repositorioChat;
    }

    /**
     * Obtiene el listado de conversaciones de soporte del usuario.
     * Delega directamente en el repositorio, que es quien realiza la llamada
     * REST y publica el resultado en el LiveData devuelto.
     *
     * @return LiveData con el estado (cargando/éxito/error) de la lista de conversaciones.
     */
    public LiveData<RecursoUi<List<DtoConversacion>>> listarConversaciones() {
        return repositorioChat.listarConversaciones();
    }
}
