// Barrel: re-exporta todos los modelos Mongoose (y sus tipos de documento asociados)
// para que el resto del backend pueda importarlos desde un único punto
// (`from '../mongo'`) sin conocer la ruta concreta de cada archivo de esquema.
export { ActividadLog } from './esquemas/actividadLog';
export { Recomendacion } from './esquemas/recomendacion';
export { MediaResena } from './esquemas/mediaResena';
export { CarritoAnonimo } from './esquemas/carritoAnonimo';
export { NotificacionLog, TIPOS_NOTIFICACION } from './esquemas/notificacionLog';
export { DeviceToken } from './esquemas/deviceToken';
export type { IActividadLog } from './esquemas/actividadLog';
export type { IRecomendacion } from './esquemas/recomendacion';
export type { IMediaResena } from './esquemas/mediaResena';
export type { ICarritoAnonimo } from './esquemas/carritoAnonimo';
export type { INotificacionLog, TipoNotificacion } from './esquemas/notificacionLog';
export type { IDeviceToken } from './esquemas/deviceToken';
