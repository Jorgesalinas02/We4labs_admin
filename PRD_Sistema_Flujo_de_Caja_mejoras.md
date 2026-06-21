# PRD — Sistema de Gestión de Flujo de Caja

**Control financiero interno para empresa de desarrollo de software**

Versión 2.0 · Documento de Requerimientos de Producto
Junio 2026

> **Confidencial — Uso interno exclusivo de los founders**

---

## Tabla de contenido

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Contexto del negocio y problema a resolver](#2-contexto-del-negocio-y-problema-a-resolver)
3. [Usuarios, roles y control de acceso](#3-usuarios-roles-y-control-de-acceso)
4. [Glosario "para dummies" y categorías del sistema](#4-glosario-para-dummies-y-categorías-del-sistema)
5. [Funcionalidades (Fase 1)](#5-funcionalidades-fase-1)
6. [Flujo de Caja Proyectado](#6-flujo-de-caja-proyectado)
7. [Caja mínima y calendario tributario](#7-caja-mínima-y-calendario-tributario)
8. [Experiencia de usuario y diseño](#8-experiencia-de-usuario-y-diseño)
9. [Consideraciones técnicas (propuesta de stack)](#9-consideraciones-técnicas-propuesta-de-stack)
10. [Modelo de datos (alto nivel)](#10-modelo-de-datos-alto-nivel)
11. [Roadmap por fases](#11-roadmap-por-fases)
12. [Riesgos y consideraciones](#12-riesgos-y-consideraciones)
13. [Métricas de éxito](#13-métricas-de-éxito)
14. [Próximos pasos sugeridos](#14-próximos-pasos-sugeridos)

---

## 1. Resumen ejecutivo

Este documento define los requerimientos para construir un sistema interno de gestión de flujo de caja (cash flow) para la empresa. El objetivo es tener control claro, ordenado y auditable de todo el dinero que entra y sale de la cuenta de ahorros de la empresa: anticipos de proyectos, ingresos recurrentes de clientes, pagos de nómina a los founders y gastos operativos — además de poder anticipar, no solo registrar, cómo se va a comportar la caja en las próximas semanas.

Hoy ese control no existe de forma estructurada. La empresa ya tiene varios clientes activos, ya hay ingresos recurrentes y por anticipo, y mezclar todo en una sola cuenta sin categorización clara genera riesgo: no se sabe con precisión cuánto es utilidad real, cuánto está comprometido en gastos fijos, ni qué tan rentable es cada cliente o proyecto.

### 1.1 Objetivo del sistema

- Registrar manualmente (fase 1) cada ingreso y egreso de la cuenta de ahorros de la empresa, de forma rápida y sin fricción.
- Distinguir con claridad el tipo de movimiento, usando categorías madre y subcategorías alineadas con la práctica contable de pymes en Colombia (ventas, nómina, costos directos, impuestos, deuda, capex, entre otros).
- Asociar cada transacción a un cliente o proyecto específico, para poder ver rentabilidad real por cliente.
- Restringir el acceso solo a los founders, con roles diferenciados (administrador vs. solo lectura).
- Dejar registro de auditoría: quién entró, cuándo, y qué movimiento registró o modificó.
- Proyectar el flujo de caja de las próximas semanas, no solo registrar lo que ya ocurrió, para anticipar faltantes de liquidez.
- Recordar obligaciones tributarias colombianas (IVA, ICA, retefuente, etc.) que generan picos de salida de efectivo.
- Alertar cuando el saldo, real o proyectado, se acerca a un colchón mínimo de caja definido por los founders.
- Ser una base sólida y ordenada en datos para que, en una fase futura, se pueda conectar directamente con la banca y automatizar la captura de transacciones.
- Ser una herramienta "para dummies": cualquier founder, sin importar su formación financiera o contable, debe poder usarla sin confusión.

### 1.2 Fuera de alcance en esta fase

- Conexión directa con bancos (open banking / agregadores) — queda planteada como Fase 2.
- Facturación electrónica o integración con DIAN.
- Nómina electrónica formal (PILA, seguridad social) — el sistema registra el pago como gasto, no reemplaza el proceso legal de nómina.
- Multi-empresa: el sistema está pensado para una sola cuenta/empresa en esta fase.
- Conciliación bancaria automática.
- Múltiples escenarios de proyección (base/optimista/pesimista), cálculo de capital de trabajo, capex de crecimiento y flujo de caja libre — conceptos relevantes para empresas más grandes o con inventario, no aplican de forma directa al modelo actual de servicios de desarrollo de software.
- Predicción automática de cobros basada en histórico estadístico — fase 1 depende de que el usuario marque manualmente lo recurrente y lo puntual esperado.

---

## 2. Contexto del negocio y problema a resolver

### 2.1 Situación actual

La empresa es una desarrolladora de software con varios clientes activos. El modelo de ingresos combina dos tipos de flujo: pagos por anticipo al iniciar un proyecto (ingreso puntual) y pagos recurrentes mensuales por mantenimiento, soporte o suscripción a un producto. Todo el dinero entra a una única cuenta de ahorros de la empresa, de la cual también salen todos los gastos: pago de sueldo a los founders, gastos operativos del negocio, y gastos relacionados con clientes (por ejemplo, una comida o salida de trabajo con un cliente).

Actualmente este flujo no está categorizado ni documentado en ningún sistema. Esto dificulta responder preguntas básicas pero críticas para la salud financiera del negocio.

### 2.2 Preguntas que el sistema debe poder responder

- ¿Cuánto dinero tiene la empresa disponible hoy?
- ¿Cuánto se ha facturado este mes vs. el mes anterior?
- ¿Cuánto de lo que entra es ingreso recurrente y cuánto es venta puntual de proyecto?
- ¿Cuánto se ha gastado en nómina de founders vs. costos directos vs. gastos operativos del negocio?
- ¿Qué cliente o proyecto es más rentable, una vez se descuenta lo que costó ejecutarlo?
- ¿Hay suficiente caja para cubrir los compromisos fijos del próximo mes?
- ¿Voy a quedarme corto de caja en alguna de las próximas semanas?
- ¿Cuándo vencen mis próximas obligaciones tributarias y tengo cómo cubrirlas?

### 2.3 Por qué un sistema y no una hoja de cálculo

Una hoja de cálculo compartida es frágil: cualquier persona con el enlace puede ver y editar todo, no hay registro de quién cambió qué, y no obliga a categorizar correctamente cada movimiento. El sistema propuesto resuelve esto con control de acceso real, categorías guiadas y un registro de auditoría, sin sacrificar la simplicidad de uso de una hoja de cálculo.

### 2.4 Dos vistas, una sola fuente de datos

El sistema no separa "registro de movimientos" y "flujo de caja" en dos herramientas distintas. Existe una única base de datos de transacciones (sección 10), sobre la cual se construyen dos vistas con propósitos distintos:

| | Registro de transacciones | Flujo de Caja Proyectado |
|---|---|---|
| **Responde** | ¿Qué entró y qué salió? | ¿Qué tan corto o sobrado de caja voy a estar las próximas semanas? |
| **Datos** | 100% reales, ya ocurridos | Mezcla de reales (lo ya registrado) + esperados (lo que el usuario proyecta) |
| **Granularidad** | Por transacción individual | Resumido por semana |
| **Quién lo usa** | Todos (Admin registra, Visor consulta) | Principalmente para decisiones: ¿pago esto ya o espero?, ¿hay plata para cubrir la nómina del mes que viene? |

No se duplica información manualmente: la proyección se alimenta automáticamente de lo ya registrado (ingresos recurrentes conocidos, gastos fijos como nómina) y el usuario solo agrega manualmente los "esperados" que aún no son una transacción real (sección 6).

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

Esta es la pieza central de la experiencia "amigable" del sistema: cada concepto financiero que el usuario vea en pantalla tiene una explicación corta, en español sencillo, visible directamente en el formulario (no en un manual aparte). A continuación se define cada término base y la estructura de categorías que existe en el sistema desde el día uno.

### 4.1 Conceptos base

| Término | Explicación en el sistema |
|---|---|
| **Ingreso** | Cualquier dinero que entra a la cuenta de la empresa. Ejemplo: un cliente te paga el anticipo de un proyecto, o te paga la mensualidad de soporte. |
| **Egreso** | Cualquier dinero que sale de la cuenta de la empresa. Ejemplo: pagas el sueldo de un founder, o pagas el hosting del mes. |
| **Saldo / Caja disponible** | Cuánto dinero hay hoy en la cuenta, después de sumar todos los ingresos y restar todos los egresos registrados. |
| **Categoría madre** | El grupo general al que pertenece un movimiento, por ejemplo "Nómina y carga laboral" o "Ventas operacionales". Sirve para armar reportes resumidos. |
| **Subcategoría** | El detalle específico dentro de una categoría madre, por ejemplo "Sueldo founders" dentro de "Nómina y carga laboral". |
| **Ingreso recurrente** | Dinero que un cliente paga de forma periódica (normalmente cada mes) por un servicio continuo, como soporte, mantenimiento o suscripción a una plataforma. |
| **Caja mínima** | El colchón de liquidez que los founders definen como umbral de seguridad: si el saldo cae por debajo de este número, el sistema avisa (sección 7). |
| **Proyecto / Cliente** | La empresa o persona con la que tienes una relación comercial. Cada transacción puede asociarse a un cliente para saber cuánto entra y cuánto cuesta cada uno. |

### 4.2 Estructura de categorías: Categoría madre + Subcategoría

Las categorías vienen ya creadas en el sistema desde el inicio, organizadas en dos niveles para que los reportes sean tan útiles como simple es el registro diario. En el formulario de transacción, el usuario primero elige la Categoría madre y luego el sistema filtra y muestra solo las Subcategorías correspondientes — cada una con su explicación visible. Un Admin puede agregar Subcategorías nuevas dentro de una Categoría madre existente sin requerir cambios técnicos; crear una Categoría madre nueva sí implica un ajuste porque define comportamiento (qué reporte la agrupa, si pide cliente, etc.).

**Categorías de Ingreso**

| Categoría madre | Subcategorías | ¿Pide Cliente/Proyecto? |
|---|---|---|
| **Ventas operacionales** | Venta de contado · Venta a crédito / recaudo de cartera (incluye anticipo y pago final de un proyecto) | Sí |
| **Ingresos recurrentes** | Suscripción / licencia · Mantenimiento o soporte mensual | Sí |
| **Otros ingresos operativos** | Consultoría o capacitación · Comisiones recibidas | Opcional |
| **Ingresos no operacionales** | Intereses ganados · Devolución de impuestos · Venta de activos (ej. un equipo usado) | No |

**Categorías de Egreso**

| Categoría madre | Subcategorías | ¿Pide Cliente/Proyecto? |
|---|---|---|
| **Costos directos** | Subcontratistas / developers externos por proyecto · Herramientas o licencias compradas específicamente para un proyecto | Sí |
| **Nómina y carga laboral** | Sueldo founders · Prestaciones sociales · Seguridad social y parafiscales | No |
| **Gastos administrativos** | Arriendo de oficina · Servicios públicos / internet · Software y suscripciones internas (no ligadas a un proyecto) · Papelería | No |
| **Gastos comerciales y de marketing** | Publicidad digital (Meta, Google) · Comisiones a vendedores · Viáticos y representación comercial | Opcional |
| **Gasto relacionado a cliente** | Comidas de trabajo · Desplazamientos · Otros gastos puntuales por atender a un cliente | Sí |
| **Deuda y financiamiento** | Pago a capital de préstamo · Intereses de crédito · Comisiones bancarias | No |
| **Impuestos y obligaciones** | IVA · Retención en la fuente · ICA / RETEICA · Renta · Otras tasas | No |
| **Inversión (Capex)** | Equipos de cómputo (laptops, monitores) · Adecuaciones de oficina · Otros activos fijos | No |

**Por qué se incluyen Costos directos, Capex y Deuda desde el inicio**

- **Costos directos:** ya es habitual o previsible subcontratar developers puntuales para un proyecto; separarlo de "Gastos administrativos" permite calcular margen real por proyecto (ingreso del proyecto menos lo que costó ejecutarlo).
- **Inversión (Capex):** la compra de equipos (laptops, monitores) es un gasto real que conviene distinguir de un gasto operativo recurrente, porque no se repite cada mes y puede distorsionar la lectura de "gasto operativo mensual" si se mezcla.
- **Deuda y financiamiento:** se incluye de una vez porque la empresa contempla manejar crédito; separar capital de intereses desde el inicio evita migrar datos históricos más adelante cuando se use por primera vez.

> **Sobre cuentas en Colombia:** El sistema modela el flujo de caja real (lo que efectivamente entra y sale de la cuenta de ahorros), no es un sistema de contabilidad formal bajo NIIF ni reemplaza la contabilidad que lleve el contador de la empresa. Las categorías están pensadas para que, al final del mes, el contador pueda tomar el reporte exportado y clasificarlo fácilmente en el plan de cuentas (PUC) que corresponda para efectos tributarios.

---

## 5. Funcionalidades (Fase 1)

### 5.1 Registro de transacciones

Es la funcionalidad más importante del sistema: debe ser rápida, simple y a prueba de errores.

**Campos del formulario de transacción**

| Campo | Obligatorio | Detalle |
|---|---|---|
| Tipo | Sí | Ingreso o Egreso (selector grande, visual, primero en el formulario) |
| Categoría madre | Sí | Lista de categorías madre según el Tipo elegido (sección 4.2) |
| Subcategoría | Sí | Lista filtrada según la Categoría madre elegida, con tooltip de ayuda |
| Monto | Sí | En pesos colombianos (COP), con formato automático de miles |
| Fecha | Sí | Por defecto la fecha de hoy, editable |
| Cliente/Proyecto | Condicional | Obligatorio, opcional o no aplica según la Categoría madre elegida (ver columna correspondiente en sección 4.2) |
| Descripción | Sí | Texto corto libre, ej. "Anticipo proyecto DORU - mes 1" |
| ¿Se repite? | No | No / Mensual / Quincenal / Semanal. Si se marca, esta transacción alimenta automáticamente las semanas futuras del Flujo de Caja Proyectado (sección 6) con el mismo monto, hasta que se desactive o cambie |
| Método de pago | No | Transferencia, efectivo, otro (campo simple, no crítico en fase 1) |
| Comprobante adjunto | No | Subir foto o PDF del soporte (factura, comprobante de transferencia) |

**Reglas de la experiencia de registro**

- El formulario debe poder completarse en menos de 30 segundos para un caso simple (monto, categoría, fecha, descripción).
- Cada Subcategoría muestra debajo su explicación corta (sección 4.2) para que el usuario confirme que eligió bien.
- Colores consistentes en toda la interfaz: verde para ingresos, rojo para egresos — así se reconoce de un vistazo el tipo de movimiento en cualquier lista o reporte.
- Acceso de registro rápido desde cualquier pantalla (botón flotante "+ Nueva transacción"), pensado para uso desde el celular en el momento que ocurre el gasto.
- Confirmación visual clara al guardar ("Transacción registrada") y posibilidad de deshacer/editar inmediatamente después.
- Ejemplo de uso de "¿Se repite?": la mensualidad de un cliente recurrente se marca "Mensual" una sola vez; a partir de ahí aparece sola en cada semana proyectada. Igual aplica a gastos fijos (nómina, hosting, suscripciones).

### 5.2 Edición y eliminación

- Solo el rol Admin puede editar o eliminar transacciones.
- Eliminar pide confirmación explícita ("¿Seguro que quieres eliminar esta transacción? Quedará registrada en el historial de auditoría").
- Toda edición guarda el valor anterior y el nuevo en el log de auditoría (sección 3.3).

### 5.3 Gestión de clientes / proyectos

- CRUD simple de clientes: nombre, tipo de relación (anticipo único / recurrente / ambos), estado (activo/inactivo).
- Vista de detalle por cliente: total ingresado, total de Costos directos asociados a ese cliente, rentabilidad neta (ingreso menos costos directos), historial de transacciones asociadas.

### 5.4 Dashboard principal

Es la pantalla de inicio. Debe responder de un vistazo las preguntas de la sección 2.2.

- Saldo actual de la cuenta (número grande, visible de inmediato), en rojo si está por debajo de la caja mínima, amarillo si está cerca, verde si está cómodo (sección 7).
- Ingresos del mes actual vs. mes anterior (comparación simple, con flecha de subida/bajada).
- Egresos del mes actual vs. mes anterior.
- Desglose de egresos del mes por Categoría madre: Costos directos, Nómina, Administrativos, Comerciales, Deuda, Impuestos, Capex (gráfico simple tipo dona o barras).
- Top clientes por ingreso del mes / del periodo seleccionado.
- Próximas obligaciones tributarias por vencer (sección 7.2).
- Lista de últimas 10 transacciones, con acceso directo a ver todas.

### 5.5 Reportes e historial

- Listado completo de transacciones con filtros: por tipo, categoría madre, subcategoría, cliente, rango de fechas, usuario que registró.
- Exportar a Excel/CSV el resultado filtrado, con columnas separadas de Tipo, Categoría madre y Subcategoría — facilita que el contador arme tablas dinámicas sin reclasificar manualmente.
- Reporte mensual resumen: total ingresos, total egresos, utilidad neta del mes, comparación con mes anterior, desglose por Categoría madre.

### 5.6 Notificaciones

- Aviso simple (correo o dentro del sistema) si pasan más de X días sin registrar ninguna transacción, como recordatorio de mantener el sistema al día.
- Alerta automática cuando el saldo real cruza por debajo de la caja mínima, y alerta temprana si la proyección muestra que lo va a cruzar en las próximas semanas (sección 7).
- Recordatorio configurable de vencimiento de obligaciones tributarias, por ejemplo 5 días antes de cada fecha (sección 7.2).

---

## 6. Flujo de Caja Proyectado

Mientras el registro de transacciones (sección 5) responde "¿qué pasó?", este módulo responde "¿qué va a pasar?". Es la pieza que convierte el sistema en una herramienta de planeación, no solo de contabilidad histórica.

### 6.1 Cómo funciona

- **Horizonte:** 8 semanas hacia adelante (aprox. 2 meses), suficiente para el tamaño actual del negocio y ajustable más adelante si se requiere mayor horizonte.
- Cada semana muestra: saldo inicial, entradas esperadas, salidas esperadas, saldo final proyectado.
- Las entradas/salidas "esperadas" se completan de dos formas: **automática** (transacciones marcadas "¿Se repite?" en el formulario, sección 5.1) y **manual** (el usuario agrega una fila "esperada" para algo puntual, ej. un anticipo que aún no llega).
- Cuando una transacción "esperada" efectivamente ocurre, el usuario la registra como transacción real (flujo normal de la sección 5) y el sistema la reconcilia automáticamente: la quita de "esperado" y la suma a "real" en esa semana.
- **Semáforo visual** por semana: verde si el saldo proyectado se mantiene sobre la caja mínima (sección 7.1), amarillo si se acerca, rojo si la proyección cae por debajo.

### 6.2 Vista en pantalla

- Tabla/gráfico de barras horizontal con las 8 semanas, saldo proyectado por semana y línea de referencia de la caja mínima.
- Toggle simple: "Solo real" / "Real + proyectado", para que el usuario pueda ver el dato puro o la proyección completa según necesite.
- Pensado para revisión semanal corta (ej. cada lunes), no para uso diario — a diferencia del registro de transacciones que sí es de uso diario.

### 6.3 Qué no incluye esta versión

- Múltiples escenarios (base/optimista/pesimista) — se evalúa más adelante si el negocio lo amerita.
- Variación de capital de trabajo, capex de crecimiento, flujo de caja libre — conceptos relevantes para empresas más grandes o con inventario; no aplican de forma directa al modelo actual de servicios de desarrollo de software.
- Proyección automática basada en históricos/estadística — fase 1 depende de que el usuario marque manualmente lo recurrente y lo puntual esperado.

---

## 7. Caja mínima y calendario tributario

### 7.1 Caja mínima configurable

Un colchón de liquidez explícito: un número que el founder define y que el sistema usa de referencia en todas las vistas relevantes (dashboard, proyección, notificaciones).

- Un Admin define la **Caja Mínima** desde una pantalla de configuración: un solo campo numérico en COP.
- Recomendación visible en pantalla (a modo de ayuda "para dummies", no como cálculo automático): un colchón sano suele equivaler a varios meses de gastos fijos (nómina + operativos); el sistema sugiere el cálculo pero el founder decide y escribe el número final.
- El valor es editable en cualquier momento; cada cambio queda en el log de auditoría (sección 3.3), igual que cualquier otro dato sensible del sistema.

**Dónde se usa este número**

| Vista | Cómo se usa la caja mínima ahí |
|---|---|
| Dashboard principal | El saldo actual se muestra en rojo si está por debajo de la caja mínima, en amarillo si está cerca (ej. menos del 20% de margen sobre el mínimo), en verde si está cómodo |
| Flujo de Caja Proyectado (sección 6) | Línea de referencia visible en el gráfico de las 8 semanas; semáforo por semana según si el saldo proyectado cruza ese límite |
| Notificaciones | Alerta automática (correo o dentro del sistema) en el momento en que el saldo real cruza por debajo del mínimo, y alerta temprana si la proyección muestra que lo va a cruzar en las próximas semanas |

### 7.2 Calendario tributario básico

Los impuestos y obligaciones laborales generan picos de salida de efectivo predecibles pero fáciles de pasar por alto si no quedan visibles en el mismo lugar donde se gestiona la caja. Es un calendario simple, **no** un módulo de liquidación de impuestos (eso lo sigue haciendo el contador).

- Lista de obligaciones recurrentes con su fecha de vencimiento, visible en el dashboard y en la vista de proyección.
- Recordatorio (correo o aviso dentro del sistema) configurable: por ejemplo, avisar 5 días antes de cada vencimiento.
- Cada obligación, al marcarse como "pagada", se asocia o convierte directamente en una transacción de egreso (categoría madre "Impuestos y obligaciones", sección 4.2), evitando doble digitación.
- El monto exacto de cada impuesto **no** lo calcula el sistema (eso depende de la liquidación real que haga el contador); el sistema solo recuerda la fecha y, si el usuario quiere, permite dejar un estimado para que aparezca en la proyección de caja.

**Obligaciones incluidas por defecto**

Lista inicial, editable por un Admin (fechas exactas varían según el calendario tributario del año y el último dígito del NIT; el sistema solo trae la estructura, no calcula fechas específicas por DIAN automáticamente en esta fase):

| Obligación | Periodicidad típica | Nota |
|---|---|---|
| IVA | Bimestral o cuatrimestral según responsable | Aplica si la empresa es responsable de IVA |
| Retención en la fuente | Mensual | Sobre pagos a proveedores/contratistas, si aplica |
| ICA / RETEICA | Según municipio (a menudo bimestral) | Relevante dado que la empresa también trabaja con Péntica, especializado en este tributo |
| Seguridad social y parafiscales | Mensual | Si hay nómina formal además del pago directo a founders |
| Renta | Anual | Fecha según calendario DIAN del año correspondiente |

> **Importante:** Este calendario es una ayuda de memoria y de planeación de caja, no asesoría tributaria ni reemplazo del contador. Las fechas exactas, tarifas y si la empresa es o no responsable de cada tributo debe confirmarlas el contador o revisor fiscal; el sistema solo centraliza el recordatorio una vez esa información se conoce.

---

## 8. Experiencia de usuario y diseño

### 8.1 Principios de diseño

- **Para dummies:** ningún término financiero aparece sin una explicación accesible (tooltip, texto de ayuda bajo el campo, o ejemplo).
- **Mobile-first:** la mayoría de registros van a ocurrir desde el celular en el momento del gasto; el diseño se piensa primero para pantalla pequeña y luego se adapta a escritorio.
- **Responsive total:** debe verse y funcionar bien en celular, tablet (iPad) y computador, sin apps nativas — un sitio web responsivo es suficiente y más fácil de mantener.
- **Onboarding ligero:** la primera vez que un usuario entra, un recorrido corto (3-4 pantallas) explica qué es un ingreso, qué es un egreso, y cómo registrar su primera transacción.
- **Cero jerga contable en pantalla:** se usa lenguaje cotidiano ("dinero que entra" en vez de "flujo de entrada"), reservando los términos técnicos para los reportes exportables que ve el contador.

### 8.2 Acceso multiplataforma

El sistema se construye como una aplicación web responsiva (no apps nativas separadas para iOS/Android). Esto permite cumplir el requerimiento de "abrir en el celular, el computador y el iPad" con un solo desarrollo, manteniendo todo simple de mantener.

- Se puede "instalar" como acceso directo en la pantalla de inicio del celular (tipo PWA - Progressive Web App), para que se sienta como una app sin serlo técnicamente.
- Mismo usuario y los mismos datos en todos los dispositivos, en tiempo real.

---

## 9. Consideraciones técnicas (propuesta de stack)

Se propone un stack alineado con las herramientas que ya usas habitualmente, priorizando velocidad de implementación, bajo mantenimiento y costo mínimo en una fase inicial.

| Componente | Herramienta propuesta | Por qué |
|---|---|---|
| Frontend + hosting | Next.js, desplegado en Vercel | Es lo que ya usas; despliegue inmediato, gratis para este nivel de uso, responsive nativo |
| Base de datos | Neon (Postgres serverless) | Ya la usas; relacional, ideal para transacciones financieras donde la integridad de datos importa |
| Backend / lógica | API routes de Next.js (o un backend en Python si se requiere lógica más compleja a futuro) | Evita mantener un servidor aparte en fase 1; Render queda disponible si luego se necesita un servicio Python independiente (ej. para la futura integración bancaria) |
| Autenticación | Auth.js (NextAuth) o Clerk | Maneja invitaciones, sesiones por dispositivo y roles sin construir un sistema de login desde cero |
| Almacenamiento de comprobantes | Vercel Blob o equivalente | Para guardar fotos/PDF de soportes adjuntos a cada transacción |

> **Por qué Postgres y no una hoja de cálculo o NoSQL:** El dinero exige integridad de datos: que un monto nunca quede mal escrito, que dos transacciones no se pisen, y que se puedan hacer sumas y reportes confiables. Postgres (vía Neon) es el estándar para este tipo de sistemas y permite, a futuro, conectarlo fácilmente a herramientas de BI o a la integración bancaria sin rediseñar la base de datos.

### 9.1 Seguridad de los datos financieros

- Toda comunicación cifrada (HTTPS).
- Contraseñas nunca almacenadas en texto plano (hash con bcrypt o similar, estándar de las librerías de auth recomendadas).
- Backups automáticos diarios de la base de datos (Neon los ofrece de forma nativa).
- Variables sensibles (claves de API, credenciales) fuera del código, en variables de entorno de Vercel.
- Control de acceso a nivel de base de datos: ningún Visor puede, ni siquiera por error de interfaz, ejecutar una acción de escritura — la restricción se valida también en el backend, no solo se oculta en el frontend.

---

## 10. Modelo de datos (alto nivel)

Estructura conceptual de las tablas principales que soportará el sistema. El detalle exacto de columnas se ajusta en la fase de implementación, pero esta es la base.

| Tabla | Contenido principal |
|---|---|
| `usuarios` | Nombre, correo, contraseña (hash), rol (admin/visor), fecha de creación, estado (activo/inactivo) |
| `clientes_proyectos` | Nombre del cliente, tipo de relación (anticipo/recurrente/ambos), estado, fecha de creación |
| `categorias` | Nombre, tipo (ingreso/egreso), descripción "para dummies", activa/inactiva, `categoria_madre_id` (referencia a sí misma — vacío si es Categoría madre, con valor si es Subcategoría) |
| `transacciones` | Tipo, categoría (referencia a la Subcategoría), monto, fecha, cliente/proyecto (opcional), descripción, método de pago, comprobante adjunto, usuario que la creó, fecha de creación, estado (activa/eliminada), `es_recurrente` (sí/no), `frecuencia` (mensual/quincenal/semanal), `es_proyectada` (sí/no — diferencia una fila "esperada" de una transacción real) |
| `obligaciones_tributarias` | Nombre de la obligación, periodicidad, fecha de próximo vencimiento, días de anticipación del recordatorio, estado (pendiente/pagada), transacción asociada (cuando se marca como pagada) |
| `configuracion` | Caja mínima (COP), horizonte de proyección en semanas, y otros parámetros configurables que surjan más adelante |
| `log_auditoria` | Usuario, acción (login, crear, editar, eliminar, invitar), fecha y hora, detalle de la acción, valores anteriores/nuevos cuando aplica |

---

## 11. Roadmap por fases

### 11.1 Fase 1 — Registro, proyección y categorización (MVP, alcance de este PRD)

- Autenticación cerrada con roles Admin/Visor y log de auditoría completo.
- Registro manual de ingresos y egresos con categorías a dos niveles (Categoría madre + Subcategoría).
- Asociación a clientes/proyectos, con rentabilidad por cliente considerando Costos directos.
- Dashboard con saldo, comparativos mensuales, desglose de gastos por Categoría madre y próximas obligaciones tributarias.
- Flujo de Caja Proyectado a 8 semanas, alimentado de transacciones recurrentes y entradas manuales esperadas.
- Calendario tributario básico con recordatorios.
- Caja mínima configurable, con alertas en dashboard, proyección y notificaciones.
- Historial filtrable, exportable a Excel/CSV.
- Diseño responsive (celular, tablet, computador).

### 11.2 Fase 2 — Automatización bancaria

- Conexión con la cuenta de ahorros vía agregador de open banking disponible en Colombia (a evaluar: Belvo u otros proveedores activos en el país al momento de implementar).
- Importación automática de movimientos bancarios, con sugerencia automática de categoría basada en el histórico.
- Conciliación: cruce entre lo registrado manualmente (si quedó algo pendiente) y lo que reporta el banco.
- El registro manual no desaparece: sigue existiendo para gastos en efectivo o casos donde la automatización falle.

### 11.3 Fase 3 — Planeación financiera avanzada (futuro)

- Múltiples escenarios de proyección (base/optimista/pesimista).
- Alertas de riesgo de caja con mayor antelación y mayor horizonte de proyección.
- Reportes de rentabilidad por cliente más sofisticados (margen, costo de adquisición, etc.).
- Variación de capital de trabajo, capex de crecimiento y flujo de caja libre, si el tamaño del negocio lo amerita.

---

## 12. Riesgos y consideraciones

| Riesgo | Mitigación | Severidad |
|---|---|---|
| Que el equipo no registre las transacciones de forma consistente | Formulario rápido (menos de 30 segundos), recordatorios automáticos, acceso fácil desde el celular | Alta |
| Categorización incorrecta por desconocimiento financiero | Glosario visible en cada formulario, categorías predefinidas con ejemplos a dos niveles, no categorías libres en fase 1 | Media |
| Pérdida o filtración de datos financieros sensibles | Acceso cerrado por invitación, roles diferenciados, HTTPS, backups automáticos en Neon | Alta |
| El sistema no refleje la realidad bancaria por error humano | Campo de comprobante adjunto opcional, posibilidad de exportar y conciliar manualmente cada mes mientras no exista la integración bancaria | Media |
| La proyección de caja se vuelva poco confiable si no se marcan bien las transacciones recurrentes | Campo "¿Se repite?" simple y visible en el formulario; revisión semanal sugerida de la proyección para detectar desajustes a tiempo | Media |

---

## 13. Métricas de éxito

Cómo se sabrá que el sistema está cumpliendo su propósito, una vez en uso:

- 100% de las transacciones de la cuenta de la empresa quedan registradas en el sistema (sin movimientos "fantasma" fuera de él).
- Tiempo promedio de registro de una transacción por debajo de 30-45 segundos.
- Cero transacciones sin categoría/subcategoría o sin cliente asociado cuando corresponde.
- El reporte mensual exportado es suficiente para el contador sin necesidad de pedir aclaraciones adicionales.
- Los founders consultan el dashboard y la proyección de forma habitual (no solo cuando hay un problema) para tomar decisiones.
- Ninguna obligación tributaria se paga tarde por falta de visibilidad de la fecha de vencimiento.

---

## 14. Próximos pasos sugeridos

1. Validar este PRD entre los founders: confirmar roles (quién es Admin, quién es Visor) y ajustar Subcategorías si falta alguna específica del negocio.
2. Definir el set inicial de clientes/proyectos a cargar en el sistema desde el día uno.
3. Definir el valor inicial de la Caja Mínima junto con los founders.
4. Implementar la Fase 1 sobre el stack propuesto (Next.js + Vercel + Neon).
5. Cargar manualmente el histórico reciente (último mes o dos) para que el dashboard y la proyección tengan datos comparativos desde el lanzamiento.
6. Definir con el contador de la empresa el formato exacto de exportación que más le facilite su trabajo, y confirmar las obligaciones tributarias y periodicidades reales aplicables a la empresa.
7. Evaluar proveedores de open banking en Colombia cuando se aborde la Fase 2.

---

*Fin del documento*
