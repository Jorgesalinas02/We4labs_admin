# PRD — Sistema de Gestión de Flujo de Caja

**Control financiero interno para empresa de desarrollo de software**

Versión 1.0 · Documento de Requerimientos de Producto
Junio 2026

> **Confidencial — Uso interno exclusivo de los founders**

---

## Tabla de contenido

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Contexto del negocio y problema a resolver](#2-contexto-del-negocio-y-problema-a-resolver)
3. [Usuarios, roles y control de acceso](#3-usuarios-roles-y-control-de-acceso)
4. [Glosario "para dummies" y categorías del sistema](#4-glosario-para-dummies-y-categorías-del-sistema)
5. [Funcionalidades (Fase 1)](#5-funcionalidades-fase-1)
6. [Experiencia de usuario y diseño](#6-experiencia-de-usuario-y-diseño)
7. [Consideraciones técnicas (propuesta de stack)](#7-consideraciones-técnicas-propuesta-de-stack)
8. [Modelo de datos (alto nivel)](#8-modelo-de-datos-alto-nivel)
9. [Roadmap por fases](#9-roadmap-por-fases)
10. [Riesgos y consideraciones](#10-riesgos-y-consideraciones)
11. [Métricas de éxito](#11-métricas-de-éxito)
12. [Próximos pasos sugeridos](#12-próximos-pasos-sugeridos)

---

## 1. Resumen ejecutivo

Este documento define los requerimientos para construir un sistema interno de gestión de flujo de caja (cash flow) para la empresa. El objetivo es tener control claro, ordenado y auditable de todo el dinero que entra y sale de la cuenta de ahorros de la empresa: anticipos de proyectos, ingresos recurrentes de clientes, pagos de nómina a los founders y gastos operativos.

Hoy ese control no existe de forma estructurada. La empresa ya tiene varios clientes activos, ya hay ingresos recurrentes y por anticipo, y mezclar todo en una sola cuenta sin categorización clara genera riesgo: no se sabe con precisión cuánto es utilidad real, cuánto está comprometido en gastos fijos, ni qué tan rentable es cada cliente o proyecto.

### 1.1 Objetivo del sistema

- Registrar manualmente (fase 1) cada ingreso y egreso de la cuenta de ahorros de la empresa, de forma rápida y sin fricción.
- Distinguir con claridad el tipo de movimiento: ingreso por anticipo, ingreso recurrente, gasto de nómina, gasto operativo, entre otros.
- Asociar cada transacción a un cliente o proyecto específico, para poder ver rentabilidad por cliente.
- Restringir el acceso solo a los founders, con roles diferenciados (administrador vs. solo lectura).
- Dejar registro de auditoría: quién entró, cuándo, y qué movimiento registró o modificó.
- Ser una base sólida y ordenada en datos para que, en una fase futura, se pueda conectar directamente con la banca y automatizar la captura de transacciones.
- Ser una herramienta "para dummies": cualquier founder, sin importar su formación financiera o contable, debe poder usarla sin confusión.

### 1.2 Fuera de alcance en esta fase

- Conexión directa con bancos (open banking / agregadores) — queda planteada como Fase 2.
- Facturación electrónica o integración con DIAN.
- Nómina electrónica formal (PILA, seguridad social) — el sistema registra el pago como gasto, no reemplaza el proceso legal de nómina.
- Multi-empresa: el sistema está pensado para una sola cuenta/empresa en esta fase.
- Conciliación bancaria automática.

---

## 2. Contexto del negocio y problema a resolver

### 2.1 Situación actual

La empresa es una desarrolladora de software con varios clientes activos. El modelo de ingresos combina dos tipos de flujo: pagos por anticipo al iniciar un proyecto (ingreso puntual) y pagos recurrentes mensuales por mantenimiento, soporte o suscripción a un producto. Todo el dinero entra a una única cuenta de ahorros de la empresa, de la cual también salen todos los gastos: pago de sueldo a los founders, gastos operativos del negocio, y gastos relacionados con clientes (por ejemplo, una comida o salida de trabajo con un cliente).

Actualmente este flujo no está categorizado ni documentado en ningún sistema. Esto dificulta responder preguntas básicas pero críticas para la salud financiera del negocio.

### 2.2 Preguntas que el sistema debe poder responder

- ¿Cuánto dinero tiene la empresa disponible hoy?
- ¿Cuánto se ha facturado este mes vs. el mes anterior?
- ¿Cuánto de lo que entra es ingreso recurrente y cuánto es anticipo puntual?
- ¿Cuánto se ha gastado en nómina de founders vs. gastos operativos del negocio?
- ¿Qué cliente o proyecto es más rentable?
- ¿Hay suficiente caja para cubrir los compromisos fijos del próximo mes?

### 2.3 Por qué un sistema y no una hoja de cálculo

Una hoja de cálculo compartida es frágil: cualquier persona con el enlace puede ver y editar todo, no hay registro de quién cambió qué, y no obliga a categorizar correctamente cada movimiento. El sistema propuesto resuelve esto con control de acceso real, categorías guiadas y un registro de auditoría, sin sacrificar la simplicidad de uso de una hoja de cálculo.

---

## 3. Usuarios, roles y control de acceso

El sistema es de acceso cerrado: solo los founders de la empresa pueden entrar, mediante invitación directa (no hay registro abierto / "sign up" público). Dentro de ese grupo cerrado, existen dos niveles de permiso.

### 3.1 Roles del sistema

| Rol | Puede hacer | No puede hacer |
|---|---|---|
| **Administrador (Admin)** | Registrar ingresos y egresos. Editar y eliminar transacciones. Crear/editar clientes y proyectos. Ver todos los reportes y el historial de auditoría. Invitar nuevos usuarios. | — |
| **Visor (Solo lectura)** | Ver el dashboard, reportes, saldo actual, historial de transacciones y filtros por cliente/categoría. | Registrar, editar o eliminar transacciones. Crear clientes o proyectos. Invitar usuarios. Ver el log de auditoría detallado (opcional, ver nota abajo). |

> **Nota de diseño:** El primer Admin (quien implemente el sistema) decide qué founders son Admin y cuáles son Visor. Esto se configura manualmente al crear cada cuenta de usuario; no hay autoasignación de rol.

### 3.2 Autenticación y acceso

- Acceso mediante usuario y contraseña (correo + contraseña), sin registro público abierto.
- Los usuarios se crean únicamente por invitación de un Admin desde el propio sistema.
- Recomendado para fase 1: "magic link" (enlace de un solo uso enviado al correo) o contraseña + verificación por correo — ambas opciones son simples de implementar sobre Vercel/Neon y no requieren que el usuario recuerde contraseñas complejas.
- Sesión persistente en cada dispositivo (celular, computador, iPad) para que no haya que iniciar sesión constantemente, con cierre de sesión manual disponible.
- No existe un modo "invitado" ni enlaces públicos para compartir reportes fuera del sistema en esta fase.

### 3.3 Registro de auditoría (Audit Log)

Cada acción relevante queda registrada de forma automática e inmutable (no editable, ni siquiera por un Admin). Esto protege a todos los founders: en una empresa con varios socios manejando dinero, la trazabilidad no es opcional.

| Evento registrado | Datos que guarda |
|---|---|
| Inicio de sesión | Usuario, fecha y hora, dispositivo/navegador aproximado |
| Transacción creada | Usuario, fecha y hora, datos completos de la transacción |
| Transacción editada | Usuario, fecha y hora, valores anteriores y nuevos (qué cambió) |
| Transacción eliminada | Usuario, fecha y hora, datos de la transacción eliminada (se guarda, no se borra físicamente) |
| Cliente/proyecto creado o editado | Usuario, fecha y hora, cambios realizados |
| Usuario invitado o rol cambiado | Quién invitó, a quién, con qué rol |

> **Importante:** Las transacciones nunca se eliminan físicamente de la base de datos ("soft delete"). Se marcan como eliminadas pero quedan disponibles en el log de auditoría. Esto evita que un error o una acción malintencionada borre evidencia financiera.

---

## 4. Glosario "para dummies" y categorías del sistema

Esta es la pieza central de la experiencia "amigable" que se pidió: cada concepto financiero que el usuario vea en pantalla debe tener una explicación corta, en español sencillo, visible directamente en el formulario (no en un manual aparte). A continuación se define cada término y cada categoría que debe existir en el sistema desde el día uno.

### 4.1 Conceptos base

| Término | Explicación en el sistema |
|---|---|
| **Ingreso** | Cualquier dinero que entra a la cuenta de la empresa. Ejemplo: un cliente te paga el anticipo de un proyecto, o te paga la mensualidad de soporte. |
| **Egreso** | Cualquier dinero que sale de la cuenta de la empresa. Ejemplo: pagas el sueldo de un founder, o pagas el hosting del mes. |
| **Saldo / Caja disponible** | Cuánto dinero hay hoy en la cuenta, después de sumar todos los ingresos y restar todos los egresos registrados. |
| **Anticipo de proyecto** | Dinero que un cliente paga al inicio de un proyecto, antes de que se entregue el trabajo completo. Es un ingreso puntual, no se repite cada mes. |
| **Ingreso recurrente** | Dinero que un cliente paga de forma periódica (normalmente cada mes) por un servicio continuo, como soporte, mantenimiento o suscripción a una plataforma. |
| **Gasto de nómina** | Dinero que sale de la cuenta para pagarle a un founder por su trabajo (su "sueldo"). Se distingue de otros gastos porque es pago a una persona del equipo, no a un proveedor externo. |
| **Gasto operativo** | Dinero que sale para mantener funcionando el negocio, pero que NO es pago a una persona del equipo. Ejemplo: hosting, dominios, software, herramientas, publicidad. |
| **Gasto relacionado a cliente** | Dinero que sale por una actividad ligada directamente a un cliente específico, como una comida de trabajo o un desplazamiento. Se asocia al cliente para saber cuánto cuesta atenderlo. |
| **Proyecto / Cliente** | La empresa o persona con la que tienes una relación comercial. Cada transacción (ingreso o egreso) puede asociarse a un cliente para saber cuánto entra y cuánto cuesta cada uno. |

### 4.2 Categorías predefinidas (Fase 1)

Las categorías vienen ya creadas en el sistema desde el inicio, cada una con su explicación visible. Un Admin puede agregar categorías nuevas más adelante si surge la necesidad, pero el set inicial cubre el flujo real del negocio descrito.

**Categorías de Ingreso**

| Categoría | Cuándo usarla |
|---|---|
| Anticipo de proyecto | Pago inicial de un cliente al arrancar un proyecto nuevo |
| Pago final / hito de proyecto | Pago al entregar el proyecto o al cumplir un hito acordado |
| Ingreso recurrente (mensualidad) | Pago periódico de soporte, mantenimiento o suscripción |
| Otro ingreso | Cualquier ingreso que no encaje en las anteriores (ej. rendimientos financieros, devoluciones) |

**Categorías de Egreso**

| Categoría | Cuándo usarla |
|---|---|
| Nómina founders | Pago de sueldo a cualquiera de los founders |
| Gasto operativo (herramientas/software) | Hosting, dominios, suscripciones de software, licencias |
| Gasto relacionado a cliente | Comidas, desplazamientos o actividades ligadas a un cliente puntual |
| Gasto administrativo/legal | Contador, trámites, comisiones bancarias, impuestos |
| Marketing y ventas | Publicidad, materiales comerciales, eventos |
| Otro egreso | Cualquier gasto que no encaje en las anteriores |

> **Sobre cuentas en Colombia:** El sistema modela el flujo de caja real (lo que efectivamente entra y sale de la cuenta de ahorros), no es un sistema de contabilidad formal bajo NIIF ni reemplaza la contabilidad que lleve el contador de la empresa. Las categorías están pensadas para que, al final del mes, el contador pueda tomar el reporte exportado y clasificarlo fácilmente en el plan de cuentas (PUC) que corresponda para efectos tributarios.

---

## 5. Funcionalidades (Fase 1)

### 5.1 Registro de transacciones

Es la funcionalidad más importante del sistema: debe ser rápida, simple y a prueba de errores.

**Campos del formulario de transacción**

| Campo | Obligatorio | Detalle |
|---|---|---|
| Tipo | Sí | Ingreso o Egreso (selector grande, visual, primero en el formulario) |
| Categoría | Sí | Lista desplegable según el Tipo elegido (ver sección 4.2), con tooltip de ayuda |
| Monto | Sí | Con formato automático de miles. Decimales manejados como `NUMERIC` (nunca `float`) para evitar errores de redondeo |
| Moneda | Sí | COP o USD. Por defecto COP. Al elegir USD se solicita la tasa de cambio del día |
| Tasa de cambio | Condicional | Obligatoria si la moneda es USD. El sistema guarda el monto original, la tasa y el monto normalizado en COP para los cálculos del dashboard |
| Fecha | Sí | Por defecto la fecha de hoy, editable |
| Cliente/Proyecto | Condicional | Obligatorio si la categoría implica un cliente (anticipo, recurrente, gasto de cliente); opcional/no aplica para nómina o gastos generales |
| Descripción | Sí | Texto corto libre, ej. "Anticipo proyecto DORU - mes 1" |
| Método de pago | No | Transferencia, efectivo, otro (campo simple, no crítico en fase 1) |
| Comprobante adjunto | No | Subir foto o PDF del soporte (factura, comprobante de transferencia) |

**Reglas de la experiencia de registro**

- El formulario debe poder completarse en menos de 30 segundos para un caso simple (monto, categoría, fecha, descripción).
- Cada categoría muestra debajo su explicación corta (la del glosario de la sección 4) para que el usuario confirme que eligió bien.
- Colores consistentes en toda la interfaz: verde para ingresos, rojo para egresos — así se reconoce de un vistazo el tipo de movimiento en cualquier lista o reporte.
- Acceso de registro rápido desde cualquier pantalla (botón flotante "+ Nueva transacción"), pensado para uso desde el celular en el momento que ocurre el gasto.
- Confirmación visual clara al guardar ("Transacción registrada") y posibilidad de deshacer/editar inmediatamente después.

### 5.2 Edición y eliminación

- Solo el rol Admin puede editar o eliminar transacciones.
- Eliminar pide confirmación explícita ("¿Seguro que quieres eliminar esta transacción? Quedará registrada en el historial de auditoría").
- Toda edición guarda el valor anterior y el nuevo en el log de auditoría (sección 3.3).

### 5.3 Gestión de clientes / proyectos

- CRUD simple de clientes: nombre, tipo de relación (anticipo único / recurrente / ambos), estado (activo/inactivo).
- Vista de detalle por cliente: total ingresado, total gastado en relación a ese cliente, rentabilidad neta, historial de transacciones asociadas.

### 5.4 Dashboard principal

Es la pantalla de inicio. Debe responder de un vistazo las preguntas de la sección 2.2.

- Saldo actual de la cuenta (número grande, visible de inmediato). Se calcula a partir de un **saldo inicial** configurado (la cuenta ya tiene dinero hoy) más ingresos menos egresos. Mostrado en COP por defecto, con opción de ver en USD.
- Ingresos del mes actual vs. mes anterior (comparación simple, con flecha de subida/bajada).
- Egresos del mes actual vs. mes anterior.
- Desglose de egresos del mes: nómina vs. operativo vs. relacionado a clientes (gráfico simple tipo dona o barras).
- Top clientes por ingreso del mes / del periodo seleccionado.
- Lista de últimas 10 transacciones, con acceso directo a ver todas.

### 5.5 Reportes e historial

- Listado completo de transacciones con filtros: por tipo, categoría, cliente, rango de fechas, usuario que registró.
- Exportar a Excel/CSV el resultado filtrado (clave para entregárselo al contador cada mes).
- Reporte mensual resumen: total ingresos, total egresos, utilidad neta del mes, comparación con mes anterior.

### 5.6 Notificaciones (opcional en fase 1, recomendado)

- Aviso simple (correo o dentro del sistema) si pasan más de X días sin registrar ninguna transacción, como recordatorio de mantener el sistema al día.
- Aviso opcional cuando el **saldo actual** cae por debajo de un umbral configurado (alerta de caja baja). *Nota: la alerta sobre saldo proyectado a futuro requiere la lógica de proyección de la Fase 3; en Fase 1 la alerta se basa en el saldo actual.*

---

## 6. Experiencia de usuario y diseño

### 6.1 Principios de diseño

- **Para dummies:** ningún término financiero aparece sin una explicación accesible (tooltip, texto de ayuda bajo el campo, o ejemplo).
- **Mobile-first:** la mayoría de registros van a ocurrir desde el celular en el momento del gasto; el diseño se piensa primero para pantalla pequeña y luego se adapta a escritorio.
- **Responsive total:** debe verse y funcionar bien en celular, tablet (iPad) y computador, sin apps nativas — un sitio web responsivo es suficiente y más fácil de mantener.
- **Onboarding ligero:** la primera vez que un usuario entra, un recorrido corto (3-4 pantallas) explica qué es un ingreso, qué es un egreso, y cómo registrar su primera transacción.
- **Cero jerga contable en pantalla:** se usa lenguaje cotidiano ("dinero que entra" en vez de "flujo de entrada"), reservando los términos técnicos para los reportes exportables que ve el contador.

### 6.2 Acceso multiplataforma

El sistema se construye como una aplicación web responsiva (no apps nativas separadas para iOS/Android). Esto permite cumplir el requerimiento de "abrir en el celular, el computador y el iPad" con un solo desarrollo, manteniendo todo simple de mantener.

- Se puede "instalar" como acceso directo en la pantalla de inicio del celular (tipo PWA - Progressive Web App), para que se sienta como una app sin serlo técnicamente.
- Mismo usuario y los mismos datos en todos los dispositivos, en tiempo real.

---

## 7. Consideraciones técnicas (propuesta de stack)

Se propone un stack alineado con las herramientas que ya usas habitualmente, priorizando velocidad de implementación, bajo mantenimiento y costo mínimo en una fase inicial.

| Componente | Herramienta propuesta | Por qué |
|---|---|---|
| Frontend + hosting | Next.js, desplegado en Vercel | Es lo que ya usas; despliegue inmediato, gratis para este nivel de uso, responsive nativo |
| Base de datos | Neon (Postgres serverless) | Ya la usas; relacional, ideal para transacciones financieras donde la integridad de datos importa |
| Backend / lógica | API routes de Next.js (o un backend en Python si se requiere lógica más compleja a futuro) | Evita mantener un servidor aparte en fase 1; Render queda disponible si luego se necesita un servicio Python independiente (ej. para la futura integración bancaria) |
| Autenticación | **Clerk** | Maneja invitaciones, sesiones por dispositivo y roles sin construir un login desde cero. El rol (Admin/Visor) se valida también en cada API route, no solo en el frontend |
| Almacenamiento de comprobantes | **Vercel Blob (privado)** | Guarda fotos/PDF de soportes (jpg/png/pdf, máx. 10 MB). El bucket no es público: cada archivo se sirve vía API route que valida sesión y rol |

> **Por qué Postgres y no una hoja de cálculo o NoSQL:** El dinero exige integridad de datos: que un monto nunca quede mal escrito, que dos transacciones no se pisen, y que se puedan hacer sumas y reportes confiables. Postgres (vía Neon) es el estándar para este tipo de sistemas y permite, a futuro, conectarlo fácilmente a herramientas de BI o a la integración bancaria sin rediseñar la base de datos.

### 7.1 Seguridad de los datos financieros

- Toda comunicación cifrada (HTTPS).
- Contraseñas nunca almacenadas en texto plano (hash con bcrypt o similar, estándar de las librerías de auth recomendadas).
- Backups automáticos diarios de la base de datos (Neon los ofrece de forma nativa).
- Variables sensibles (claves de API, credenciales) fuera del código, en variables de entorno de Vercel.
- Control de acceso a nivel de base de datos: ningún Visor puede, ni siquiera por error de interfaz, ejecutar una acción de escritura — la restricción se valida también en el backend, no solo se oculta en el frontend.

---

## 8. Modelo de datos (alto nivel)

Estructura conceptual de las tablas principales que soportará el sistema. El detalle exacto de columnas se ajusta en la fase de implementación, pero esta es la base.

| Tabla | Contenido principal |
|---|---|
| `usuarios` | Nombre, correo, contraseña (hash), rol (admin/visor), fecha de creación, estado (activo/inactivo) |
| `clientes_proyectos` | Nombre del cliente, tipo de relación (anticipo/recurrente/ambos), estado, fecha de creación |
| `categorias` | Nombre, tipo (ingreso/egreso), `grupo_gasto` (nómina/operativo/cliente/admin/marketing/otro — necesario para el desglose del dashboard aunque se agreguen categorías nuevas), descripción "para dummies", activa/inactiva |
| `transacciones` | Tipo, categoría, **moneda (COP/USD), monto original, tasa de cambio, monto normalizado en COP** (todos los montos en `NUMERIC`, nunca `float`), fecha, cliente/proyecto (opcional), descripción, método de pago, comprobante adjunto, usuario que la creó, fecha de creación, estado (activa/eliminada) |
| `config` | Saldo inicial de la cuenta + fecha de corte, umbral de alerta de caja, zona horaria (America/Bogota) |
| `log_auditoria` | Usuario, acción (login, crear, editar, eliminar, invitar), fecha y hora, detalle de la acción, valores anteriores/nuevos cuando aplica |

---

## 9. Roadmap por fases

### 9.1 Fase 1 — Registro manual (MVP, alcance de este PRD)

- Autenticación cerrada con roles Admin/Visor.
- Registro manual de ingresos y egresos con categorías guiadas.
- Asociación a clientes/proyectos.
- Dashboard con saldo, comparativos mensuales y desglose de gastos.
- Historial filtrable, exportable a Excel/CSV.
- Log de auditoría completo.
- Diseño responsive (celular, tablet, computador).

### 9.2 Fase 2 — Automatización bancaria

- Conexión con la cuenta de ahorros vía agregador de open banking disponible en Colombia (a evaluar: Belvo u otros proveedores activos en el país al momento de implementar).
- Importación automática de movimientos bancarios, con sugerencia automática de categoría basada en el histórico.
- Conciliación: cruce entre lo registrado manualmente (si quedó algo pendiente) y lo que reporta el banco.
- El registro manual no desaparece: sigue existiendo para gastos en efectivo o casos donde la automatización falle.

### 9.3 Fase 3 — Proyección y planeación financiera (futuro)

- Proyección de flujo de caja a futuro basada en ingresos recurrentes conocidos y gastos fijos.
- Alertas de riesgo de caja con antelación.
- Reportes de rentabilidad por cliente más sofisticados (margen, costo de adquisición, etc.).

---

## 10. Riesgos y consideraciones

| Riesgo | Mitigación | Severidad |
|---|---|---|
| Que el equipo no registre las transacciones de forma consistente | Formulario rápido (menos de 30 segundos), recordatorios automáticos, acceso fácil desde el celular | Alta |
| Categorización incorrecta por desconocimiento financiero | Glosario visible en cada formulario, categorías predefinidas con ejemplos, no categorías libres en fase 1 | Media |
| Pérdida o filtración de datos financieros sensibles | Acceso cerrado por invitación, roles diferenciados, HTTPS, backups automáticos en Neon | Alta |
| El sistema no refleje la realidad bancaria por error humano | Campo de comprobante adjunto opcional, posibilidad de exportar y conciliar manualmente cada mes mientras no exista la integración bancaria | Media |

---

## 11. Métricas de éxito

Cómo se sabrá que el sistema está cumpliendo su propósito, una vez en uso:

- 100% de las transacciones de la cuenta de la empresa quedan registradas en el sistema (sin movimientos "fantasma" fuera de él).
- Tiempo promedio de registro de una transacción por debajo de 30-45 segundos.
- Cero transacciones sin categoría o sin cliente asociado cuando corresponde.
- El reporte mensual exportado es suficiente para el contador sin necesidad de pedir aclaraciones adicionales.
- Los founders consultan el dashboard de forma habitual (no solo cuando hay un problema) para tomar decisiones.

---

## 12. Próximos pasos sugeridos

1. Validar este PRD entre los founders: confirmar roles (quién es Admin, quién es Visor) y ajustar categorías si falta alguna específica del negocio.
2. Definir el set inicial de clientes/proyectos a cargar en el sistema desde el día uno.
3. Implementar la Fase 1 sobre el stack propuesto (Next.js + Vercel + Neon).
4. Cargar manualmente el histórico reciente (último mes o dos) para que el dashboard tenga datos comparativos desde el lanzamiento.
5. Definir con el contador de la empresa el formato exacto de exportación que más le facilite su trabajo.
6. Evaluar proveedores de open banking en Colombia cuando se aborde la Fase 2.

---

*Fin del documento*
