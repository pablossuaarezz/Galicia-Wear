package gal.galiciawear.app.ui.perfil;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoPerfilBinding;
import gal.galiciawear.app.modelovista.ModeloVistaPerfil;
import gal.galiciawear.app.ui.autenticacion.ActividadAutenticacion;
import gal.galiciawear.app.ui.disenador.ActividadMisPrendas;
import gal.galiciawear.app.ui.disenador.ActividadPerfilDisenador;
import gal.galiciawear.app.utilidades.Constantes;

@AndroidEntryPoint
public class FragmentoPerfil extends Fragment {

    private FragmentoPerfilBinding enlace;
    private ModeloVistaPerfil modeloVista;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoPerfilBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

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

        modeloVista.cargarPerfil();

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

        modeloVista.observarCierreSesion().observe(getViewLifecycleOwner(), cerro -> {
            if (Boolean.TRUE.equals(cerro)) {
                Intent intent = new Intent(requireContext(), ActividadAutenticacion.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
