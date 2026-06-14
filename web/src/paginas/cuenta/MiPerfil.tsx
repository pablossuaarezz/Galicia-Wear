// Mi perfil (cliente): datos personales con foto, cambio de contraseña y preferencias de
// sostenibilidad. Cada bloque es un formulario independiente con su propia mutación.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, KeyRound, Leaf, MessagesSquare, Save } from 'lucide-react';
import { Avatar, Boton, Campo, Chip, Esqueleto, Selector, Tarjeta } from '@/componentes/ui';
import { ListaConversaciones } from '@/componentes/chat/ListaConversaciones';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { usarPerfil } from '@/hooks/usarCuenta';
import { usarSesion } from '@/contexto/ContextoSesion';
import { apiUsuarios } from '@/api/endpoints/usuarios';
import { usarTitulo } from '@/hooks/usarTitulo';
import { archivoADataUri } from '@/util/imagenes';
import { mensajeDeError, validarContrasena } from '@/util/validacion';
import { CIUDADES, CODIGOS_CIUDAD, CODIGOS_CERTIFICADO, CERTIFICADOS } from '@/util/constantes';
import type {
  CodigoCertificado,
  EntradaPerfilCliente,
  PreferenciasSostenibilidad,
} from '@/api/tipos';

function DatosPersonales() {
  const { data: usuario } = usarPerfil();
  const { refrescarPerfil } = usarSesion();
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const entradaArchivo = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (usuario?.cliente) {
      setNombre(usuario.cliente.nombre ?? '');
      setApellidos(usuario.cliente.apellidos ?? '');
      setTelefono(usuario.cliente.telefono ?? '');
      setAvatar(usuario.cliente.avatarUrl ?? null);
    }
  }, [usuario]);

  const mutacion = useMutation({
    mutationFn: (datos: EntradaPerfilCliente) => apiUsuarios.actualizarCliente(datos),
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: ['perfilUsuario'] });
      await refrescarPerfil();
      brindis.exito('Perfil actualizado');
    },
    onError: (error) => brindis.error(mensajeDeError(error)),
  });

  async function elegirAvatar(archivo: File | undefined) {
    if (!archivo) return;
    try {
      const dataUri = await archivoADataUri(archivo, 512, 0.8);
      setAvatar(dataUri);
    } catch (error) {
      brindis.error(mensajeDeError(error, 'No se pudo procesar la imagen'));
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    mutacion.mutate({
      nombre: nombre.trim() || undefined,
      apellidos: apellidos.trim() || undefined,
      telefono: telefono.trim() || null,
      avatarUrl: avatar,
    });
  }

  return (
    <Tarjeta className="p-6">
      <h2 className="font-display text-lg font-semibold text-tinta-900">Datos personales</h2>
      <form onSubmit={enviar} className="mt-5 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar nombre={nombre || usuario?.correo} url={avatar} tamano={72} />
          <div>
            <input
              ref={entradaArchivo}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => elegirAvatar(e.target.files?.[0])}
            />
            <Boton
              type="button"
              variante="secundario"
              tamano="sm"
              iconoIzquierda={<Camera className="h-4 w-4" />}
              onClick={() => entradaArchivo.current?.click()}
            >
              Cambiar foto
            </Boton>
            <p className="mt-1.5 text-xs text-tinta-400">JPG o PNG. Se reduce automáticamente.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Campo etiqueta="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        </div>
        <Campo
          etiqueta="Teléfono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="+34 600 000 000"
        />

        <div className="flex justify-end">
          <Boton type="submit" cargando={mutacion.isPending} iconoIzquierda={<Save className="h-4 w-4" />}>
            Guardar cambios
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}

function CambioContrasena() {
  const brindis = usarBrindis();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState<string>();

  const mutacion = useMutation({
    mutationFn: () => apiUsuarios.cambiarContrasena({ contrasenaActual: actual, contrasenaNueva: nueva }),
    onSuccess: () => {
      brindis.exito('Contraseña actualizada');
      setActual('');
      setNueva('');
    },
    onError: (e) => brindis.error(mensajeDeError(e, 'No se pudo cambiar la contraseña')),
  });

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const errorNueva = validarContrasena(nueva);
    if (errorNueva) {
      setError(errorNueva);
      return;
    }
    setError(undefined);
    mutacion.mutate();
  }

  return (
    <Tarjeta className="p-6">
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-tinta-900">
        <KeyRound className="h-5 w-5 text-atlantic-500" aria-hidden />
        Contraseña
      </h2>
      <form onSubmit={enviar} className="mt-5 space-y-4">
        <Campo
          etiqueta="Contraseña actual"
          type="password"
          autoComplete="current-password"
          required
          value={actual}
          onChange={(e) => setActual(e.target.value)}
        />
        <Campo
          etiqueta="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={nueva}
          error={error}
          ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número."
          onChange={(e) => setNueva(e.target.value)}
        />
        <div className="flex justify-end">
          <Boton type="submit" variante="secundario" cargando={mutacion.isPending}>
            Cambiar contraseña
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}

function PreferenciasEco() {
  const { data: usuario } = usarPerfil();
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();

  const [certificados, setCertificados] = useState<CodigoCertificado[]>([]);
  const [maxKm, setMaxKm] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');

  useEffect(() => {
    const prefs = usuario?.cliente?.preferenciasSostenibilidad;
    if (prefs) {
      setCertificados(prefs.certificados ?? []);
      setMaxKm(prefs.maxKm !== undefined ? String(prefs.maxKm) : '');
      setCiudad(prefs.ciudad ?? '');
    }
  }, [usuario]);

  const mutacion = useMutation({
    mutationFn: (datos: PreferenciasSostenibilidad) => apiUsuarios.actualizarPreferencias(datos),
    onSuccess: () => {
      clienteConsultas.invalidateQueries({ queryKey: ['perfilUsuario'] });
      brindis.exito('Preferencias guardadas');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  function alternarCertificado(codigo: CodigoCertificado) {
    setCertificados((actual) =>
      actual.includes(codigo) ? actual.filter((c) => c !== codigo) : [...actual, codigo],
    );
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    mutacion.mutate({
      certificados,
      maxKm: maxKm ? Number(maxKm) : undefined,
      ciudad: (ciudad || undefined) as PreferenciasSostenibilidad['ciudad'],
    });
  }

  return (
    <Tarjeta className="p-6">
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-tinta-900">
        <Leaf className="h-5 w-5 text-galego-600" aria-hidden />
        Preferencias de sostenibilidad
      </h2>
      <p className="mt-1 text-sm text-tinta-500">Personalizamos tu experiencia con lo que más te importa.</p>
      <form onSubmit={enviar} className="mt-5 space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-tinta-700">Certificados favoritos</p>
          <div className="flex flex-wrap gap-2">
            {CODIGOS_CERTIFICADO.map((codigo) => (
              <Chip
                key={codigo}
                activo={certificados.includes(codigo)}
                onClick={() => alternarCertificado(codigo)}
              >
                {CERTIFICADOS[codigo]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Distancia máxima (km)"
            type="number"
            min={0}
            max={2000}
            value={maxKm}
            onChange={(e) => setMaxKm(e.target.value)}
            placeholder="Sin límite"
          />
          <Selector etiqueta="Ciudad preferida" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            <option value="">Sin preferencia</option>
            {CODIGOS_CIUDAD.map((codigo) => (
              <option key={codigo} value={codigo}>
                {CIUDADES[codigo]}
              </option>
            ))}
          </Selector>
        </div>
        <div className="flex justify-end">
          <Boton type="submit" variante="galego" cargando={mutacion.isPending}>
            Guardar preferencias
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}

function MisChats() {
  return (
    <Tarjeta className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 px-6 pt-6">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-tinta-900">
          <MessagesSquare className="h-5 w-5 text-atlantic-500" aria-hidden />
          Mis chats
        </h2>
        <Link to="/mensajes" className="text-sm font-medium text-atlantic-600 hover:text-atlantic-800">
          Ver todo
        </Link>
      </div>
      <div className="mt-4 max-h-80 overflow-y-auto border-t border-piedra-100">
        <ListaConversaciones />
      </div>
    </Tarjeta>
  );
}

export default function MiPerfil() {
  usarTitulo('Mi perfil');
  const { data: usuario, isLoading } = usarPerfil();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Esqueleto className="h-64 rounded-xl2" />
        <Esqueleto className="h-48 rounded-xl2" />
      </div>
    );
  }

  if (usuario && !usuario.cliente) {
    return (
      <Tarjeta className="p-8 text-center">
        <p className="text-tinta-600">
          Esta sección es para clientes. Gestiona tu marca desde el panel de diseñador.
        </p>
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-6">
      <DatosPersonales />
      <MisChats />
      <CambioContrasena />
      <PreferenciasEco />
    </div>
  );
}
