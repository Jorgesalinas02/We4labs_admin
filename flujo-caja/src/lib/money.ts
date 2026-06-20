// Utilidades de dinero. Regla de oro: el dinero se maneja como string/Decimal,
// nunca como float, para evitar errores de redondeo.

export type Moneda = "COP" | "USD";

const formatters: Record<Moneda, Intl.NumberFormat> = {
  COP: new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }),
};

/** Formatea un monto (string o number) en la moneda dada. */
export function formatMoneda(monto: string | number, moneda: Moneda = "COP"): string {
  const valor = typeof monto === "string" ? Number(monto) : monto;
  if (Number.isNaN(valor)) return formatters[moneda].format(0);
  return formatters[moneda].format(valor);
}

/** Calcula el monto normalizado en COP a partir del monto original y la tasa. */
export function calcularMontoCop(
  montoOriginal: number,
  moneda: Moneda,
  tasaCambio: number,
): number {
  if (moneda === "COP") return redondear2(montoOriginal);
  return redondear2(montoOriginal * tasaCambio);
}

/** Redondea a 2 decimales de forma estable. */
export function redondear2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Parsea un string de entrada del usuario ("1.500.000" o "1500000.50") a número. */
export function parseMonto(input: string): number {
  if (!input) return NaN;
  // Quita separadores de miles (puntos) si hay coma decimal; normaliza coma a punto.
  const limpio = input.trim().replace(/\s/g, "");
  if (limpio.includes(",")) {
    return Number(limpio.replace(/\./g, "").replace(",", "."));
  }
  return Number(limpio);
}
