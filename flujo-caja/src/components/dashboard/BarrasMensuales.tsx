import type { PuntoMensual } from "@/lib/queries";

export function BarrasMensuales({ datos }: { datos: PuntoMensual[] }) {
  const W = 360;
  const H = 180;
  const padX = 10;
  const padTop = 14;
  const padBottom = 26;
  const chartH = H - padTop - padBottom;
  const max = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.egresos]));
  const n = Math.max(1, datos.length);
  const groupW = (W - padX * 2) / n;
  const barW = Math.min(16, groupW * 0.3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {/* gridlines */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={padX}
          x2={W - padX}
          y1={padTop + chartH * (1 - g)}
          y2={padTop + chartH * (1 - g)}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}
      {datos.map((d, i) => {
        const cx = padX + i * groupW + groupW / 2;
        const hi = (d.ingresos / max) * chartH;
        const he = (d.egresos / max) * chartH;
        return (
          <g key={d.ym}>
            <rect
              x={cx - barW - 2}
              y={padTop + chartH - hi}
              width={barW}
              height={Math.max(hi, 0)}
              rx="3"
              fill="var(--ingreso)"
            />
            <rect
              x={cx + 2}
              y={padTop + chartH - he}
              width={barW}
              height={Math.max(he, 0)}
              rx="3"
              fill="var(--egreso)"
              opacity="0.85"
            />
            <text
              x={cx}
              y={H - 9}
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted)"
              className="capitalize"
            >
              {d.etiqueta}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
