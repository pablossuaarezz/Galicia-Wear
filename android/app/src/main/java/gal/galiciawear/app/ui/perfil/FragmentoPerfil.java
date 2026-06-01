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

        modeloVista.cargarPerfil();

        modeloVista.observarPerfil().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso.esExito() && recurso.datos != null) {
                enlace.textoNombre.setText(
                    recurso.datos.nombre + " " + recurso.datos.apellidos
                );
                enlace.textoCorreo.setText(recurso.datos.correo);
                enlace.textoRol.setText(recurso.datos.rol);
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
