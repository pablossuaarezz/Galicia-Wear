// Punto de entrada: fuentes self-hosted (funcionan offline, sin FOUT), cliente de React Query,
// proveedores transversales (brindis, sesión, carrito) y el enrutador de la SPA.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Fuentes variables self-hosted (Fraunces editorial, Manrope display, Inter cuerpo).
import '@fontsource-variable/fraunces';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter';
import './styles/index.css';

import { clienteConsultas } from '@/api/clienteConsultas';
import { ProveedorBrindis } from '@/componentes/ui/Brindis';
import { ProveedorSesion } from '@/contexto/ContextoSesion';
import { ProveedorCarrito } from '@/contexto/ContextoCarrito';
import { enrutador } from '@/rutas';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorBrindis>
        <ProveedorSesion>
          <ProveedorCarrito>
            <RouterProvider router={enrutador} />
          </ProveedorCarrito>
        </ProveedorSesion>
      </ProveedorBrindis>
    </QueryClientProvider>
  </React.StrictMode>,
);
