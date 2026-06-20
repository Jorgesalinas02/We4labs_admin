# Plan de Trabajo — Sistema de Gestión de Flujo de Caja (We4Labs)

Documento de ejecución del PRD `PRD_Sistema_Flujo_de_Caja.md`.
Versión 1.0 · Junio 2026

> **Confidencial — Uso interno exclusivo de los founders**

---

## 1. Decisiones de diseño cerradas

| Decisión | Resolución | Impacto |
|---|---|---|
| **Moneda** | Multi-moneda **COP + USD** | Cada transacción guarda moneda, monto original, tasa de cambio y monto normalizado en COP |
| **Autenticación** | **Clerk** (servicio gestionado) | Invitaciones, sesiones por dispositivo y roles listos; rol re-validado en backend |
| **Adjuntos** | **Vercel Blob privado**, en Fase 1 | jpg/png/pdf, máx. 10 MB, servidos vía API route con validación de sesión |
| **Arranque** | Plan detallado primero | Sin código hasta aprobar este plan |

---

## 2. Vacíos del PRD detectados y su resolución

1. **Multi-moneda (COP/USD):** resuelto con campos `moneda`, `monto_original`, `tasa_cambio`, `monto_cop`. El saldo y los reportes se calculan sobre `monto_cop` normalizado.
2. **Saldo inicial:** la cuenta ya tiene dinero hoy. Se añade tabla `config` con `saldo_inicial_cop` + `saldo_inicial_fecha`. El saldo del dashboard parte de ahí, no de cero.
3. **Decimales de dinero:** todos los montos en `NUMERIC(15,2)` en Postgres. **Prohibido `float`.** En el frontend, formateo con `Intl.NumberFormat`.
4. **Rentabilidad por cliente:** es rentabilidad **de caja** (un anticipo entra como ingreso aunque el trabajo no se haya entregado). Se etiqueta explícitamente como "caja", no como rentabilidad contable.
5. **Categorías editables vs. dashboard:** la tabla `categorias` incluye `grupo_gasto` (nomina/operativo/cliente/admin/marketing/otro) para que el desglose del dashboard funcione aunque se agreguen categorías nuevas.
6. **Zona horaria:** cortes de mes en `America/Bogota` fijo, para comparativos mes-vs-mes correctos.
7. **"Saldo proyectado" (5.6):** la proyección es Fase 3. En Fase 1 la alerta es sobre **saldo actual < umbral configurado**.
8. **Adjuntos:** bucket privado, acceso por API route, soft delete no borra el blob (evidencia).

---

## 3. Modelo de datos corregido

```
usuarios     → se delega a Clerk; tabla local espeja: clerk_id, rol (admin|visor), estado, created_at
clientes     → id, nombre, tipo_relacion (anticipo|recurrente|ambos), estado, created_at
categorias   → id, nombre, tipo (ingreso|egreso),
               grupo_gasto (nomina|operativo|cliente|admin|marketing|otro|n/a),
               descripcion_dummies, activa
transacciones→ id, tipo, categoria_id, cliente_id (nullable),
               moneda (COP|USD), monto_original NUMERIC(15,2),
               tasa_cambio NUMERIC(12,4), monto_cop NUMERIC(15,2),
               fecha (date), descripcion, metodo_pago, comprobante_url (nullable),
               creado_por (clerk_id), created_at, estado (activa|eliminada)   ← soft delete
config       → saldo_inicial_cop, saldo_inicial_fecha, umbral_alerta_caja,
               zona_horaria = 'America/Bogota'
log_auditoria→ id, usuario, accion, entidad, entidad_id,
               valores_antes (jsonb), valores_despues (jsonb), created_at   ← inmutable
```

**Cálculo del saldo:**
`saldo = saldo_inicial_cop + Σ(ingresos.monto_cop) − Σ(egresos.monto_cop)`
sobre transacciones con `estado = 'activa'`.

---

## 4. Stack

| Componente | Herramienta |
|---|---|
| Frontend + hosting | Next.js (App Router, TypeScript) en Vercel |
| Base de datos | Neon (Postgres serverless) |
| ORM | Drizzle o Prisma (a decidir en Fase 0) |
| Auth | Clerk (rol re-validado en cada API route) |
| Adjuntos | Vercel Blob (privado) |
| Exportación | CSV/Excel del listado filtrado |
| PWA | manifest + service worker, instalable en celular |

---

## 5. Fases de ejecución

### Fase 0 — Setup (½–1 día)
- Repo Next.js + TypeScript, despliegue en Vercel.
- Conexión a Neon, definición del ORM.
- Integración de Clerk (org cerrada, invitaciones).
- Esquema inicial de base de datos (migraciones).
- Seed de categorías predefinidas con `grupo_gasto` y descripción del glosario.
- Configuración de `config` (saldo inicial, zona horaria, umbral).

### Fase 1 — Núcleo MVP
1. Auth Clerk + roles + middleware de rutas + validación de rol en API.
2. CRUD de clientes.
3. Formulario de transacción: multi-moneda, glosario embebido, validación, < 30s, botón flotante "+ Nueva transacción".
4. Adjuntos de comprobantes (cámara/archivo, blob privado).
5. Soft delete + audit log automático en cada escritura.
6. Dashboard: saldo, ingresos/egresos mes vs mes, dona por `grupo_gasto`, top clientes, últimas 10 transacciones.
7. Listado filtrable (tipo, categoría, cliente, fechas, usuario) + export CSV/Excel.
8. Detalle por cliente (rentabilidad de caja, etiquetada como tal).
9. Responsive + PWA + onboarding 3–4 pantallas.
10. Alerta de saldo actual < umbral (sin proyección).

### Fase 2 — Automatización bancaria
- Open banking en Colombia (evaluar Belvo u otros).
- Importación automática + sugerencia de categoría por histórico.
- Conciliación con registro manual (que se conserva).

### Fase 3 — Proyección y planeación
- Proyección de flujo de caja basada en recurrentes y gastos fijos.
- Alertas de riesgo con antelación.
- Rentabilidad por cliente avanzada (margen, CAC).

---

## 6. Orden de construcción sugerido

Setup → Auth/roles → modelo de datos + seed → **formulario de transacción** (corazón del sistema) → adjuntos → listado/export → dashboard → clientes → onboarding/PWA → pulido.

---

## 7. Pendientes del lado de los founders

1. **Saldo inicial** de la cuenta + fecha de corte.
2. **Lista de clientes/proyectos** iniciales a cargar.
3. Confirmar quién es **Admin** y quién es **Visor**.
4. Definir con el contador el **formato exacto** de exportación mensual.

---

*Fin del documento*
