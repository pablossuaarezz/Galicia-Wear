package gal.galiciawear.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Activity de plantilla generada por Android Studio.
 *
 * No forma parte del flujo real de navegación de GaliciaWear (la pantalla
 * principal de la app es {@code ActividadPrincipal}); se mantiene como
 * punto de entrada técnico mínimo y para probar el layout edge-to-edge.
 */
public class MainActivity extends AppCompatActivity {

    /**
     * Inicializa la Activity: habilita el modo edge-to-edge (el contenido
     * ocupa toda la pantalla, incluso detrás de las barras de sistema) y
     * ajusta el padding de la vista raíz para que su contenido no quede
     * oculto bajo la barra de estado/navegación.
     *
     * @param savedInstanceState estado previo guardado por el sistema, o null
     *                            si la Activity se crea por primera vez.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Permite que el contenido se dibuje detrás de las barras de sistema
        // (status bar / navigation bar) para un aspecto más moderno.
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        // Aplica los insets de las barras de sistema como padding de la vista
        // raíz, evitando que elementos de la UI queden tapados por ellas.
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }
}