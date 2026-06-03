package gal.galiciawear.paneladmin;

/**
 * Punto de entrada del fat-JAR.
 *
 * <p>JUSTIFICACIÓN: una clase {@code main} que NO extiende {@link javafx.application.Application}
 * es la forma recomendada de arrancar una app JavaFX empaquetada en un JAR "shade". Si la clase
 * principal extendiera Application, la JVM exigiría los módulos JavaFX en el module-path y fallaría
 * con "JavaFX runtime components are missing". Delegando en {@code Application.launch} desde una
 * clase neutra evitamos ese problema.
 */
public final class Lanzador {
    private Lanzador() {
    }

    public static void main(String[] args) {
        AplicacionPanel.main(args);
    }
}
