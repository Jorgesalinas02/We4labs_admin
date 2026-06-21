import type { SemanaProyectada } from "@/lib/proyeccion";

export function AreaSaldo({
  semanas,
  cajaMinima,
}: {
  semanas: SemanaProyectada[];
  cajaMinima: number;
}) {
  const W = 380;
  const H = 150;
  const padX = 8;
  const padTop = 12;
  const padBottom = 22;
  const chartH = H - padTop - padBottom;
  const chartW = W - padX * 2;

  const valores = semanas.map((s) => s.saldoFinalProyectado);
  const yMin = Math.min(0, cajaMinima, ...valores);
  const yMax = Math.max(1, cajaMinima, ...valores);
  const span = yMax - yMin || 1;

  const x = (i: number) =>
    padX + (semanas.length <= 1 ? chartW / 2 : (i / (semanas.length - 1)) * chartW);
  const y = (v: number) => padTop + (1 - (v - yMin) / span) * chartH;

  const linea = valores.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${linea} L ${x(valores.length - 1)} ${padTop + chartH} L ${x(0)} ${padTop + chartH} Z`;
  const yMinLine = cajaMinima > 0 ? y(cajaMinima) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <defs>
        <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ingreso)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--ingreso)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gradSaldo)" />
      <path d={linea} fill="none" stroke="var(--ingreso)" strokeWidth="2.5" strokeLinejoin="round" />
      {valores.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="var(--ingreso)" />
      ))}
      {yMinLine !== null && (
        <line
          x1={padX}
          x2={W - padX}
          y1={yMinLine}
          y2={yMinLine}
          stroke="var(--egreso)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.7"
        />
      )}
      {semanas.map((s, i) =>
        i % 2 === 0 ? (
          <text
            key={s.inicio}
            x={x(i)}
            y={H - 7}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {s.etiqueta}
          </text>
        ) : null,
      )}
    </svg>
  );
}
