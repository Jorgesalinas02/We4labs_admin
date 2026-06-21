// Estructura de categorías a dos niveles (sección 4.2 del PRD v2).
// Cada madre define si pide cliente; sus subcategorías lo heredan.

type PideCliente = "si" | "opcional" | "no";
type Periodicidad = "mensual" | "bimestral" | "cuatrimestral" | "anual" | "otra";

export interface SubcategoriaSeed {
  nombre: string;
  descripcion: string;
}

export interface MadreSeed {
  nombre: string;
  tipo: "ingreso" | "egreso";
  pideCliente: PideCliente;
  esCostoDirecto?: boolean;
  subs: SubcategoriaSeed[];
}

export const categoriasMadre: MadreSeed[] = [
  // ===================== INGRESOS =====================
  {
    nombre: "Ventas operacionales",
    tipo: "ingreso",
    pideCliente: "si",
    subs: [
      {
        nombre: "Anticipo de proyecto",
        descripcion: "Pago inicial del cliente al arrancar un proyecto (ej. el 50%).",
      },
      {
        nombre: "Pago por hito / avance",
        descripcion: "Pago al cumplir una etapa o entregable acordado del proyecto.",
      },
      {
        nombre: "Pago final / entrega",
        descripcion: "Pago al entregar el proyecto terminado.",
      },
      {
        nombre: "Venta de contado",
        descripcion: "Pago inmediato de un cliente por un servicio o producto entregado.",
      },
      {
        nombre: "Recaudo de cartera (venta a crédito)",
        descripcion: "Cobro de una factura pendiente que se había facturado antes.",
      },
      {
        nombre: "Venta de producto propio / SaaS",
        descripcion: "Venta de una plataforma o producto propio de la empresa.",
      },
    ],
  },
  {
    nombre: "Ingresos recurrentes",
    tipo: "ingreso",
    pideCliente: "si",
    subs: [
      {
        nombre: "Suscripción / licencia",
        descripcion: "Pago periódico de un cliente por usar una plataforma o licencia.",
      },
      {
        nombre: "Mantenimiento o soporte mensual",
        descripcion: "Mensualidad por soporte, mantenimiento o servicio continuo.",
      },
      {
        nombre: "Retainer mensual (horas fijas)",
        descripcion: "Cliente que paga un bloque fijo de horas o disponibilidad cada mes.",
      },
      {
        nombre: "Hosting / infraestructura facturada",
        descripcion: "Hosting o nube que le cobras al cliente (normalmente con margen).",
      },
      {
        nombre: "Renovación anual",
        descripcion: "Pago anual de una licencia, dominio o servicio recurrente.",
      },
    ],
  },
  {
    nombre: "Otros ingresos operativos",
    tipo: "ingreso",
    pideCliente: "opcional",
    subs: [
      {
        nombre: "Consultoría o capacitación",
        descripcion: "Honorarios por asesorar o capacitar, fuera de un proyecto de desarrollo.",
      },
      {
        nombre: "Auditoría técnica / code review",
        descripcion: "Honorarios por revisar o auditar el código o la arquitectura de un tercero.",
      },
      {
        nombre: "Comisiones recibidas",
        descripcion: "Comisiones que la empresa cobra por referir o intermediar.",
      },
      {
        nombre: "Referidos / partnerships",
        descripcion: "Ingreso por alianzas o por referir clientes a un socio.",
      },
    ],
  },
  {
    nombre: "Ingresos no operacionales",
    tipo: "ingreso",
    pideCliente: "no",
    subs: [
      {
        nombre: "Intereses ganados",
        descripcion: "Rendimientos de la cuenta o de inversiones.",
      },
      {
        nombre: "Devolución de impuestos",
        descripcion: "Dinero que la DIAN u otra entidad devuelve por impuestos.",
      },
      {
        nombre: "Venta de activos",
        descripcion: "Venta de un equipo usado u otro activo de la empresa.",
      },
      {
        nombre: "Reembolso de proveedor",
        descripcion: "Dinero que un proveedor te devuelve por un cobro o servicio.",
      },
      {
        nombre: "Aporte de socios / capital",
        descripcion: "Capital que un founder o socio inyecta a la empresa.",
      },
      {
        nombre: "Diferencia en cambio (ganancia)",
        descripcion: "Ganancia por la variación del dólar entre el cobro y el registro.",
      },
    ],
  },
  // ===================== EGRESOS =====================
  {
    nombre: "Costos directos",
    tipo: "egreso",
    pideCliente: "si",
    esCostoDirecto: true,
    subs: [
      {
        nombre: "Subcontratistas / developers externos",
        descripcion: "Pago a un developer externo contratado para ejecutar un proyecto específico.",
      },
      {
        nombre: "Diseñador UI/UX freelance",
        descripcion: "Diseñador externo contratado para un proyecto de un cliente.",
      },
      {
        nombre: "QA / tester externo",
        descripcion: "Pruebas de calidad contratadas para un proyecto puntual.",
      },
      {
        nombre: "Infraestructura cloud del proyecto",
        descripcion: "AWS, GCP, Vercel u otra nube usada para el proyecto de un cliente.",
      },
      {
        nombre: "APIs / servicios de terceros del proyecto",
        descripcion: "APIs de pago (ej. pasarela, OpenAI) usadas dentro del proyecto del cliente.",
      },
      {
        nombre: "Licencias o assets para un proyecto",
        descripcion: "Software, plantillas o recursos comprados específicamente para un proyecto.",
      },
    ],
  },
  {
    nombre: "Nómina y carga laboral",
    tipo: "egreso",
    pideCliente: "no",
    subs: [
      {
        nombre: "Sueldo founders",
        descripcion: "Pago de sueldo a cualquiera de los founders por su trabajo.",
      },
      {
        nombre: "Salario empleados",
        descripcion: "Sueldo de empleados de planta que no son founders.",
      },
      {
        nombre: "Honorarios contratistas",
        descripcion: "Pago a personas por prestación de servicios (sin vínculo laboral).",
      },
      {
        nombre: "Bonificaciones / comisiones del equipo",
        descripcion: "Bonos o comisiones variables pagadas al equipo.",
      },
      {
        nombre: "Prestaciones sociales",
        descripcion: "Cesantías, primas, vacaciones y demás prestaciones de ley.",
      },
      {
        nombre: "Seguridad social y parafiscales",
        descripcion: "Aportes a salud, pensión, ARL y parafiscales.",
      },
    ],
  },
  {
    nombre: "Gastos administrativos",
    tipo: "egreso",
    pideCliente: "no",
    subs: [
      { nombre: "Arriendo de oficina", descripcion: "Pago mensual del lugar de trabajo." },
      { nombre: "Coworking", descripcion: "Pago de un espacio de trabajo compartido." },
      {
        nombre: "Servicios públicos / internet",
        descripcion: "Luz, agua, internet y telefonía de la oficina.",
      },
      {
        nombre: "Software y suscripciones internas",
        descripcion: "Herramientas del negocio NO ligadas a un proyecto (ej. Notion, Google Workspace).",
      },
      {
        nombre: "Contador / honorarios contables",
        descripcion: "Pago al contador o revisor fiscal.",
      },
      {
        nombre: "Servicios legales",
        descripcion: "Abogado, trámites, constitución y temas legales.",
      },
      { nombre: "Papelería", descripcion: "Útiles y materiales de oficina." },
      { nombre: "Aseo y cafetería", descripcion: "Insumos de aseo, café y cafetería de la oficina." },
    ],
  },
  {
    nombre: "Gastos comerciales y de marketing",
    tipo: "egreso",
    pideCliente: "opcional",
    subs: [
      {
        nombre: "Publicidad digital (Meta, Google)",
        descripcion: "Pauta y anuncios en redes y buscadores.",
      },
      {
        nombre: "Diseño de marca / contenido",
        descripcion: "Branding, diseño gráfico y contenido para redes.",
      },
      {
        nombre: "Herramientas de marketing (CRM, email)",
        descripcion: "CRM, mailing y demás herramientas comerciales.",
      },
      {
        nombre: "Eventos / ferias / networking",
        descripcion: "Asistencia a eventos para conseguir clientes o visibilidad.",
      },
      {
        nombre: "Comisiones a vendedores",
        descripcion: "Pago variable a quien cierra ventas.",
      },
      {
        nombre: "Viáticos y representación comercial",
        descripcion: "Gastos de viaje o atención con fin comercial.",
      },
    ],
  },
  {
    nombre: "Gasto relacionado a cliente",
    tipo: "egreso",
    pideCliente: "si",
    subs: [
      { nombre: "Comidas de trabajo", descripcion: "Almuerzos o reuniones con un cliente." },
      { nombre: "Desplazamientos", descripcion: "Transporte para atender a un cliente." },
      {
        nombre: "Hospedaje por visita a cliente",
        descripcion: "Hotel o alojamiento para visitar a un cliente.",
      },
      {
        nombre: "Detalles / regalos a clientes",
        descripcion: "Obsequios o atenciones a un cliente.",
      },
      {
        nombre: "Otros gastos por atender a un cliente",
        descripcion: "Cualquier gasto puntual ligado a un cliente específico.",
      },
    ],
  },
  {
    nombre: "Deuda y financiamiento",
    tipo: "egreso",
    pideCliente: "no",
    subs: [
      {
        nombre: "Pago a capital de préstamo",
        descripcion: "Abono que reduce el saldo del crédito (sin intereses).",
      },
      { nombre: "Intereses de crédito", descripcion: "Costo financiero del préstamo." },
      {
        nombre: "Cuota de tarjeta de crédito",
        descripcion: "Pago de la cuota o el cupo usado de la tarjeta de crédito.",
      },
      {
        nombre: "Comisiones bancarias",
        descripcion: "Cobros del banco: cuotas de manejo, transferencias, etc.",
      },
      {
        nombre: "Gravamen 4x1000 (GMF)",
        descripcion: "Impuesto a los movimientos financieros que cobra el banco.",
      },
      { nombre: "Intereses de mora", descripcion: "Recargo por pagar tarde una deuda u obligación." },
    ],
  },
  {
    nombre: "Impuestos y obligaciones",
    tipo: "egreso",
    pideCliente: "no",
    subs: [
      { nombre: "IVA", descripcion: "Impuesto al valor agregado a pagar a la DIAN." },
      {
        nombre: "Retención en la fuente",
        descripcion: "Retefuente sobre pagos a proveedores o contratistas.",
      },
      { nombre: "ICA / RETEICA", descripcion: "Impuesto de industria y comercio municipal." },
      { nombre: "Renta", descripcion: "Impuesto de renta anual." },
      {
        nombre: "Cámara de comercio (renovación)",
        descripcion: "Renovación anual de la matrícula mercantil.",
      },
      { nombre: "Otras tasas", descripcion: "Otros tributos o tasas oficiales." },
    ],
  },
  {
    nombre: "Inversión (Capex)",
    tipo: "egreso",
    pideCliente: "no",
    subs: [
      {
        nombre: "Equipos de cómputo",
        descripcion: "Laptops, monitores y demás equipo que dura varios años.",
      },
      { nombre: "Mobiliario", descripcion: "Escritorios, sillas y muebles de oficina." },
      {
        nombre: "Adecuaciones de oficina",
        descripcion: "Mejoras físicas del espacio de trabajo.",
      },
      {
        nombre: "Software con licencia perpetua",
        descripcion: "Licencias que se compran una sola vez (no son mensuales).",
      },
      { nombre: "Otros activos fijos", descripcion: "Otros bienes duraderos de la empresa." },
    ],
  },
];

// Obligaciones tributarias por defecto (sección 7.2). Sin fechas: el Admin las
// define según el calendario DIAN y el NIT de la empresa.
export interface ObligacionSeed {
  nombre: string;
  periodicidad: Periodicidad;
  nota: string;
}

export const obligacionesPredefinidas: ObligacionSeed[] = [
  {
    nombre: "IVA",
    periodicidad: "bimestral",
    nota: "Bimestral o cuatrimestral según responsable. Aplica si la empresa es responsable de IVA.",
  },
  {
    nombre: "Retención en la fuente",
    periodicidad: "mensual",
    nota: "Sobre pagos a proveedores/contratistas, si aplica.",
  },
  {
    nombre: "ICA / RETEICA",
    periodicidad: "bimestral",
    nota: "Según el municipio (a menudo bimestral).",
  },
  {
    nombre: "Seguridad social y parafiscales",
    periodicidad: "mensual",
    nota: "Si hay nómina formal además del pago directo a founders.",
  },
  {
    nombre: "Renta",
    periodicidad: "anual",
    nota: "Fecha según calendario DIAN del año correspondiente.",
  },
];
