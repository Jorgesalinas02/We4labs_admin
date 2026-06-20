# Flujo de Caja · We4Labs

Sistema interno de gestión de flujo de caja. Implementa la **Fase 1** del PRD
(`../PRD_Sistema_Flujo_de_Caja.md`): registro manual de ingresos/egresos
multi-moneda, dashboard, clientes, reportes exportables, auditoría inmutable y
control de acceso por roles.

## Stack

- **Next.js 16** (App Router, Server Actions) + **Tailwind 4**
- **Neon** (Postgres serverless) + **Drizzle ORM**
- **Clerk** (autenticación, invitaciones, roles)
- **Vercel Blob** (comprobantes adjuntos)

## Puesta en marcha

### 1. Crear las cuentas de servicio
- **Neon** → https://neon.tech — crea un proyecto y copia la cadena "pooled".
- **Clerk** → https://dashboard.clerk.com — crea una aplicación.
- **Vercel Blob** → Vercel → Storage → Blob — genera un token.

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y rellena con tus credenciales reales:

```bash
cp .env.example .env.local
```

### 3. Crear las tablas y sembrar datos
```bash
pnpm db:migrate   # crea las tablas en Neon
pnpm db:seed      # carga las categorías predefinidas y la config inicial
```
(Alternativa rápida en desarrollo: `pnpm db:push`.)

### 4. Configurar roles en Clerk
El rol vive en `publicMetadata.role` de cada usuario (`"admin"` o `"visor"`).
Quien no tenga rol entra como **Visor** (solo lectura). Asigna los roles desde
el dashboard de Clerk o vía su API. Los founders se invitan desde Clerk
(no hay registro público).

### 5. Correr en local
```bash
pnpm dev
```

### 6. Despliegue
Conecta el repo a **Vercel** y carga las mismas variables de entorno. El
`pnpm build` ya está validado.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm db:generate` | Genera migraciones SQL desde el esquema |
| `pnpm db:migrate` | Aplica migraciones en la base |
| `pnpm db:seed` | Siembra categorías + config inicial |
| `pnpm db:studio` | Explorador visual de la base |

## Decisiones de diseño clave

- **Dinero en `NUMERIC`**, nunca `float`. Todo cálculo se hace sobre `monto_cop`
  (monto normalizado a pesos con la tasa de cambio del momento).
- **Multi-moneda COP/USD**: se guarda monto original, moneda, tasa y equivalente COP.
- **Soft delete**: las transacciones nunca se borran físicamente; se marcan como
  `eliminada` y quedan en el log de auditoría.
- **Roles validados en el backend** (cada Server Action/Route Handler revalida el
  rol, no se confía solo en el frontend).
- **Cortes de mes en `America/Bogota`** para que los comparativos sean correctos.
- **Saldo** = saldo inicial configurado + ingresos − egresos.

## Pendiente de cargar (configuración del negocio)

1. **Saldo inicial** + fecha de corte → pantalla *Configuración* (rol Admin).
2. **Clientes** iniciales → pantalla *Clientes*.
3. **Roles** de cada founder → dashboard de Clerk.

## Nota sobre comprobantes

Vercel Blob expone los archivos con una URL aleatoria no enumerable (`addRandomSuffix`).
La subida exige rol Admin y valida tipo (JPG/PNG/PDF) y tamaño (máx. 10 MB).
Si se requiere control de acceso estricto a nivel de archivo, migrar a descarga
proxiada por un Route Handler que valide sesión antes de servir el blob.
