// Formatos de presentación (precio, fechas, slug). Aislados para reutilizar y testear.
// Los precios del backend llegan como Decimal serializado en string ("49.90"); se normalizan
// a número antes de formatear, tal y como hacen el resto de clientes (Android, panel JavaFX).

const formateadorPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

const formateadorFecha = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const formateadorFechaHora = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formateadorHora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

const formateadorRelativo = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });

/** Convierte un Decimal (string/number) a número seguro. */
export function aNumero(valor: number | string | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

/** "49,90 €" a partir de un Decimal (string) o número. */
export function formatoPrecio(valor: number | string | null | undefined): string {
  return formateadorPrecio.format(aNumero(valor));
}

/** "8 de junio de 2026". Acepta Date o ISO string. */
export function formatoFecha(valor: Date | string | null | undefined): string {
  if (!valor) return '—';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return formateadorFecha.format(fecha);
}

/** "8 jun 2026, 14:30". */
export function formatoFechaHora(valor: Date | string | null | undefined): string {
  if (!valor) return '—';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return formateadorFechaHora.format(fecha);
}

/** "14:30" — hora corta para las burbujas del chat. */
export function formatoHora(valor: Date | string | null | undefined): string {
  if (!valor) return '';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return formateadorHora.format(fecha);
}

/** "hace 3 horas" — para la bandeja de notificaciones. */
export function formatoTiempoRelativo(valor: Date | string | null | undefined): string {
  if (!valor) return '';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  const segundos = Math.round((fecha.getTime() - Date.now()) / 1000);
  const tramos: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  for (const [unidad, segundosUnidad] of tramos) {
    if (Math.abs(segundos) >= segundosUnidad) {
      return formateadorRelativo.format(Math.round(segundos / segundosUnidad), unidad);
    }
  }
  return formateadorRelativo.format(segundos, 'second');
}

/** Convierte un texto en slug ASCII (sin tildes ni ñ). Réplica de generarSlug del backend. */
export function eslugar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
