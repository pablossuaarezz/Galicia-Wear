// Registro de cuenta (CLIENTE o DISEÑADOR). Para cliente exige nombre y apellidos (regla del
// backend); el diseñador completa su perfil de marca después en el panel.
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Sparkles, UserPlus } from 'lucide-react';
import { Boton, Campo, Tarjeta } from '@/componentes/ui';
import { Marca } from '@/componentes/disposicion/Marca';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarTitulo } from '@/hooks/usarTitulo';
import { cx } from '@/util/cx';
import {
  mensajeDeError,
  validarContrasena,
  validarCorreo,
  validarObligatorio,
} from '@/util/validacion';
import type { Rol } from '@/api/tipos';

type RolRegistro = Extract<Rol, 'CLIENTE' | 'DISENADOR'>;

const OPCIONES_ROL: Array<{ rol: RolRegistro; titulo: string; texto: string; Icono: typeof ShoppingBag }> = [
  { rol: 'CLIENTE', titulo: 'Comprar', texto: 'Descubre y compra moda sostenible gallega.', Icono: ShoppingBag },
  { rol: 'DISENADOR', titulo: 'Vender', texto: 'Publica tu marca y vende tus prendas.', Icono: Sparkles },
];

export default function Registro() {
  usarTitulo('Crear cuenta');
  const { registrarse, estaAutenticado } = usarSesion();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const destino = parametros.get('destino') ?? '/';

  const [rol, setRol] = useState<RolRegistro>('CLIENTE');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estaAutenticado) navegar(destino, { replace: true });
  }, [estaAutenticado, destino, navegar]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: Record<string, string> = {};
    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) nuevos.correo = errorCorreo;
    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) nuevos.contrasena = errorContrasena;
    if (rol === 'CLIENTE') {
      const errorNombre = validarObligatorio(nombre, 'El nombre');
      if (errorNombre) nuevos.nombre = errorNombre;
      const errorApellidos = validarObligatorio(apellidos, 'Los apellidos');
      if (errorApellidos) nuevos.apellidos = errorApellidos;
    }
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      await registrarse({
        correo: correo.trim(),
        contrasena,
        rol,
        nombre: rol === 'CLIENTE' ? nombre.trim() : undefined,
        apellidos: rol === 'CLIENTE' ? apellidos.trim() : undefined,
      });
      // El diseñador va a su panel para completar el perfil de marca; el cliente, al destino.
      navegar(rol === 'DISENADOR' ? '/panel' : destino, { replace: true });
    } catch (error) {
      setErrores({ general: mensajeDeError(error, 'No se pudo crear la cuenta') });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-7 flex flex-col items-center text-center">
        <Marca soloIcono className="mb-4" />
        <h1 className="font-editorial text-3xl font-semibold text-tinta-900">Únete a GaliciaWear</h1>
        <p className="mt-2 text-sm text-tinta-500">Crea tu cuenta en menos de un minuto.</p>
      </div>

      <Tarjeta className="p-6 sm:p-8">
        <form onSubmit={enviar} className="space-y-5" noValidate>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tinta-700">Quiero…</legend>
            <div className="grid grid-cols-2 gap-3">
              {OPCIONES_ROL.map(({ rol: valor, titulo, texto, Icono }) => (
                <button
                  type="button"
                  key={valor}
                  onClick={() => setRol(valor)}
                  aria-pressed={rol === valor}
                  className={cx(
                    'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                    rol === valor
                      ? 'border-atlantic-500 bg-atlantic-50 ring-2 ring-atlantic-500/30'
                      : 'border-piedra-200 bg-white hover:border-atlantic-300',
                  )}
                >
                  <Icono className={cx('h-5 w-5', rol === valor ? 'text-atlantic-600' : 'text-tinta-400')} aria-hidden />
                  <span className="font-display text-sm font-semibold text-tinta-800">{titulo}</span>
                  <span className="text-xs text-tinta-500">{texto}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {errores.general && (
            <p
              role="alert"
              className="rounded-xl border border-peligro/30 bg-peligro-suave px-3.5 py-2.5 text-sm font-medium text-peligro-fuerte"
            >
              {errores.general}
            </p>
          )}

          {rol === 'CLIENTE' && (
            <div className="grid grid-cols-2 gap-3">
              <Campo
                etiqueta="Nombre"
                required
                value={nombre}
                error={errores.nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="given-name"
              />
              <Campo
                etiqueta="Apellidos"
                required
                value={apellidos}
                error={errores.apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          )}

          <Campo
            etiqueta="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={correo}
            error={errores.correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu@correo.gal"
          />

          <Campo
            etiqueta="Contraseña"
            type="password"
            required
            autoComplete="new-password"
            value={contrasena}
            error={errores.contrasena}
            ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número."
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="••••••••"
          />

          <Boton type="submit" ancho cargando={enviando} iconoIzquierda={<UserPlus className="h-4 w-4" />}>
            Crear cuenta
          </Boton>
        </form>
      </Tarjeta>

      <p className="mt-6 text-center text-sm text-tinta-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          to={`/login${destino !== '/' ? `?destino=${encodeURIComponent(destino)}` : ''}`}
          className="font-semibold text-atlantic-700 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
