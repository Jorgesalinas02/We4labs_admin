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
        nombre: "Venta de contado",
        descripcion: "Pago inmediato de un cliente por un proyecto o servicio entregado.",
      },
      {
        nombre: "Venta a crédito / recaudo de cartera",
        descripcion:
          "Incluye anticipo y pago final de un proyecto, o el cobro de una factura pendiente.",
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
        nombre: "Comisiones recibidas",
        descripcion: "Comisiones que la empresa cobra por referir o intermediar.",
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
        nombre: "Subcontratistas / developers externos por proyecto",
        descripcion: "Pago a alguien externo contratado para ejecutar un proyecto específico.",
      },
      {
        nombre: "Herramientas o licencias para un proyecto",
        descripcion: "Software o licencias compradas específicamente para un proyecto de un cliente.",
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
      {
        nombre: "Servicios públicos / internet",
        descripcion: "Luz, agua, internet y telefonía de la oficina.",
      },
      {
        nombre: "Software y suscripciones internas",
        descripcion: "Herramientas del negocio NO ligadas a un proyecto puntual (ej. Notion, Google Workspace).",
      },
      { nombre: "Papelería", descripcion: "Útiles y materiales de oficina." },
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
        nombre: "Comisiones bancarias",
        descripcion: "Cobros del banco: cuotas de manejo, transferencias, etc.",
      },
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
      {
        nombre: "Adecuaciones de oficina",
        descripcion: "Mejoras o mobiliario del espacio de trabajo.",
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
