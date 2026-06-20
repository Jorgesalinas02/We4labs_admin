// Categorías predefinidas (Fase 1), con su explicación "para dummies" y el
// grupo de gasto que usa el dashboard. Tomadas de la sección 4.2 del PRD.

type GrupoGasto =
  | "nomina"
  | "operativo"
  | "cliente"
  | "admin"
  | "marketing"
  | "otro"
  | "na";

export interface CategoriaSeed {
  nombre: string;
  tipo: "ingreso" | "egreso";
  grupoGasto: GrupoGasto;
  descripcionDummies: string;
}

export const categoriasPredefinidas: CategoriaSeed[] = [
  // ---- Ingresos ----
  {
    nombre: "Anticipo de proyecto",
    tipo: "ingreso",
    grupoGasto: "na",
    descripcionDummies:
      "Pago inicial de un cliente al arrancar un proyecto nuevo, antes de entregar el trabajo completo.",
  },
  {
    nombre: "Pago final / hito de proyecto",
    tipo: "ingreso",
    grupoGasto: "na",
    descripcionDummies:
      "Pago al entregar el proyecto o al cumplir un hito acordado.",
  },
  {
    nombre: "Ingreso recurrente (mensualidad)",
    tipo: "ingreso",
    grupoGasto: "na",
    descripcionDummies:
      "Pago periódico de un cliente por soporte, mantenimiento o suscripción.",
  },
  {
    nombre: "Otro ingreso",
    tipo: "ingreso",
    grupoGasto: "na",
    descripcionDummies:
      "Cualquier ingreso que no encaje en las anteriores (ej. rendimientos financieros, devoluciones).",
  },
  // ---- Egresos ----
  {
    nombre: "Nómina founders",
    tipo: "egreso",
    grupoGasto: "nomina",
    descripcionDummies:
      "Pago de sueldo a cualquiera de los founders. Es pago a una persona del equipo, no a un proveedor.",
  },
  {
    nombre: "Gasto operativo (herramientas/software)",
    tipo: "egreso",
    grupoGasto: "operativo",
    descripcionDummies:
      "Hosting, dominios, suscripciones de software, licencias. Mantiene el negocio funcionando.",
  },
  {
    nombre: "Gasto relacionado a cliente",
    tipo: "egreso",
    grupoGasto: "cliente",
    descripcionDummies:
      "Comidas, desplazamientos o actividades ligadas a un cliente puntual. Se asocia al cliente.",
  },
  {
    nombre: "Gasto administrativo/legal",
    tipo: "egreso",
    grupoGasto: "admin",
    descripcionDummies:
      "Contador, trámites, comisiones bancarias, impuestos.",
  },
  {
    nombre: "Marketing y ventas",
    tipo: "egreso",
    grupoGasto: "marketing",
    descripcionDummies: "Publicidad, materiales comerciales, eventos.",
  },
  {
    nombre: "Otro egreso",
    tipo: "egreso",
    grupoGasto: "otro",
    descripcionDummies: "Cualquier gasto que no encaje en las anteriores.",
  },
];
