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

    @Inject
    public ModeloVistaConversaciones(RepositorioChat repositorioChat) {
        this.repositorioChat = repositorioChat;
    }

    public LiveData<RecursoUi<List<DtoConversacion>>> listarConversaciones() {
        return repositorioChat.listarConversaciones();
    }
}
