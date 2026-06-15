// Perfil de marca del diseñador: si aún no existe, lo solicita (POST /disenadores/solicitar);
// si existe, lo edita (PATCH /disenadores/yo). El IBAN se cifra en el backend y nunca se devuelve.
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Clock, MessagesSquare, Store } from 'lucide-react';
import { Boton, Campo, CampoArea, Esqueleto, Insignia, Selector, Tarjeta } from '@/componentes/ui';
import { ListaConversaciones } from '@/componentes/chat/ListaConversaciones';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { usarPerfilMarca } from '@/hooks/usarPanelDisenador';
import { apiDisenadores } from '@/api/endpoints/disenadores';
import { usarTitulo } from '@/hooks/usarTitulo';
import { CIUDADES, CODIGOS_CIUDAD } from '@/util/constantes';
import { mensajeDeError, validarIban } from '@/util/validacion';
import type {
  CiudadGallega,
  DisenadorPublico,
  EntradaActualizarDisenador,
  EntradaSolicitarDisenador,
} from '@/api/tipos';

/**
 * Página del perfil de marca: si el diseñador aún no tiene marca, la solicita (alta); si ya existe,
 * permite editarla. Incluye además un resumen de los chats. El IBAN se cifra en el backend.
 */
export default function PerfilMarca() {
  usarTitulo('Perfil de marca');
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const consulta = usarPerfilMarca();
  // Si la consulta da error (404) el diseñador aún no tiene marca: estamos en modo alta.
  const marca: DisenadorPublico | undefined = consulta.isError ? undefined : consulta.data;
  const esEdicion = Boolean(marca);

  const [nombreMarca, setNombreMarca] = useState('');
  const [biografia, setBiografia] = useState('');
  const [ciudad, setCiudad] = useState<CiudadGallega>('CORUNA');
  const [iban, setIban] = useState('');
  const [urlLogo, setUrlLogo] = useState('');
  const [urlWeb, setUrlWeb] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (marca) {
      setNombreMarca(marca.nombreMarca);
      setBiografia(marca.biografia);
      setCiudad(marca.ciudad);
      setUrlLogo(marca.urlLogo ?? '');
      setUrlWeb(marca.urlWeb ?? '');
    }
  }, [marca]);

  // Mutación que decide entre alta (solicitar) y edición (actualizar) según `esEdicion`.
  const guardar = useMutation({
    mutationFn: () => {
      const comun = {
        nombreMarca: nombreMarca.trim(),
        biografia: biografia.trim(),
        ciudad,
        urlLogo: urlLogo.trim() || undefined,
        urlWeb: urlWeb.trim() || undefined,
      };
      if (esEdicion) {
        const datos: EntradaActualizarDisenador = { ...comun };
        if (iban.trim()) datos.iban = iban.trim();
        return apiDisenadores.actualizar(datos);
      }
      const datos: EntradaSolicitarDisenador = { ...comun, iban: iban.trim() };
      return apiDisenadores.solicitar(datos);
    },
    onSuccess: () => {
      clienteConsultas.invalidateQueries({ queryKey: ['perfilMarca'] });
      brindis.exito(esEdicion ? 'Perfil de marca actualizado' : 'Marca registrada. Pendiente de validación.');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: Record<string, string> = {};
    if (nombreMarca.trim().length < 2) nuevos.nombreMarca = 'Nombre de marca demasiado corto';
    if (biografia.trim().length < 10) nuevos.biografia = 'Cuéntanos algo más sobre tu marca';
    // El IBAN es obligatorio al crear; en edición solo se valida si se reescribe.
    if (!esEdicion || iban.trim()) {
      const errorIban = validarIban(iban);
      if (errorIban) nuevos.iban = errorIban;
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    guardar.mutate();
  }

  if (consulta.isLoading) {
    return <Esqueleto className="h-96 rounded-xl2" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-tinta-900">
          <Store className="h-5 w-5 text-atlantic-500" aria-hidden />
          {esEdicion ? 'Perfil de marca' : 'Registra tu marca'}
        </h2>
        {marca &&
          (marca.validado ? (
            <Insignia tono="exito" className="gap-1">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              Marca validada
            </Insignia>
          ) : (
            <Insignia tono="aviso" className="gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Pendiente de validación
            </Insignia>
          ))}
      </div>

      {!esEdicion && (
        <p className="rounded-xl bg-atlantic-50 px-4 py-3 text-sm text-atlantic-700">
          Registra los datos de tu marca para empezar a publicar prendas. Un administrador validará
          tu perfil antes de que tus prendas sean visibles en el catálogo público.
        </p>
      )}

      <Tarjeta className="p-6">
        <form onSubmit={enviar} className="space-y-5">
          <Campo
            etiqueta="Nombre de la marca"
            required
            value={nombreMarca}
            error={errores.nombreMarca}
            onChange={(e) => setNombreMarca(e.target.value)}
            placeholder="Liñares Moda"
          />
          <CampoArea
            etiqueta="Biografía"
            required
            rows={4}
            value={biografia}
            error={errores.biografia}
            onChange={(e) => setBiografia(e.target.value)}
            placeholder="La historia de tu marca, tus valores y tu forma de trabajar…"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector etiqueta="Ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value as CiudadGallega)}>
              {CODIGOS_CIUDAD.map((codigo) => (
                <option key={codigo} value={codigo}>
                  {CIUDADES[codigo]}
                </option>
              ))}
            </Selector>
            <Campo
              etiqueta="IBAN"
              required={!esEdicion}
              value={iban}
              error={errores.iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              ayuda={esEdicion ? 'Déjalo vacío para no cambiarlo.' : 'Para liquidar tus ventas. Se almacena cifrado.'}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="URL del logo (opcional)"
              type="url"
              value={urlLogo}
              onChange={(e) => setUrlLogo(e.target.value)}
              placeholder="https://…"
            />
            <Campo
              etiqueta="Web de la marca (opcional)"
              type="url"
              value={urlWeb}
              onChange={(e) => setUrlWeb(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex justify-end">
            <Boton type="submit" cargando={guardar.isPending}>
              {esEdicion ? 'Guardar cambios' : 'Registrar marca'}
            </Boton>
          </div>
        </form>
      </Tarjeta>

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
    </div>
  );
}
