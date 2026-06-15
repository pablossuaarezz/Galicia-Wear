package gal.galiciawear.app.ui.principal;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadPrincipalBinding;
import gal.galiciawear.app.modelovista.ModeloVistaCarrito;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.Constantes;
import gal.galiciawear.app.ui.buscador.FragmentoBuscador;
import gal.galiciawear.app.ui.carrito.FragmentoCarrito;
import gal.galiciawear.app.ui.disenador.ActividadEditarPrenda;
import gal.galiciawear.app.ui.inicio.FragmentoInicio;
import gal.galiciawear.app.ui.notificaciones.FragmentoNotificaciones;
import gal.galiciawear.app.ui.pedidos.FragmentoPedidos;
import gal.galiciawear.app.ui.perfil.FragmentoPerfil;

/**
 * Actividad hub con BottomNavigationView — 5 pestañas.
 * Gestiona la navegación entre fragmentos sin recriarlos innecesariamente
 * usando attach/detach en lugar de replace, para preservar el estado de
 * scroll y los campos de búsqueda (criterio psicológico: consistencia).
 */
@AndroidEntryPoint
public class ActividadPrincipal extends AppCompatActivity {

    /** Gestor de sesión inyectado por Hilt, usado para conocer el rol del usuario actual. */
    @Inject GestorSesion gestorSesion;

    /** Enlace generado por View Binding para acceder a las vistas del layout. */
    private ActividadPrincipalBinding enlace;
    /** ViewModel del carrito; solo se crea si el usuario NO es diseñador. */
    private ModeloVistaCarrito modeloVistaCarrito;
    /** Indica si el usuario autenticado tiene el rol DISEÑADOR. */
    private boolean esDisenador;

    // Referencias a los fragmentos para attach/detach eficiente
    private final FragmentoInicio fragInicio          = new FragmentoInicio();
    private final FragmentoBuscador fragBuscador       = new FragmentoBuscador();
    private final FragmentoCarrito fragCarrito         = new FragmentoCarrito();
    private final FragmentoPedidos fragPedidos         = new FragmentoPedidos();
    private final FragmentoPerfil fragPerfil           = new FragmentoPerfil();

    /** Fragmento actualmente visible en el contenedor principal. */
    private Fragment fragmentoActivo = fragInicio;

    /**
     * Inicializa la actividad: determina el rol del usuario, prepara los
     * fragmentos de cada pestaña, configura el menú inferior según el rol
     * (diseñador o cliente), y atiende una posible apertura directa a una
     * pestaña concreta (por ejemplo, desde "Ver cesta").
     *
     * @param savedInstanceState estado previamente guardado de la actividad, o {@code null}.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadPrincipalBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        esDisenador = Constantes.ROL_DISENADOR.equals(gestorSesion.obtenerUsuarioRol());

        configurarFragmentos();
        configurarMenuSegunRol();
        configurarNavegacionInferior();
        // El diseñador no tiene carrito: ni se crea su ViewModel ni se observa el contador
        // (su ítem central es "Añadir prenda").
        if (!esDisenador) {
            modeloVistaCarrito = new ViewModelProvider(this).get(ModeloVistaCarrito.class);
            observarContadorCarrito();
        }
        // Si la actividad se abrió desde otra pantalla pidiendo ir directamente al carrito.
        atenderAperturaDirecta(getIntent());
    }

    /**
     * Se invoca cuando la actividad ya está en ejecución y recibe un nuevo
     * {@link Intent} (por ejemplo, al volver a esta actividad desde otra
     * pantalla con {@code FLAG_ACTIVITY_SINGLE_TOP}). Actualiza el intent
     * guardado y comprueba si hay que abrir una pestaña concreta.
     *
     * @param intent nuevo intent recibido por la actividad.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        atenderAperturaDirecta(intent);
    }

    /**
     * Permite que otras pantallas (p. ej. "Ver cesta") abran una pestaña concreta.
     * Si el intent recibido trae la extra {@link Constantes#EXTRA_ABRIR_CARRITO}
     * activa, selecciona programáticamente la pestaña "Carrito" en el menú inferior
     * (lo cual dispara el listener de navegación y muestra el fragmento correspondiente).
     *
     * @param intent intent recibido en {@link #onCreate} o {@link #onNewIntent}.
     */
    private void atenderAperturaDirecta(Intent intent) {
        if (intent != null && intent.getBooleanExtra(Constantes.EXTRA_ABRIR_CARRITO, false)) {
            enlace.navegacionInferior.setSelectedItemId(R.id.nav_carrito);
        }
    }

    /**
     * Añade los cinco fragmentos de las pestañas al contenedor principal en una
     * única transacción. Solo el fragmento de "Inicio" queda visible inicialmente;
     * el resto se añaden ocultos ({@code hide}) para poder mostrarlos más adelante
     * sin tener que recrearlos (attach/detach en vez de replace).
     */
    private void configurarFragmentos() {
        getSupportFragmentManager().beginTransaction()
            .add(R.id.contenedor_fragmento, fragInicio,   "inicio")
            .add(R.id.contenedor_fragmento, fragBuscador, "buscador").hide(fragBuscador)
            .add(R.id.contenedor_fragmento, fragCarrito,  "carrito").hide(fragCarrito)
            .add(R.id.contenedor_fragmento, fragPedidos,  "pedidos").hide(fragPedidos)
            .add(R.id.contenedor_fragmento, fragPerfil,   "perfil").hide(fragPerfil)
            .commit();
    }

    /**
     * Para cuentas de DISEÑADOR, el ítem central del menú deja de ser "Carrito" y pasa a ser
     * "Añadir prenda" con un icono "+". Al pulsarlo se abre el alta de prenda (acción, no pestaña).
     */
    /**
     * Para cuentas de DISEÑADOR, el ítem central del menú deja de ser "Carrito" y pasa a ser
     * "Añadir prenda" con un icono "+". Al pulsarlo se abre el alta de prenda (acción, no pestaña).
     */
    private void configurarMenuSegunRol() {
        if (!esDisenador) return;
        // Sustituye el icono y el texto del ítem central del BottomNavigationView.
        MenuItem central = enlace.navegacionInferior.getMenu().findItem(R.id.nav_carrito);
        central.setIcon(R.drawable.ic_mas);
        central.setTitle(R.string.nav_anadir_prenda);
    }

    /**
     * Configura el listener de selección de ítems del {@code BottomNavigationView}.
     * Traduce cada id de ítem al fragmento correspondiente y lo muestra mediante
     * {@link #mostrarFragmento(Fragment)}. Para el rol DISEÑADOR, el ítem central
     * no representa una pestaña sino que lanza directamente la pantalla de
     * "Añadir prenda" sin cambiar la selección del menú.
     */
    private void configurarNavegacionInferior() {
        enlace.navegacionInferior.setOnItemSelectedListener(item -> {
            int id = item.getItemId();

            // Diseñador: el botón central es una ACCIÓN ("Añadir prenda"), no una pestaña.
            if (id == R.id.nav_carrito && esDisenador) {
                startActivity(new Intent(this, ActividadEditarPrenda.class));
                return false; // no cambia la pestaña seleccionada
            }

            // Mapeo del id del ítem pulsado al fragmento que debe mostrarse.
            Fragment destino;
            if (id == R.id.nav_inicio)         destino = fragInicio;
            else if (id == R.id.nav_buscador)  destino = fragBuscador;
            else if (id == R.id.nav_carrito)   destino = fragCarrito;
            else if (id == R.id.nav_pedidos)   destino = fragPedidos;
            else if (id == R.id.nav_perfil)    destino = fragPerfil;
            else return false;

            mostrarFragmento(destino);
            return true;
        });
    }

    /**
     * Cambia el fragmento visible en el contenedor principal usando
     * {@code hide}/{@code show} (no {@code replace}), de modo que el
     * fragmento que se oculta conserva su estado (scroll, texto de búsqueda, etc.)
     * para cuando el usuario vuelva a esa pestaña.
     *
     * @param destino fragmento que debe pasar a estar visible.
     */
    private void mostrarFragmento(Fragment destino) {
        if (destino == fragmentoActivo) return;
        getSupportFragmentManager().beginTransaction()
            .hide(fragmentoActivo)
            .show(destino)
            .commit();
        fragmentoActivo = destino;
    }

    /**
     * Observa el número total de artículos del carrito y actualiza el badge
     * (insignia numérica) sobre el icono de la pestaña "Carrito" en el menú
     * inferior. Si el contador es nulo o cero, se elimina el badge.
     */
    // Muestra el badge con el número de ítems en el icono del carrito
    private void observarContadorCarrito() {
        modeloVistaCarrito.observarContadorItems().observe(this, cantidad -> {
            if (cantidad != null && cantidad > 0) {
                enlace.navegacionInferior.getOrCreateBadge(R.id.nav_carrito)
                    .setNumber(cantidad);
            } else {
                enlace.navegacionInferior.removeBadge(R.id.nav_carrito);
            }
        });
    }
}
