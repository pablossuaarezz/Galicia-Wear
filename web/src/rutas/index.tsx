/* eslint-disable react-refresh/only-export-components */
// Definición del enrutador de la SPA: disposición principal + páginas públicas, zona de cuenta
// (protegida) y dashboard del diseñador (protegido por rol). Las páginas se cargan de forma
// diferida (lazy) para dividir el bundle y acelerar la primera carga. (Este archivo define la
// configuración de rutas, no es un módulo de componentes; se exime de react-refresh.)
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { DisposicionPrincipal } from '@/componentes/disposicion/DisposicionPrincipal';
import { DisposicionCuenta } from '@/componentes/disposicion/DisposicionCuenta';
import { DisposicionPanel } from '@/componentes/disposicion/DisposicionPanel';
import { RutaProtegida } from './RutaProtegida';
import { RutaDisenador } from './RutaDisenador';
import { PantallaCargando } from './PantallaCargando';

// Páginas públicas
const Inicio = lazy(() => import('@/paginas/publicas/Inicio'));
const Catalogo = lazy(() => import('@/paginas/publicas/Catalogo'));
const DetalleProducto = lazy(() => import('@/paginas/publicas/DetalleProducto'));
const Disenadores = lazy(() => import('@/paginas/publicas/Disenadores'));
const DetalleDisenador = lazy(() => import('@/paginas/publicas/DetalleDisenador'));
const Carrito = lazy(() => import('@/paginas/publicas/Carrito'));
const Checkout = lazy(() => import('@/paginas/publicas/Checkout'));
const Login = lazy(() => import('@/paginas/publicas/Login'));
const Registro = lazy(() => import('@/paginas/publicas/Registro'));
const NoEncontrado = lazy(() => import('@/paginas/publicas/NoEncontrado'));

// Chat (protegido)
const Mensajes = lazy(() => import('@/paginas/mensajes/Mensajes'));

// Zona de cuenta (cliente)
const MiPerfil = lazy(() => import('@/paginas/cuenta/MiPerfil'));
const MisDirecciones = lazy(() => import('@/paginas/cuenta/MisDirecciones'));
const MisPedidos = lazy(() => import('@/paginas/cuenta/MisPedidos'));
const DetallePedido = lazy(() => import('@/paginas/cuenta/DetallePedido'));

// Dashboard del diseñador
const PanelDisenador = lazy(() => import('@/paginas/disenador/PanelDisenador'));
const MisPrendas = lazy(() => import('@/paginas/disenador/MisPrendas'));
const EditarPrenda = lazy(() => import('@/paginas/disenador/EditarPrenda'));
const PedidosRecibidos = lazy(() => import('@/paginas/disenador/PedidosRecibidos'));
const PerfilMarca = lazy(() => import('@/paginas/disenador/PerfilMarca'));

/** Envuelve cada elemento perezoso con un fallback de carga. */
function P(elemento: React.ReactNode) {
  return <Suspense fallback={<PantallaCargando />}>{elemento}</Suspense>;
}

const rutas: RouteObject[] = [
  {
    element: <DisposicionPrincipal />,
    children: [
      { index: true, element: P(<Inicio />) },
      { path: 'catalogo', element: P(<Catalogo />) },
      { path: 'producto/:slug', element: P(<DetalleProducto />) },
      { path: 'disenadores', element: P(<Disenadores />) },
      { path: 'disenador/:id', element: P(<DetalleDisenador />) },
      { path: 'carrito', element: P(<Carrito />) },
      { path: 'login', element: P(<Login />) },
      { path: 'registro', element: P(<Registro />) },
      {
        path: 'checkout',
        element: <RutaProtegida>{P(<Checkout />)}</RutaProtegida>,
      },
      {
        path: 'mensajes',
        element: <RutaProtegida>{P(<Mensajes />)}</RutaProtegida>,
      },
      {
        path: 'mensajes/:peerId',
        element: <RutaProtegida>{P(<Mensajes />)}</RutaProtegida>,
      },
      {
        path: 'cuenta',
        element: (
          <RutaProtegida>
            <DisposicionCuenta />
          </RutaProtegida>
        ),
        children: [
          { index: true, element: <Navigate to="/cuenta/perfil" replace /> },
          { path: 'perfil', element: P(<MiPerfil />) },
          { path: 'direcciones', element: P(<MisDirecciones />) },
          { path: 'pedidos', element: P(<MisPedidos />) },
          { path: 'pedidos/:id', element: P(<DetallePedido />) },
        ],
      },
      {
        path: 'panel',
        element: (
          <RutaDisenador>
            <DisposicionPanel />
          </RutaDisenador>
        ),
        children: [
          { index: true, element: P(<PanelDisenador />) },
          { path: 'prendas', element: P(<MisPrendas />) },
          { path: 'prendas/nueva', element: P(<EditarPrenda />) },
          { path: 'prendas/:id', element: P(<EditarPrenda />) },
          { path: 'pedidos', element: P(<PedidosRecibidos />) },
          { path: 'marca', element: P(<PerfilMarca />) },
        ],
      },
      { path: '*', element: P(<NoEncontrado />) },
    ],
  },
];

export const enrutador = createBrowserRouter(rutas);
