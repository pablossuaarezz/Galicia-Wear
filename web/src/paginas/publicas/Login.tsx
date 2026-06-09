// Inicio de sesión. Tras autenticar, redirige al parámetro ?destino o al inicio. Valida en
// cliente (reflejo de las reglas del backend) y muestra el error del servidor si lo hay.
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Boton, Campo, Tarjeta } from '@/componentes/ui';
import { Marca } from '@/componentes/disposicion/Marca';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarTitulo } from '@/hooks/usarTitulo';
import { mensajeDeError, validarCorreo } from '@/util/validacion';

export default function Login() {
  usarTitulo('Entrar');
  const { iniciarSesion, estaAutenticado } = usarSesion();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const destino = parametros.get('destino') ?? '/';

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; general?: string }>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estaAutenticado) navegar(destino, { replace: true });
  }, [estaAutenticado, destino, navegar]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) {
      setErrores({ correo: errorCorreo });
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      await iniciarSesion({ correo: correo.trim(), contrasena });
      navegar(destino, { replace: true });
    } catch (error) {
      setErrores({ general: mensajeDeError(error, 'No se pudo iniciar sesión') });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <Marca variante="icono" alto={68} className="mb-4" />
        <h1 className="font-editorial text-3xl font-semibold text-tinta-900">Bienvenido de vuelta</h1>
        <p className="mt-2 text-sm text-tinta-500">
          Entra para seguir descubriendo moda gallega sostenible.
        </p>
      </div>

      <Tarjeta className="p-6 sm:p-8">
        <form onSubmit={enviar} className="space-y-5" noValidate>
          {errores.general && (
            <p
              role="alert"
              className="rounded-xl border border-peligro/30 bg-peligro-suave px-3.5 py-2.5 text-sm font-medium text-peligro-fuerte"
            >
              {errores.general}
            </p>
          )}

          <Campo
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={correo}
            error={errores.correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu@correo.gal"
          />

          <Campo
            etiqueta="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="••••••••"
          />

          <Boton
            type="submit"
            ancho
            cargando={enviando}
            iconoIzquierda={<LogIn className="h-4 w-4" />}
          >
            Entrar
          </Boton>
        </form>
      </Tarjeta>

      <p className="mt-6 text-center text-sm text-tinta-500">
        ¿Aún no tienes cuenta?{' '}
        <Link
          to={`/registro${destino !== '/' ? `?destino=${encodeURIComponent(destino)}` : ''}`}
          className="font-semibold text-atlantic-700 hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
