package gal.galiciawear.app.utilidades;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Historial de búsquedas recientes persistido en SharedPreferences.
 *
 * JUSTIFICACIÓN (criterios UI/UX DAM):
 * - Ley de Miller: se conservan como máximo {@link Constantes#MAX_BUSQUEDAS_RECIENTES}
 *   términos para no saturar la memoria de trabajo del usuario.
 * - Reconocer en lugar de recordar: ofrecer lo último buscado evita que el
 *   usuario tenga que volver a teclear consultas frecuentes.
 *
 * Las consultas se guardan como una única cadena separada por saltos de línea;
 * el campo de búsqueda es de una sola línea, así que el delimitador es seguro.
 */
public final class BusquedasRecientes {

    private static final String SEPARADOR = "\n";

    private final SharedPreferences prefs;

    public BusquedasRecientes(Context contexto) {
        // applicationContext: evita fugas de memoria al guardar la referencia.
        this.prefs = contexto.getApplicationContext()
            .getSharedPreferences(Constantes.PREFS_BUSQUEDAS, Context.MODE_PRIVATE);
    }

    /** Lista de búsquedas, de la más reciente a la más antigua. */
    public List<String> obtener() {
        String bruto = prefs.getString(Constantes.CLAVE_BUSQUEDAS_RECIENTES, "");
        List<String> lista = new ArrayList<>();
        if (!bruto.isEmpty()) {
            for (String termino : bruto.split(SEPARADOR)) {
                if (!termino.trim().isEmpty()) lista.add(termino);
            }
        }
        return lista;
    }

    /**
     * Inserta una consulta al principio del historial. Si ya existía
     * (ignorando mayúsculas), se mueve arriba en lugar de duplicarse.
     */
    public void anadir(String consulta) {
        if (consulta == null) return;
        String termino = consulta.trim();
        if (termino.isEmpty()) return;

        List<String> lista = obtener();
        // Eliminar duplicado previo (case-insensitive) para reordenarlo arriba.
        Iterator<String> it = lista.iterator();
        while (it.hasNext()) {
            if (it.next().equalsIgnoreCase(termino)) it.remove();
        }
        lista.add(0, termino);
        while (lista.size() > Constantes.MAX_BUSQUEDAS_RECIENTES) {
            lista.remove(lista.size() - 1);
        }
        guardar(lista);
    }

    /** Borra todo el historial. */
    public void limpiar() {
        prefs.edit().remove(Constantes.CLAVE_BUSQUEDAS_RECIENTES).apply();
    }

    private void guardar(List<String> lista) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lista.size(); i++) {
            if (i > 0) sb.append(SEPARADOR);
            sb.append(lista.get(i));
        }
        prefs.edit().putString(Constantes.CLAVE_BUSQUEDAS_RECIENTES, sb.toString()).apply();
    }
}
