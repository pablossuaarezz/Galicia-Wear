package gal.galiciawear.app.ui.autenticacion;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoRegistroBinding;
import gal.galiciawear.app.modelovista.ModeloVistaAutenticacion;
import gal.galiciawear.app.utilidades.Constantes;

@AndroidEntryPoint
public class FragmentoRegistro extends Fragment {

    private FragmentoRegistroBinding enlace;
    private ModeloVistaAutenticacion modeloVista;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoRegistroBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(requireActivity()).get(ModeloVistaAutenticacion.class);

        enlace.botonRegistrarse.setOnClickListener(v -> realizarRegistro());

        modeloVista.observarRegistro().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.botonRegistrarse.setEnabled(false);
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                if (getActivity() instanceof ActividadAutenticacion) {
                    ((ActividadAutenticacion) getActivity()).navegarAPrincipal();
                }
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonRegistrarse.setEnabled(true);
                // Limpiamos cualquier error de campo previo y mostramos el mensaje real del
                // backend en una Snackbar — así no inducimos a pensar que el error es del correo.
                enlace.campoCorreo.setError(null);
                enlace.campoContrasena.setError(null);
                enlace.campoNombre.setError(null);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void realizarRegistro() {
        String correo     = obtenerTexto(enlace.entradaCorreo);
        String contrasena = obtenerTexto(enlace.entradaContrasena);
        String nombre     = obtenerTexto(enlace.entradaNombre);
        String apellidos  = obtenerTexto(enlace.entradaApellidos);

        if (correo.isEmpty() || contrasena.length() < 6 || nombre.isEmpty()) {
            enlace.campoNombre.setError("Completa todos los campos (contraseña ≥ 6 caracteres)");
            return;
        }

        String rol = enlace.radioCliente.isChecked() ? Constantes.ROL_CLIENTE : Constantes.ROL_DISENADOR;
        modeloVista.registrarse(correo, contrasena, nombre, apellidos, rol);
    }

    private String obtenerTexto(android.widget.EditText campo) {
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
