package gal.galiciawear.app.ui.disenador;

import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.snackbar.Snackbar;

import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadEditarPrendaBinding;
import gal.galiciawear.app.databinding.DialogoVarianteBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionVariante;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoVariante;
import gal.galiciawear.app.modelovista.ModeloVistaPrendas;
import gal.galiciawear.app.utilidades.Constantes;
import gal.galiciawear.app.utilidades.ImagenBase64;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * Asistente de creación/edición de prenda guiado por pasos:
 *   1) Datos · 2) Fotos · 3) Tallas y stock · 4) Publicar.
 *
 * El paso 1 crea/actualiza la prenda (necesario para tener id antes de añadir
 * fotos y variantes). El último paso publica o guarda como borrador (activo).
 */
@AndroidEntryPoint
public class ActividadEditarPrenda extends AppCompatActivity {

    private static final int TOTAL_PASOS = 4;
    private static final int PASO_DATOS = 0, PASO_FOTOS = 1, PASO_TALLAS = 2, PASO_PUBLICAR = 3;

    private ActividadEditarPrendaBinding enlace;
    private ModeloVistaPrendas modeloVista;

    private AdaptadorVariante adaptadorVariantes;
    private AdaptadorFotoPrenda adaptadorFotos;

    private String[] materialValores;
    private String[] tallaValores;

    private String prendaId;        // null mientras la prenda no se ha creado
    private int pasoActual = PASO_DATOS;
    private int numFotos = 0;
    private int numVariantes = 0;

    private final ExecutorService ejecutorIo = Executors.newSingleThreadExecutor();

    // Selector de imagen del sistema (sin permisos: SAF concede acceso al Uri).
    private final ActivityResultLauncher<String> selectorFoto =
        registerForActivityResult(new ActivityResultContracts.GetContent(), this::subirFoto);

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadEditarPrendaBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaPrendas.class);
        prendaId = getIntent().getStringExtra(Constantes.EXTRA_PRENDA_ID);

        enlace.barraHerramientas.setNavigationOnClickListener(v -> finish());
        enlace.barraHerramientas.setTitle(
            prendaId == null ? R.string.nueva_prenda : R.string.editar_prenda);

        // Spinner de material (valor = enum MaterialPrincipal).
        materialValores = getResources().getStringArray(R.array.material_valores);
        ArrayAdapter<CharSequence> adapMaterial = ArrayAdapter.createFromResource(
            this, R.array.material_etiquetas, android.R.layout.simple_spinner_item);
        adapMaterial.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        enlace.selectorMaterial.setAdapter(adapMaterial);

        tallaValores = getResources().getStringArray(R.array.talla_valores);

        adaptadorVariantes = new AdaptadorVariante(this::eliminarVariante);
        enlace.listaVariantes.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaVariantes.setAdapter(adaptadorVariantes);

        adaptadorFotos = new AdaptadorFotoPrenda(new AdaptadorFotoPrenda.AlActuarSobreFoto() {
            @Override public void alEliminar(DtoImagen i) { eliminarFoto(i); }
            @Override public void alMarcarPrincipal(DtoImagen i) { marcarPrincipal(i); }
        });
        enlace.listaFotos.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaFotos.setAdapter(adaptadorFotos);

        enlace.botonAnadirVariante.setOnClickListener(v -> dialogoVariante());
        enlace.botonAnadirFoto.setOnClickListener(v -> selectorFoto.launch("image/*"));
        enlace.botonSiguiente.setOnClickListener(v -> onSiguiente());
        enlace.botonAtras.setOnClickListener(v -> onAtras());

        if (prendaId != null) {
            cargarPrenda();
        }
        irAPaso(PASO_DATOS);
    }

    // ── Navegación entre pasos ──────────────────────────────────────────────────

    private void irAPaso(int paso) {
        pasoActual = paso;
        enlace.flipperPasos.setDisplayedChild(paso);
        enlace.progresoPasos.setProgressCompat(paso + 1, true);

        int nombrePaso;
        int ayudaPaso;
        switch (paso) {
            case PASO_FOTOS:    nombrePaso = R.string.paso_fotos;  ayudaPaso = R.string.paso_fotos_ayuda;  break;
            case PASO_TALLAS:   nombrePaso = R.string.paso_tallas; ayudaPaso = R.string.paso_tallas_ayuda; break;
            case PASO_PUBLICAR: nombrePaso = R.string.paso_publicar; ayudaPaso = R.string.paso_publicar_ayuda; break;
            default:            nombrePaso = R.string.paso_datos;  ayudaPaso = R.string.paso_datos_ayuda;
        }
        enlace.textoPaso.setText(
            getString(R.string.paso_indicador, paso + 1, TOTAL_PASOS) + " · " + getString(nombrePaso));
        enlace.textoPasoAyuda.setText(ayudaPaso);

        enlace.botonSiguiente.setText(paso == PASO_PUBLICAR ? R.string.finalizar : R.string.siguiente);
        enlace.botonAtras.setText(paso == PASO_DATOS ? android.R.string.cancel : R.string.atras);

        if (paso == PASO_PUBLICAR) actualizarResumen();
    }

    private void onSiguiente() {
        switch (pasoActual) {
            case PASO_DATOS:    guardarDatosYAvanzar(); break;
            case PASO_FOTOS:    irAPaso(PASO_TALLAS); break;
            case PASO_TALLAS:   irAPaso(PASO_PUBLICAR); break;
            case PASO_PUBLICAR: finalizar(); break;
        }
    }

    private void onAtras() {
        if (pasoActual == PASO_DATOS) {
            finish();
        } else {
            irAPaso(pasoActual - 1);
        }
    }

    // ── Carga (modo edición) ────────────────────────────────────────────────────

    private void cargarPrenda() {
        modeloVista.obtenerMiPrenda(prendaId).observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                rellenar(recurso.datos);
                cargarVariantes();
                cargarFotos();
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void rellenar(DtoRespuestaProducto p) {
        enlace.entradaNombre.setText(p.nombre);
        enlace.entradaDescripcion.setText(p.descripcion);
        enlace.entradaPrecio.setText(String.valueOf(p.precioBase));
        enlace.entradaKm.setText(String.valueOf(p.kmOrigen));
        int pos = indiceDe(materialValores, p.materialPrincipal);
        if (pos >= 0) enlace.selectorMaterial.setSelection(pos);
        enlace.switchPublicar.setChecked(p.activo);
    }

    // ── Paso 1: datos básicos ───────────────────────────────────────────────────

    private void guardarDatosYAvanzar() {
        String nombre = texto(enlace.entradaNombre);
        String descripcion = texto(enlace.entradaDescripcion);
        String precioTxt = texto(enlace.entradaPrecio);
        String kmTxt = texto(enlace.entradaKm);
        int posMat = enlace.selectorMaterial.getSelectedItemPosition();
        String material = posMat >= 0 ? materialValores[posMat] : null;

        enlace.campoNombre.setError(null);
        enlace.campoDescripcion.setError(null);
        enlace.campoPrecio.setError(null);

        boolean valido = true;
        if (nombre.length() < 3) {
            enlace.campoNombre.setError("Mínimo 3 caracteres");
            valido = false;
        }
        if (descripcion.length() < 20) {
            enlace.campoDescripcion.setError("Mínimo 20 caracteres");
            valido = false;
        }
        double precio;
        try {
            precio = Double.parseDouble(precioTxt);
        } catch (NumberFormatException e) {
            precio = -1;
        }
        if (precio <= 0) {
            enlace.campoPrecio.setError("Introduce un precio válido");
            valido = false;
        }
        if (!valido) return;

        int km = kmTxt.isEmpty() ? 0 : Integer.parseInt(kmTxt);
        DtoPeticionProducto cuerpo = new DtoPeticionProducto(nombre, descripcion, precio, km, material);

        enlace.botonSiguiente.setEnabled(false);
        modeloVista.guardarPrenda(prendaId, cuerpo).observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonSiguiente.setEnabled(true);
                boolean eraNueva = prendaId == null;
                prendaId = recurso.datos.id;
                enlace.barraHerramientas.setTitle(R.string.editar_prenda);
                if (eraNueva) { cargarVariantes(); cargarFotos(); }
                irAPaso(PASO_FOTOS);
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonSiguiente.setEnabled(true);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    // ── Paso 4: publicar ────────────────────────────────────────────────────────

    private void actualizarResumen() {
        enlace.resumenNombre.setText(texto(enlace.entradaNombre));
        String precioTxt = texto(enlace.entradaPrecio);
        try {
            enlace.resumenPrecio.setText(
                String.format(Locale.getDefault(), "%.2f €", Double.parseDouble(precioTxt)));
        } catch (NumberFormatException e) {
            enlace.resumenPrecio.setText(precioTxt);
        }
        enlace.resumenDetalle.setText(
            getString(R.string.resumen_fotos, numFotos) + " · "
            + getString(R.string.resumen_variantes, numVariantes));
    }

    private void finalizar() {
        if (prendaId == null) { finish(); return; }
        boolean publicar = enlace.switchPublicar.isChecked();
        enlace.botonSiguiente.setEnabled(false);
        modeloVista.publicarPrenda(prendaId, publicar).observe(this, recurso -> {
            if (recurso == null || recurso.estaCargando()) {
                if (recurso != null) enlace.indicadorCarga.setVisibility(View.VISIBLE);
                return;
            }
            enlace.indicadorCarga.setVisibility(View.GONE);
            if (recurso.esExito()) {
                Snackbar.make(enlace.getRoot(),
                    publicar ? R.string.prenda_publicada : R.string.prenda_despublicada,
                    Snackbar.LENGTH_SHORT).show();
                enlace.getRoot().postDelayed(this::finish, 500);
            } else {
                enlace.botonSiguiente.setEnabled(true);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    // ── Variantes ───────────────────────────────────────────────────────────────

    private void cargarVariantes() {
        if (prendaId == null) return;
        modeloVista.listarVariantes(prendaId).observe(this, recurso -> {
            if (recurso == null || !recurso.esExito()) return;
            boolean vacio = recurso.datos == null || recurso.datos.isEmpty();
            numVariantes = vacio ? 0 : recurso.datos.size();
            enlace.textoSinVariantes.setVisibility(vacio ? View.VISIBLE : View.GONE);
            adaptadorVariantes.establecer(recurso.datos);
        });
    }

    private void dialogoVariante() {
        DialogoVarianteBinding d = DialogoVarianteBinding.inflate(getLayoutInflater());
        ArrayAdapter<CharSequence> adapTalla = ArrayAdapter.createFromResource(
            this, R.array.talla_etiquetas, android.R.layout.simple_spinner_item);
        adapTalla.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        d.selectorTalla.setAdapter(adapTalla);

        new AlertDialog.Builder(this)
            .setTitle(R.string.anadir_variante)
            .setView(d.getRoot())
            .setPositiveButton(R.string.guardar, (dlg, w) -> {
                String talla = tallaValores[d.selectorTalla.getSelectedItemPosition()];
                String color = obtener(d.entradaColor);
                String sku = obtener(d.entradaSku);
                String stockTxt = obtener(d.entradaStock);
                String ajusteTxt = obtener(d.entradaAjuste);
                if (color.isEmpty() || sku.length() < 3) {
                    Snackbar.make(enlace.getRoot(),
                        "Color obligatorio y SKU de 3+ caracteres", Snackbar.LENGTH_LONG).show();
                    return;
                }
                int stock = stockTxt.isEmpty() ? 0 : Integer.parseInt(stockTxt);
                double ajuste = ajusteTxt.isEmpty() ? 0 : Double.parseDouble(ajusteTxt);
                modeloVista.crearVariante(prendaId,
                        new DtoPeticionVariante(talla, color, sku, stock, ajuste))
                    .observe(this, this::trasOperacionVariante);
            })
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void eliminarVariante(DtoVariante v) {
        new AlertDialog.Builder(this)
            .setMessage("¿Eliminar la variante " + v.talla + " · " + v.color + "?")
            .setPositiveButton(R.string.eliminar, (d, w) ->
                modeloVista.eliminarVariante(prendaId, v.id).observe(this, this::trasOperacionVariante))
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void trasOperacionVariante(RecursoUi<Boolean> recurso) {
        if (recurso == null) return;
        if (recurso.esExito()) {
            cargarVariantes();
        } else if (recurso.esError()) {
            Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
        }
    }

    // ── Fotos (URL en SQL) ──────────────────────────────────────────────────────

    private void cargarFotos() {
        if (prendaId == null) return;
        modeloVista.listarImagenes(prendaId).observe(this, recurso -> {
            if (recurso == null || !recurso.esExito()) return;
            boolean vacio = recurso.datos == null || recurso.datos.isEmpty();
            numFotos = vacio ? 0 : recurso.datos.size();
            enlace.textoSinFotos.setVisibility(vacio ? View.VISIBLE : View.GONE);
            adaptadorFotos.establecer(recurso.datos);
        });
    }

    /** Sube la foto elegida en el móvil: la reduce y la envía como base64. */
    private void subirFoto(@Nullable Uri uri) {
        if (uri == null) return;
        if (prendaId == null) {
            Snackbar.make(enlace.getRoot(), R.string.guarda_prenda_primero, Snackbar.LENGTH_LONG).show();
            return;
        }
        // La primera foto se marca como principal automáticamente.
        boolean principal = numFotos == 0;
        enlace.indicadorCarga.setVisibility(View.VISIBLE);
        ejecutorIo.execute(() -> {
            String dataUri = ImagenBase64.desdeUri(getContentResolver(), uri);
            runOnUiThread(() -> {
                if (dataUri == null) {
                    enlace.indicadorCarga.setVisibility(View.GONE);
                    Snackbar.make(enlace.getRoot(), R.string.error_generico, Snackbar.LENGTH_LONG).show();
                    return;
                }
                modeloVista.crearImagen(prendaId, DtoPeticionImagen.desdeBase64(dataUri, null, principal))
                    .observe(this, this::trasOperacionFoto);
            });
        });
    }

    private void marcarPrincipal(DtoImagen i) {
        modeloVista.marcarImagenPrincipal(prendaId, i.id).observe(this, this::trasOperacionFoto);
    }

    private void eliminarFoto(DtoImagen i) {
        new AlertDialog.Builder(this)
            .setMessage("¿Eliminar esta foto?")
            .setPositiveButton(R.string.eliminar, (d, w) ->
                modeloVista.eliminarImagen(prendaId, i.id).observe(this, this::trasOperacionFoto))
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void trasOperacionFoto(RecursoUi<Boolean> recurso) {
        if (recurso == null || recurso.estaCargando()) return;
        enlace.indicadorCarga.setVisibility(View.GONE);
        if (recurso.esExito()) {
            cargarFotos();
        } else if (recurso.esError()) {
            Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
        }
    }

    // ── Utilidades ──────────────────────────────────────────────────────────────

    private int indiceDe(String[] arr, String valor) {
        if (valor == null) return -1;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i].equals(valor)) return i;
        }
        return -1;
    }

    private String texto(com.google.android.material.textfield.TextInputEditText campo) {
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    private String obtener(com.google.android.material.textfield.TextInputEditText campo) {
        return campo.getText() != null ? campo.getText().toString().trim() : "";
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        ejecutorIo.shutdown();
        enlace = null;
    }
}
