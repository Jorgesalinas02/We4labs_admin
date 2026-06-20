import { toZonedTime } from "date-fns-tz";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

// Zona horaria fija del negocio. Los cortes de mes se calculan en Bogotá
// para que los comparativos "mes actual vs anterior" sean correctos.
export const ZONA_HORARIA = "America/Bogota";

export interface RangoFechas {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

// Devuelve un Date cuyos campos locales representan la hora de pared en Bogotá.
function ahoraEnBogota(): Date {
  return toZonedTime(new Date(), ZONA_HORARIA);
}

function aISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Rango [primer día, último día] del mes actual en Bogotá. */
export function rangoMesActual(): RangoFechas {
  const ahora = ahoraEnBogota();
  return {
    desde: aISODate(startOfMonth(ahora)),
    hasta: aISODate(endOfMonth(ahora)),
  };
}

/** Rango del mes anterior en Bogotá. */
export function rangoMesAnterior(): RangoFechas {
  const mesAnterior = subMonths(ahoraEnBogota(), 1);
  return {
    desde: aISODate(startOfMonth(mesAnterior)),
    hasta: aISODate(endOfMonth(mesAnterior)),
  };
}

/** Fecha de hoy en formato YYYY-MM-DD según Bogotá (default del formulario). */
export function hoyISO(): string {
  return aISODate(ahoraEnBogota());
}

/** Etiqueta legible de mes, ej. "junio 2026". */
export function etiquetaMes(offset = 0): string {
  const d = subMonths(ahoraEnBogota(), offset);
  return format(d, "MMMM yyyy");
}
