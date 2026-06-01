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

        boolean esCliente = enlace.radioCliente.isChecked();
        String rol = esCliente ? Constantes.ROL_CLIENTE : Constantes.ROL_DISENADOR;

        // Limpiamos errores previos antes de revalidar.
        enlace.campoCorreo.setError(null);
        enlace.campoContrasena.setError(null);
        enlace.campoNombre.setError(null);
        enlace.campoApellidos.setError(null);

        // Las reglas deben coincidir con las del backend (dto.ts): correo válido,
        // contraseña ≥ 8 con mayúscula, minúscula y número, y nombre + apellidos
        // obligatorios para clientes. Validar en el cliente evita un 400 confuso.
        boolean valido = true;

        if (correo.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(correo).matches()) {
            enlace.campoCorreo.setError("Introduce un correo electrónico válido");
            valido = false;
        }

        if (!contrasenaValida(contrasena)) {
            enlace.campoContrasena.setError(
                "Mínimo 8 caracteres, con mayúscula, minúscula y número");
            valido = false;
        }

        if (esCliente && nombre.isEmpty()) {
            enlace.campoNombre.setError("Nombre obligatorio");
            valido = false;
        }

        if (esCliente && apellidos.isEmpty()) {
            enlace.campoApellidos.setError("Apellidos obligatorios");
            valido = false;
        }

        if (!valido) return;

        modeloVista.registrarse(correo, contrasena, nombre, apellidos, rol);
    }

    /** Reglas equivalentes a las del backend: ≥8 caracteres con mayúscula, minúscula y número. */
    private boolean contrasenaValida(String contrasena) {
        return contrasena.length() >= 8
            && contrasena.matches(".*[A-Z].*")
            && contrasena.matches(".*[a-z].*")
            && contrasena.matches(".*[0-9].*");
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
