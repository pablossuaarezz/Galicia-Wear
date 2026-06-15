// Punto de entrada: fuentes self-hosted (funcionan offline, sin FOUT), cliente de React Query,
// proveedores transversales (brindis, sesión, carrito) y el enrutador de la SPA.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Fuente variable self-hosted: Syne (la misma que usa la app Android en toda la interfaz).
// Inter queda como reserva de cuerpo para máxima legibilidad si Syne no carga.
import '@fontsource-variable/syne';
import '@fontsource-variable/inter';
import './styles/index.css';

import { clienteConsultas } from '@/api/clienteConsultas';
import { ProveedorBrindis } from '@/componentes/ui/Brindis';
import { ProveedorSesion } from '@/contexto/ContextoSesion';
import { ProveedorCarrito } from '@/contexto/ContextoCarrito';
import { enrutador } from '@/rutas';

// Monta la aplicación en el nodo raíz del HTML. El árbol de proveedores se anida de fuera hacia
// dentro siguiendo sus dependencias: React Query (caché de datos) en el exterior; después los
// brindis (avisos), la sesión y el carrito; y, en el interior, el enrutador que renderiza las
// páginas. `React.StrictMode` activa comprobaciones adicionales de React en desarrollo.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Proveedor de React Query: expone el cliente de consultas/mutaciones a toda la app. */}
    <QueryClientProvider client={clienteConsultas}>
      {/* Sistema de avisos (toasts); la sesión lo usa para notificar errores de autenticación. */}
      <ProveedorBrindis>
        {/* Estado global de sesión (usuario, token, rol) que se rehidrata al arrancar. */}
        <ProveedorSesion>
          {/* Estado global del carrito de compra. */}
          <ProveedorCarrito>
            {/* Enrutador de la SPA: resuelve la URL actual y renderiza la página correspondiente. */}
            <RouterProvider router={enrutador} />
          </ProveedorCarrito>
        </ProveedorSesion>
      </ProveedorBrindis>
    </QueryClientProvider>
  </React.StrictMode>,
);
