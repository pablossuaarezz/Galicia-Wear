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

    @Inject GestorSesion gestorSesion;

    private ActividadPrincipalBinding enlace;
    private ModeloVistaCarrito modeloVistaCarrito;
    private boolean esDisenador;

    // Referencias a los fragmentos para attach/detach eficiente
    private final FragmentoInicio fragInicio          = new FragmentoInicio();
    private final FragmentoBuscador fragBuscador       = new FragmentoBuscador();
    private final FragmentoCarrito fragCarrito         = new FragmentoCarrito();
    private final FragmentoPedidos fragPedidos         = new FragmentoPedidos();
    private final FragmentoPerfil fragPerfil           = new FragmentoPerfil();

    private Fragment fragmentoActivo = fragInicio;

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
        atenderAperturaDirecta(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        atenderAperturaDirecta(intent);
    }

    /** Permite que otras pantallas (p. ej. "Ver cesta") abran una pestaña concreta. */
    private void atenderAperturaDirecta(Intent intent) {
        if (intent != null && intent.getBooleanExtra(Constantes.EXTRA_ABRIR_CARRITO, false)) {
            enlace.navegacionInferior.setSelectedItemId(R.id.nav_carrito);
        }
    }

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
    private void configurarMenuSegunRol() {
        if (!esDisenador) return;
        MenuItem central = enlace.navegacionInferior.getMenu().findItem(R.id.nav_carrito);
        central.setIcon(R.drawable.ic_mas);
        central.setTitle(R.string.nav_anadir_prenda);
    }

    private void configurarNavegacionInferior() {
        enlace.navegacionInferior.setOnItemSelectedListener(item -> {
            int id = item.getItemId();

            // Diseñador: el botón central es una ACCIÓN ("Añadir prenda"), no una pestaña.
            if (id == R.id.nav_carrito && esDisenador) {
                startActivity(new Intent(this, ActividadEditarPrenda.class));
                return false; // no cambia la pestaña seleccionada
            }

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

    private void mostrarFragmento(Fragment destino) {
        if (destino == fragmentoActivo) return;
        getSupportFragmentManager().beginTransaction()
            .hide(fragmentoActivo)
            .show(destino)
            .commit();
        fragmentoActivo = destino;
    }

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
