package gal.galiciawear.app.ui.autenticacion;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.FragmentoRegistroBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDisenador;
import gal.galiciawear.app.modelovista.ModeloVistaAutenticacion;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Registro con dos formularios distintos según el tipo de cuenta:
 *  - Cliente: nombre y apellidos.
 *  - Diseñador: datos del negocio (marca, biografía, ciudad, IBAN, logo, web).
 *
 * Al elegir el rol se muestra/oculta el bloque correspondiente. El alta de
 * diseñador crea la cuenta y el perfil de negocio en un solo paso; queda
 * pendiente de validación por un administrador (panel JavaFX).
 */
@AndroidEntryPoint
public class FragmentoRegistro extends Fragment {

    private FragmentoRegistroBinding enlace;
    private ModeloVistaAutenticacion modeloVista;
    private String[] ciudadValores;

    /**
     * Infla el layout del fragmento mediante ViewBinding y devuelve su vista raíz.
     * La configuración de listeners y observadores se realiza más adelante en
     * {@link #onViewCreated(View, Bundle)}.
     */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoRegistroBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Configura el ViewModel compartido, el selector de ciudad del diseñador, el
     * grupo de radio buttons para elegir el rol (cliente/diseñador) y los
     * observadores de los resultados de registro (tanto de cliente como de
     * diseñador), además del listener del botón de envío del formulario.
     */
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        modeloVista = new ViewModelProvider(requireActivity()).get(ModeloVistaAutenticacion.class);

        // Selector de ciudad del diseñador (valores = enum CiudadGallega).
        ciudadValores = getResources().getStringArray(R.array.ciudad_valores);
        ArrayAdapter<CharSequence> adapCiudad = ArrayAdapter.createFromResource(
            requireContext(), R.array.ciudad_etiquetas, android.R.layout.simple_spinner_item);
        adapCiudad.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        enlace.selectorCiudad.setAdapter(adapCiudad);

        // Cambiar de rol intercambia el formulario visible.
        enlace.grupoRol.setOnCheckedChangeListener((g, id) -> aplicarRol());
        aplicarRol();

        enlace.botonRegistrarse.setOnClickListener(v -> realizarRegistro());

        // Registro de cliente.
        modeloVista.observarRegistro().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                // Petición de registro de cliente en curso: mostrar indicador.
                mostrarCarga(true);
            } else if (recurso.esExito()) {
                // Cuenta de cliente creada correctamente: ir a la pantalla principal.
                mostrarCarga(false);
                irAPrincipal();
            } else if (recurso.esError()) {
                // Error devuelto por el backend (p. ej. correo duplicado).
                mostrarCarga(false);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });

        // Registro de diseñador (cuenta + perfil de negocio).
        modeloVista.observarRegistroDisenador().observe(getViewLifecycleOwner(), recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                // Petición de alta de diseñador (cuenta + perfil de negocio) en curso.
                mostrarCarga(true);
            } else if (recurso.esExito()) {
                mostrarCarga(false);
                Toast.makeText(requireContext(),
                    getString(R.string.pendiente_validacion), Toast.LENGTH_LONG).show();
                // Cuenta recién creada: aún sin validar → pantalla de espera.
                if (getActivity() instanceof ActividadAutenticacion) {
                    ((ActividadAutenticacion) getActivity()).navegarAPendienteDisenador();
                }
            } else if (recurso.esError()) {
                mostrarCarga(false);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    /** Muestra el formulario de cliente o el de diseñador según el rol marcado. */
    private void aplicarRol() {
        boolean esDisenador = enlace.radioDisenador.isChecked();
        enlace.contenedorCliente.setVisibility(esDisenador ? View.GONE : View.VISIBLE);
        enlace.contenedorDisenador.setVisibility(esDisenador ? View.VISIBLE : View.GONE);
        enlace.ayudaRol.setVisibility(esDisenador ? View.VISIBLE : View.GONE);
        enlace.botonRegistrarse.setText(
            esDisenador ? R.string.enviar_solicitud : R.string.crear_cuenta);
    }

    /**
     * Valida los campos comunes a ambos formularios (correo y contraseña) y
     * delega en {@link #registrarCliente} o {@link #registrarDisenador} según
     * el rol seleccionado en {@code enlace.radioDisenador}. La validación de
     * estos campos es local (en cliente); el backend repite la validación.
     */
    private void realizarRegistro() {
        String correo     = obtenerTexto(enlace.entradaCorreo);
        String contrasena = obtenerTexto(enlace.entradaContrasena);

        // Se limpian los errores previos antes de revalidar.
        enlace.campoCorreo.setError(null);
        enlace.campoContrasena.setError(null);

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

        if (enlace.radioDisenador.isChecked()) {
            registrarDisenador(correo, contrasena, valido);
        } else {
            registrarCliente(correo, contrasena, valido);
        }
    }

    /**
     * Valida los campos exclusivos del formulario de cliente (nombre y
     * apellidos) y, si todo es correcto (incluyendo la validación de los
     * campos comunes recibida en {@code valido}), invoca al ViewModel para
     * registrar la cuenta con el rol {@link Constantes#ROL_CLIENTE}.
     *
     * @param correo correo electrónico ya validado en {@link #realizarRegistro()}
     * @param contrasena contraseña ya validada en {@link #realizarRegistro()}
     * @param valido resultado de la validación de los campos comunes
     */
    private void registrarCliente(String correo, String contrasena, boolean valido) {
        String nombre    = obtenerTexto(enlace.entradaNombre);
        String apellidos = obtenerTexto(enlace.entradaApellidos);
        enlace.campoNombre.setError(null);
        enlace.campoApellidos.setError(null);

        if (nombre.isEmpty()) {
            enlace.campoNombre.setError("Nombre obligatorio");
            valido = false;
        }
        if (apellidos.isEmpty()) {
            enlace.campoApellidos.setError("Apellidos obligatorios");
            valido = false;
        }
        if (!valido) return;

        modeloVista.registrarse(correo, contrasena, nombre, apellidos, Constantes.ROL_CLIENTE);
    }

    /**
     * Valida los campos exclusivos del formulario de diseñador (nombre de
     * marca, biografía, IBAN, ciudad y URLs opcionales de logo y web) y, si
     * todo es correcto, construye un {@link DtoPeticionDisenador} y solicita
     * al ViewModel el alta combinada de cuenta + perfil de negocio.
     *
     * @param correo correo electrónico ya validado en {@link #realizarRegistro()}
     * @param contrasena contraseña ya validada en {@link #realizarRegistro()}
     * @param valido resultado de la validación de los campos comunes
     */
    private void registrarDisenador(String correo, String contrasena, boolean valido) {
        String nombreMarca = obtenerTexto(enlace.entradaNombreMarca);
        String biografia   = obtenerTexto(enlace.entradaBiografia);
        String iban        = obtenerTexto(enlace.entradaIban).replace(" ", "").toUpperCase();
        String urlLogo     = obtenerTexto(enlace.entradaUrlLogo);
        String urlWeb      = obtenerTexto(enlace.entradaUrlWeb);
        int posCiudad      = enlace.selectorCiudad.getSelectedItemPosition();
        // El array ciudadValores contiene los valores del enum CiudadGallega en
        // el mismo orden que las etiquetas mostradas en el spinner.
        String ciudad      = posCiudad >= 0 ? ciudadValores[posCiudad] : null;

        // Limpieza de errores previos en todos los campos del formulario de diseñador.
        enlace.campoNombreMarca.setError(null);
        enlace.campoBiografia.setError(null);
        enlace.campoIban.setError(null);
        enlace.campoUrlLogo.setError(null);
        enlace.campoUrlWeb.setError(null);

        if (nombreMarca.length() < 2 || nombreMarca.length() > 100) {
            enlace.campoNombreMarca.setError("Entre 2 y 100 caracteres");
            valido = false;
        }
        if (biografia.length() < 10 || biografia.length() > 2000) {
            enlace.campoBiografia.setError("Entre 10 y 2000 caracteres");
            valido = false;
        }
        if (!iban.matches("^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$")) {
            enlace.campoIban.setError("Formato IBAN no válido (ej. ES91...)");
            valido = false;
        }
        if (!urlLogo.isEmpty() && !android.util.Patterns.WEB_URL.matcher(urlLogo).matches()) {
            enlace.campoUrlLogo.setError("URL no válida");
            valido = false;
        }
        if (!urlWeb.isEmpty() && !android.util.Patterns.WEB_URL.matcher(urlWeb).matches()) {
            enlace.campoUrlWeb.setError("URL no válida");
            valido = false;
        }
        if (!valido) return;

        modeloVista.registrarComoDisenador(correo, contrasena,
            new DtoPeticionDisenador(nombreMarca, biografia, ciudad, iban, urlLogo, urlWeb));
    }

    /** Navega a la pantalla principal usando la actividad contenedora (cliente registrado con éxito). */
    private void irAPrincipal() {
        if (getActivity() instanceof ActividadAutenticacion) {
            ((ActividadAutenticacion) getActivity()).navegarAPrincipal();
        }
    }

    /** Muestra/oculta el indicador de carga y bloquea el botón de registro mientras se procesa la petición. */
    private void mostrarCarga(boolean cargando) {
        enlace.indicadorCarga.setVisibility(cargando ? View.VISIBLE : View.GONE);
        enlace.botonRegistrarse.setEnabled(!cargando);
    }

    /** Reglas equivalentes a las del backend: ≥8 caracteres con mayúscula, minúscula y número. */
    private boolean contrasenaValida(String contrasena) {
        return contrasena.length() >= 8
            && contrasena.matches(".*[A-Z].*")
            && contrasena.matches(".*[a-z].*")
            && contrasena.matches(".*[0-9].*");
    }

    /** Devuelve el texto de un {@link android.widget.EditText} sin espacios al inicio/final, o cadena vacía si es nulo. */
    private String obtenerTexto(android.widget.EditText campo) {
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    /**
     * Libera la referencia al binding al destruirse la vista del fragmento,
     * evitando fugas de memoria.
     */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
