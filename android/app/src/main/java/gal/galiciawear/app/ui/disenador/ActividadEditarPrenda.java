package gal.galiciawear.app.ui.disenador;

import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.snackbar.Snackbar;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadEditarPrendaBinding;
import gal.galiciawear.app.databinding.DialogoFotoBinding;
import gal.galiciawear.app.databinding.DialogoVarianteBinding;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionVariante;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.modelovista.ModeloVistaPrendas;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Alta y edición de una prenda del diseñador. Primero se guardan los datos básicos
 * (POST/PATCH /productos); una vez la prenda existe, se habilitan las secciones de
 * variantes (talla/color/stock) y de fotos. Las fotos se guardan en SQL como URL
 * mediante POST /productos/{id}/imagenes.
 */
@AndroidEntryPoint
public class ActividadEditarPrenda extends AppCompatActivity {

    private ActividadEditarPrendaBinding enlace;
    private ModeloVistaPrendas modeloVista;

    private AdaptadorVariante adaptadorVariantes;
    private AdaptadorFotoPrenda adaptadorFotos;

    private String[] materialValores;
    private String[] tallaValores;

    // null mientras la prenda no se ha creado todavía.
    private String prendaId;

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
            @Override public void alEliminar(gal.galiciawear.app.datos.remoto.dto.DtoImagen i) { eliminarFoto(i); }
            @Override public void alMarcarPrincipal(gal.galiciawear.app.datos.remoto.dto.DtoImagen i) { marcarPrincipal(i); }
        });
        enlace.listaFotos.setLayoutManager(new LinearLayoutManager(this));
        enlace.listaFotos.setAdapter(adaptadorFotos);

        enlace.botonGuardarPrenda.setOnClickListener(v -> guardarPrenda());
        enlace.botonAnadirVariante.setOnClickListener(v -> dialogoVariante());
        enlace.botonAnadirFoto.setOnClickListener(v -> dialogoFoto());

        if (prendaId != null) {
            cargarPrenda();
        } else {
            mostrarSeccionesDependientes(false);
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
                mostrarSeccionesDependientes(true);
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
    }

    // ── Guardar datos básicos ───────────────────────────────────────────────────

    private void guardarPrenda() {
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
        double precio = 0;
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

        DtoPeticionProducto cuerpo = new DtoPeticionProducto(
            nombre, descripcion, precio, km, material);

        enlace.botonGuardarPrenda.setEnabled(false);
        modeloVista.guardarPrenda(prendaId, cuerpo).observe(this, recurso -> {
            if (recurso == null) return;
            if (recurso.estaCargando()) {
                enlace.indicadorCarga.setVisibility(View.VISIBLE);
            } else if (recurso.esExito() && recurso.datos != null) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonGuardarPrenda.setEnabled(true);
                boolean eraNueva = prendaId == null;
                prendaId = recurso.datos.id;
                enlace.barraHerramientas.setTitle(R.string.editar_prenda);
                mostrarSeccionesDependientes(true);
                Snackbar.make(enlace.getRoot(), "Prenda guardada", Snackbar.LENGTH_SHORT).show();
                if (eraNueva) {
                    // Recién creada: sin variantes ni fotos aún; refrescamos los avisos.
                    cargarVariantes();
                    cargarFotos();
                }
            } else if (recurso.esError()) {
                enlace.indicadorCarga.setVisibility(View.GONE);
                enlace.botonGuardarPrenda.setEnabled(true);
                Snackbar.make(enlace.getRoot(), recurso.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void mostrarSeccionesDependientes(boolean visible) {
        int vis = visible ? View.VISIBLE : View.GONE;
        enlace.avisoGuardarPrimero.setVisibility(visible ? View.GONE : View.VISIBLE);
        enlace.listaVariantes.setVisibility(vis);
        enlace.botonAnadirVariante.setVisibility(vis);
        enlace.listaFotos.setVisibility(vis);
        enlace.botonAnadirFoto.setVisibility(vis);
    }

    // ── Variantes ───────────────────────────────────────────────────────────────

    private void cargarVariantes() {
        if (prendaId == null) return;
        modeloVista.listarVariantes(prendaId).observe(this, recurso -> {
            if (recurso == null || !recurso.esExito()) return;
            boolean vacio = recurso.datos == null || recurso.datos.isEmpty();
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

    private void eliminarVariante(gal.galiciawear.app.datos.remoto.dto.DtoVariante v) {
        new AlertDialog.Builder(this)
            .setMessage("¿Eliminar la variante " + v.talla + " · " + v.color + "?")
            .setPositiveButton(R.string.eliminar, (d, w) ->
                modeloVista.eliminarVariante(prendaId, v.id).observe(this, this::trasOperacionVariante))
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void trasOperacionVariante(gal.galiciawear.app.utilidades.RecursoUi<Boolean> recurso) {
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
            enlace.textoSinFotos.setVisibility(vacio ? View.VISIBLE : View.GONE);
            adaptadorFotos.establecer(recurso.datos);
        });
    }

    private void dialogoFoto() {
        DialogoFotoBinding d = DialogoFotoBinding.inflate(getLayoutInflater());
        new AlertDialog.Builder(this)
            .setTitle(R.string.anadir_foto)
            .setView(d.getRoot())
            .setPositiveButton(R.string.guardar, (dlg, w) -> {
                String url = obtener(d.entradaUrl);
                String alt = obtener(d.entradaAlt);
                boolean principal = d.checkPrincipal.isChecked();
                if (url.isEmpty() || !android.util.Patterns.WEB_URL.matcher(url).matches()) {
                    Snackbar.make(enlace.getRoot(),
                        "Introduce una URL de imagen válida", Snackbar.LENGTH_LONG).show();
                    return;
                }
                modeloVista.crearImagen(prendaId, new DtoPeticionImagen(url, alt, principal))
                    .observe(this, this::trasOperacionFoto);
            })
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void marcarPrincipal(gal.galiciawear.app.datos.remoto.dto.DtoImagen i) {
        modeloVista.marcarImagenPrincipal(prendaId, i.id).observe(this, this::trasOperacionFoto);
    }

    private void eliminarFoto(gal.galiciawear.app.datos.remoto.dto.DtoImagen i) {
        new AlertDialog.Builder(this)
            .setMessage("¿Eliminar esta foto?")
            .setPositiveButton(R.string.eliminar, (d, w) ->
                modeloVista.eliminarImagen(prendaId, i.id).observe(this, this::trasOperacionFoto))
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void trasOperacionFoto(gal.galiciawear.app.utilidades.RecursoUi<Boolean> recurso) {
        if (recurso == null) return;
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
        enlace = null;
    }
}
