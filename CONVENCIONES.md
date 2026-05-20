# 🚨 CONVENCIONES DE CÓDIGO — REGLA INNEGOCIABLE 🚨

# TODOS los identificadores en CASTELLANO

> Este archivo existe porque la regla es **crítica** y se aplica a **TODO** el código de
> GaliciaWear desde la Fase 2 en adelante.
>
> Si encuentras código que no la cumple, **eso es un bug** y hay que corregirlo.

---

## ✅ QUÉ ESCRIBIR EN CASTELLANO

Aplica a **TODO** identificador que escribamos nosotros:

| Tipo | Inglés ❌ | Castellano ✅ |
|------|-----------|---------------|
| Variable | `const userList = ...` | `const listaUsuarios = ...` |
| Parámetro | `function get(id)` | `function obtener(id)` |
| Función | `createOrder()` | `crearPedido()` |
| Método de clase | `user.verifyPassword()` | `usuario.verificarContrasena()` |
| Clase | `class OrderService` | `class ServicioPedido` |
| Interfaz | `interface IRepository` | `interface IRepositorio` |
| Tipo propio | `type UserRole` | `type RolUsuario` |
| Propiedad / atributo | `product.basePrice` | `producto.precioBase` |
| Campo de DTO | `email, passwordHash` | `correo, hashContrasena` |
| Columna de BBDD | `password_hash` | `hash_contrasena` |
| Valor de enum | `OrderStatus.PENDING` | `EstadoPedido.PENDIENTE` |
| Nombre de archivo | `userService.ts` | `servicioUsuario.ts` |
| Nombre de carpeta | `src/modules/orders/` | `src/modulos/pedidos/` |
| Parámetros de callbacks Express | `(req, res, next) => ...` | `(peticion, respuesta, siguiente) => ...` |

---

## ❌ QUÉ NO TRADUCIR

Solo las cosas que **no controlamos** o que son universales:

- **APIs de librerías**: `express()`, `app.use()`, `jwt.sign()`, `bcrypt.hash()`, `prisma.usuario.findUnique()`. No podemos renombrar lo que viene de `node_modules`.
- **Tipos importados**: `Request`, `Response`, `NextFunction`, `Promise`, `Map`, `Set`, `PrismaClient`. Vienen de librerías.
- **Verbos HTTP**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- **Códigos de estado HTTP**: `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- **Acrónimos universales**: `JWT`, `API`, `REST`, `JSON`, `XML`, `CRUD`, `RBAC`, `FCM`, `DTO`, `ORM`, `HTTP`, `HTTPS`, `URL`, `UUID`, `SDK`, `CLI`, `SPA`, `SSR`, `UI`, `UX`, `KPI`, `CI`, `CD`, `TLS`, `SSL`, `CSRF`, `CORS`.
- **Estándares de archivos de configuración**: nombres de scripts npm (`dev`, `build`, `test`, `start`, `lint`), entradas en `package.json` (`dependencies`, `devDependencies`), claves de TypeScript (`compilerOptions`, `target`, `module`).
- **Convenciones universales de nombres de archivo**: `index.ts`, `Dockerfile`, `package.json`, `tsconfig.json`, `.gitignore`, `README.md`, `LICENSE`.

---

## 📐 EJEMPLO COMPLETO

### Antes (Fase 0, mal según la nueva regla)

```typescript
// backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Env = z.infer<typeof envSchema>;
export const env: Env = envSchema.parse(process.env);
```

### Después (Fase 2+, correcto)

```typescript
// backend/src/configuracion/entorno.ts
import { z } from 'zod';

const esquemaEntorno = z.object({
  NODE_ENV: z.enum(['desarrollo', 'pruebas', 'produccion']).default('desarrollo'),
  PUERTO: z.coerce.number().int().positive().default(3000),
});

export type Entorno = z.infer<typeof esquemaEntorno>;
export const entorno: Entorno = esquemaEntorno.parse(process.env);
```

> Nota: las **claves de variables de entorno** (lo que va en `.env`) son convención del
> ecosistema Node (`NODE_ENV`, `PORT`, `DATABASE_URL`). Esas no se traducen porque herramientas
> externas las leen. Sí se traduce el **alias** que usamos en código: `entorno.PUERTO`.

---

## 🗂️ ESTRUCTURA DE CARPETAS EN CASTELLANO

```
backend/src/
├── configuracion/          (antes: config/)
├── modulos/                (antes: modules/)
│   ├── autenticacion/
│   ├── usuarios/
│   ├── disenadores/
│   ├── productos/
│   ├── certificados/
│   ├── pedidos/
│   ├── carritos/
│   ├── resenas/
│   ├── mensajes/
│   ├── notificaciones/
│   ├── admin/
│   ├── importacion/
│   └── exportacion/
├── middlewares/
├── tiempoReal/             (antes: realtime/)
├── trabajadores/           (antes: workers/)
└── utilidades/             (antes: utils/)
```

### Cada módulo replica la misma estructura

```
modulos/<nombre>/
├── controlador.ts          (capa HTTP)
├── servicio.ts             (lógica de negocio)
├── repositorio.ts          (acceso a Prisma)
├── dto.ts                  (esquemas zod)
├── rutas.ts                (registro de endpoints)
├── tipos.ts                (interfaces propias del módulo)
└── *.test.ts               (pruebas)
```

---

## 🧭 GLOSARIO RÁPIDO (inglés → castellano)

| Inglés | Castellano |
|--------|------------|
| user | usuario |
| email | correo |
| password / password hash | contrasena / hashContrasena |
| customer / buyer | cliente |
| designer / seller | disenador (sin ñ en código por compatibilidad) |
| admin | admin |
| product | producto |
| variant | variante |
| category | categoria |
| certificate | certificado |
| order | pedido |
| order item / line | lineaPedido |
| shipment | envio |
| address | direccion |
| cart | carrito |
| cart item | itemCarrito |
| review | resena (sin ñ en código por compatibilidad) |
| rating | valoracion |
| status | estado |
| role | rol |
| token | token (préstamo aceptado) |
| refresh token | tokenRefresco |
| password | contrasena |
| created at | fechaCreacion |
| updated at | fechaActualizacion |
| deleted at | fechaEliminacion |
| activate / deactivate | activar / desactivar |
| validate | validar |
| accept / reject | aceptar / rechazar |
| send / receive | enviar / recibir |
| notification | notificacion |
| message | mensaje |
| chat | chat (préstamo aceptado) |
| stock | stock (préstamo aceptado en e-commerce) |
| price | precio |
| total | total |
| discount | descuento |
| log / audit log | registro / registroAuditoria |
| filter | filtro |
| search | buscar / busqueda |
| recommendation | recomendacion |
| payment | pago |
| invoice | factura |
| tracking | seguimiento |
| backup | copiaSeguridad |
| restore | restaurar |

---

## ⚠️ SOBRE LA Ñ Y LAS TILDES

**Recomendación**: en identificadores de código (variables, funciones, clases, archivos),
**evitar `ñ` y tildes**. Razones técnicas:

- Algunos editores, terminales y filesystems no manejan bien Unicode en identificadores.
- Las URLs y rutas de archivos con `ñ` se escapan a `%C3%B1` y rompen routers.
- TypeScript las admite, pero muchas herramientas (linters, lockfiles, Docker) las codifican
  raro en logs.

**Solución**: escribir sin `ñ`/tildes en identificadores, **mantener tildes y `ñ` en strings de UI**:

```typescript
// ✅ Identificador sin ñ ni tildes
const disenador = await servicioDisenador.obtenerPorId(id);
res.json({ mensaje: 'Diseñador encontrado' });  // ← string, sí lleva ñ

// ❌ Identificador con ñ
const diseñador = ...;  // funciona en TS pero rompe URLs / logs / scripts
```

Convención adoptada:
- `disenador` (no `diseñador`)
- `resena` (no `reseña`)
- `contrasena` (no `contraseña`)
- `gallego` / `espanol` / `numero` / `direccion` / `informacion` (sin tilde)

---

## 🚦 CHECKLIST AL REVISAR PR

Antes de aprobar cualquier cambio en Fase 2+:

- [ ] ¿Hay alguna variable, función o clase con nombre en inglés escrita por mí? **Rechazar.**
- [ ] ¿Algún parámetro de callback (req, res, next, err, data, ...) sin traducir? **Renombrar.**
- [ ] ¿Algún archivo nuevo con nombre en inglés? **Renombrar.**
- [ ] ¿Algún valor de enum en inglés? **Traducir.**
- [ ] ¿Alguna columna BBDD en inglés? **Renombrar con migración + `@map` en Prisma.**

---

## 🎓 JUSTIFICACIÓN PARA DEFENSA ORAL

Si el tribunal pregunta "¿por qué identificadores en castellano y no en inglés como manda
la convención profesional?", la respuesta es:

> "Aplico el principio de **lenguaje ubicuo** del Domain-Driven Design: el código habla
> el mismo idioma que el dominio del negocio. GaliciaWear es un marketplace gallego
> dirigido a usuarios y diseñadores hispanohablantes; los términos del negocio
> (diseñador, certificado de sostenibilidad, envío ecológico, pedido) nacen en castellano.
> Traducirlos al inglés introduciría una capa de traducción mental innecesaria y crearía
> divergencias sutiles entre el código y la conversación de producto."

Es una decisión deliberada, no un descuido. Eso se defiende.
