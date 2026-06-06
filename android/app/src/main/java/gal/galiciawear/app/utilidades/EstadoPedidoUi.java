package gal.galiciawear.app.utilidades;

import androidx.annotation.ColorRes;
import androidx.annotation.StringRes;

import gal.galiciawear.app.R;

/**
 * Traduce el estado de un pedido (enum del backend) a una etiqueta legible y
 * un color semántico, para mostrarlo de forma coherente en toda la app
 * (listado de pedidos y detalle).
 *
 * Estados del backend: PENDIENTE_PAGO, PAGADO, ACEPTADO, ENVIADO,
 * ENTREGADO, CANCELADO, DEVUELTO.
 */
public final class EstadoPedidoUi {

    private EstadoPedidoUi() { /* No instanciable */ }

    @StringRes
    public static int etiqueta(String estado) {
        if (estado == null) return R.string.estado_desconocido;
        switch (estado) {
            case "PENDIENTE_PAGO": return R.string.estado_pendiente_pago;
            case "PAGADO":         return R.string.estado_pagado;
            case "ACEPTADO":       return R.string.estado_aceptado;
            case "ENVIADO":        return R.string.estado_enviado;
            case "ENTREGADO":      return R.string.estado_entregado;
            case "CANCELADO":      return R.string.estado_cancelado;
            case "DEVUELTO":       return R.string.estado_devuelto;
            default:               return R.string.estado_desconocido;
        }
    }

    /** Color fuerte del estado (texto del badge / acentos). */
    @ColorRes
    public static int color(String estado) {
        if (estado == null) return R.color.texto_secundario;
        switch (estado) {
            case "PENDIENTE_PAGO": return R.color.aviso;
            case "PAGADO":         return R.color.primario;
            case "ACEPTADO":       return R.color.verde_sostenible;
            case "ENVIADO":        return R.color.celeste;
            case "ENTREGADO":      return R.color.exito;
            case "CANCELADO":      return R.color.error;
            case "DEVUELTO":       return R.color.texto_secundario;
            default:               return R.color.texto_secundario;
        }
    }
}
