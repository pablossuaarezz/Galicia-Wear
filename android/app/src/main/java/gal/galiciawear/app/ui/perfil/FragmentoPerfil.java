package gal.galiciawear.app.ui.perfil;

import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoPerfilBinding;
import gal.galiciawear.app.modelovista.ModeloVistaPerfil;
import gal.galiciawear.app.ui.autenticacion.ActividadAutenticacion;
import gal.galiciawear.app.ui.chat.ActividadConversaciones;
import gal.galiciawear.app.ui.disenador.ActividadMisPrendas;
import gal.galiciawear.app.ui.disenador.ActividadPerfilDisenador;
import gal.galiciawear.app.utilidades.Constantes;
import gal.galiciawear.app.utilidades.ImagenBase64;

/**
 * Pestaña "Perfil" del menú inferior de {@code ActividadPrincipal}.
 * Muestra los datos del usuario (nombre, correo, rol, avatar), permite
 * acceder a la edición de perfil, al soporte/conversaciones y, si el
 * usuario tiene rol DISEÑADOR, a su perfil de diseñador y a "Mis prendas".
 * También gestiona el cierre de sesión.
 */
@AndroidEntryPoint
public class FragmentoPerfil extends Fragment {

    /** Enlace generado por View Binding; se anula en {@link #onDestroyView()}. */
    private FragmentoPerfilBinding enlace;
    /** ViewModel que expone los datos de perfil y las operaciones de sesión. */
    private ModeloVistaPerfil modeloVista;

    // Al volver de la edición con éxito, recargamos el perfil.
    /**
     * Lanzador que abre {@link ActividadEditarPerfil} y, si el usuario guarda
     * los cambios ({@code RESULT_OK}), vuelve a cargar el perfil para
     * refrescar los datos mostrados (nombre, avatar, etc.).
     */
    private final ActivityResultLauncher<Intent> lanzadorEdicion =
        registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), resultado -> {
            if (resultado.getResultCode() == android.app.Activity.RESULT_OK) {
                modeloVista.cargarPerfil();
            }
        });

    /**
     * Infla el layout del fragmento mediante View Binding.
     *
     * @param inflater  inflador de layouts proporcionado por el sistema.
     * @param container contenedor padre al que se añadirá la vista.
     * @param saved     estado guardado del fragmento, o {@code null}.
     * @return la vista raíz del fragmento.
     */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoPerfilBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Configura toda la lógica de la pantalla una vez la vista está creada:
     * obtención del ViewModel, pintado rápido de nombre/rol desde preferencias,
     * visibilidad de las opciones de diseñador, listeners de los botones
     * (editar perfil, soporte, cerrar sesión) y observadores del perfil y
     * del cierre de sesión.
     *
     * @param view                vista raíz ya creada del fragmento.
     * @param savedInstanceState  estado guardado del fragmento, o {@code null}.
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(this).get(ModeloVistaPerfil.class);

        // Nombre rápido desde SharedPreferences (sin esperar a la red)
        enlace.textoNombre.setText(modeloVista.obtenerNombreUsuario());
        enlace.textoRol.setText(modeloVista.obtenerRolUsuario());

        // Área de diseñador: solo se muestra a usuarios con rol DISENADOR.
        if (Constantes.ROL_DISENADOR.equals(modeloVista.obtenerRolUsuario())) {
            enlace.botonPerfilDisenador.setVisibility(View.VISIBLE);
            enlace.botonMisPrendas.setVisibility(View.VISIBLE);
            enlace.divisorDisenador.setVisibility(View.VISIBLE);

            enlace.botonPerfilDisenador.setOnClickListener(v ->
                startActivity(new Intent(requireContext(), ActividadPerfilDisenador.class)));
            enlace.botonMisPrendas.setOnClickListener(v ->
                startActivity(new Intent(requireContext(), ActividadMisPrendas.class)));
        }

        // Abre la pantalla de edición y espera su resultado mediante lanzadorEdicion.
        enlace.botonEditarPerfil.setOnClickListener(v ->
            lanzadorEdicion.launch(new Intent(requireContext(), ActividadEditarPerfil.class)));

        // Soporte: bandeja de conversaciones (disponible para cliente y tienda).
        enlace.botonSoporte.setOnClickListener(v ->
            startActivity(new Intent(requireContext(), ActividadConversaciones.class)));

        modeloVista.cargarPerfil();

        // Observa la respuesta del backend con los datos completos del perfil
        // y actualiza la cabecera (nombre completo, correo, rol y avatar).
        modeloVista.observarPerfil().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso.esExito() && recurso.datos != null) {
                String nombre    = recurso.datos.nombre    != null ? recurso.datos.nombre    : "";
                String apellidos = recurso.datos.apellidos != null ? recurso.datos.apellidos : "";
                String nombreCompleto = (nombre + " " + apellidos).trim();

                enlace.textoNombre.setText(nombreCompleto);
                enlace.textoCorreo.setText(recurso.datos.correo);
                enlace.textoRol.setText(recurso.datos.rol);

                // Inicial del avatar a partir del nombre real (en vez de la "A" fija).
                if (!nombreCompleto.isEmpty()) {
                    enlace.textoInicial.setText(
                        nombreCompleto.substring(0, 1).toUpperCase()
                    );
                }
                mostrarAvatar(recurso.datos.avatarUrl);
            }
        });

        // Confirmación antes de cerrar sesión (prevención de errores)
        enlace.botonCerrarSesion.setOnClickListener(v ->
            new AlertDialog.Builder(requireContext())
                .setTitle("Cerrar sesión")
                .setMessage("¿Seguro que quieres cerrar sesión?")
                .setPositiveButton("Salir", (d, w) -> modeloVista.cerrarSesion())
                .setNegativeButton("Cancelar", null)
                .show()
        );

        // Si el ViewModel confirma que la sesión se cerró, se navega a Autenticación
        // limpiando toda la pila de actividades (el usuario no puede volver atrás
        // a pantallas de la sesión anterior).
        modeloVista.observarCierreSesion().observe(getViewLifecycleOwner(), cerro -> {
            if (Boolean.TRUE.equals(cerro)) {
                Intent intent = new Intent(requireContext(), ActividadAutenticacion.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
            }
        });
    }

    /** Muestra la foto de perfil (base64) o, si no hay, la inicial del nombre. */
    private void mostrarAvatar(String avatarUrl) {
        Bitmap bitmap = ImagenBase64.aBitmap(avatarUrl);
        boolean hayFoto = bitmap != null;
        if (hayFoto) enlace.imagenAvatar.setImageBitmap(bitmap);
        enlace.imagenAvatar.setVisibility(hayFoto ? View.VISIBLE : View.GONE);
        enlace.textoInicial.setVisibility(hayFoto ? View.GONE : View.VISIBLE);
    }

    /**
     * Libera la referencia al enlace de View Binding cuando se destruye la
     * vista del fragmento, evitando fugas de memoria.
     */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
