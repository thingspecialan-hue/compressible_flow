import React, { useMemo, useState } from 'react';
import {
  AirfoilVertices,
  SweepPoint,
  generateParametricSweep,
} from '../lib/shockExpansion';

interface ParametricChartsProps {
  vertices: AirfoilVertices;
  machInf: number;
  alphaDeg: number;
  gamma: number;
  isGeometryValid: boolean;
}

export const ParametricCharts: React.FC<ParametricChartsProps> = ({
  vertices,
  machInf,
  alphaDeg,
  gamma,
  isGeometryValid,
}) => {
  const [sweepMode, setSweepMode] = useState<'alpha' | 'mach'>('alpha');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const sweepData = useMemo(() => {
    if (!isGeometryValid) return [];
    return generateParametricSweep(vertices, machInf, alphaDeg, gamma, sweepMode);
  }, [vertices, machInf, alphaDeg, gamma, sweepMode, isGeometryValid]);

  const currentX = sweepMode === 'alpha' ? alphaDeg : machInf;

  return (
    <section
      id="parametric-charts"
      className="bg-white border border-slate-300 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            파라메트릭 스윕 공력 그래프 (Parametric Study)
          </h2>
          <p className="text-xs text-slate-700 mt-0.5">
            현재 익형 형상 및 유체(γ={gamma.toFixed(3)}) 조건에서 변수 변화에 따른 C<sub>l</sub>, C<sub>d</sub>, L/D 변화 추이
          </p>
        </div>

        {/* Sweep Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-300 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setSweepMode('alpha');
              setHoverIdx(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              sweepMode === 'alpha'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            받음각 스윕 (α: -15° ~ +15°)
          </button>
          <button
            type="button"
            onClick={() => {
              setSweepMode('mach');
              setHoverIdx(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              sweepMode === 'mach'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            마하수 스윕 (M∞: 1.15 ~ 5.0)
          </button>
        </div>
      </div>

      {!isGeometryValid ? (
        <div className="p-8 text-center text-sm text-slate-700">
          유효한 사각형 형상이 설정되면 파라메트릭 스윕 곡선이 표시됩니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
          {/* Chart 1: Cl & Cd */}
          <SweepPlotCard
            title="양력계수 (Cl) · 항력계수 (Cd)"
            data={sweepData}
            sweepMode={sweepMode}
            currentX={currentX}
            hoverIdx={hoverIdx}
            onHoverIdx={setHoverIdx}
            series={[
              { key: 'cl', label: 'Cl (양력계수)', color: '#1D4ED8' },
              { key: 'cd', label: 'Cd (항력계수)', color: '#DC2626' },
            ]}
          />

          {/* Chart 2: L/D */}
          <SweepPlotCard
            title="양항비 (L/D = Cl / Cd)"
            data={sweepData}
            sweepMode={sweepMode}
            currentX={currentX}
            hoverIdx={hoverIdx}
            onHoverIdx={setHoverIdx}
            series={[{ key: 'ldRatio', label: 'L/D (양항비)', color: '#047857' }]}
          />
        </div>
      )}
    </section>
  );
};

interface SeriesSpec {
  key: 'cl' | 'cd' | 'ldRatio';
  label: string;
  color: string;
}

interface SweepPlotCardProps {
  title: string;
  data: SweepPoint[];
  sweepMode: 'alpha' | 'mach';
  currentX: number;
  hoverIdx: number | null;
  onHoverIdx: (idx: number | null) => void;
  series: SeriesSpec[];
}

const SweepPlotCard: React.FC<SweepPlotCardProps> = ({
  title,
  data,
  sweepMode,
  currentX,
  hoverIdx,
  onHoverIdx,
  series,
}) => {
  const W = 520;
  const H = 260;
  const padL = 56;
  const padR = 20;
  const padT = 20;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xMin = data[0]?.xValue ?? (sweepMode === 'alpha' ? -15 : 1.15);
  const xMax = data[data.length - 1]?.xValue ?? (sweepMode === 'alpha' ? 15 : 5.0);

  // Compute y bounds across all valid values
  const allVals: number[] = [0];
  for (const pt of data) {
    for (const s of series) {
      const v = pt[s.key];
      if (v !== null && isFinite(v)) allVals.push(v);
    }
  }
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = Math.max(0.05, rawMax - rawMin);
  const yMin = rawMin - span * 0.12;
  const yMax = rawMax + span * 0.12;

  const toX = (xv: number) => padL + ((xv - xMin) / (xMax - xMin || 1)) * plotW;
  const toY = (yv: number) => padT + (1 - (yv - yMin) / (yMax - yMin || 1)) * plotH;

  // Build continuous SVG path segments for attached points
  const buildPath = (key: SeriesSpec['key']) => {
    let d = '';
    let drawing = false;
    for (const pt of data) {
      const val = pt[key];
      if (val === null || !isFinite(val)) {
        drawing = false;
        continue;
      }
      const x = toX(pt.xValue);
      const y = toY(val);
      d += drawing ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
      drawing = true;
    }
    return d;
  };

  // Detached shock intervals for subtle rose shading
  const detachedRects: { x1: number; x2: number }[] = [];
  let detStart: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (!data[i].isAttached && detStart === null) {
      detStart = data[i].xValue;
    } else if (data[i].isAttached && detStart !== null) {
      detachedRects.push({ x1: detStart, x2: data[i - 1].xValue });
      detStart = null;
    }
  }
  if (detStart !== null && data.length > 0) {
    detachedRects.push({ x1: detStart, x2: data[data.length - 1].xValue });
  }

  // Y ticks (5 clean ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));
  const xTicks =
    sweepMode === 'alpha' ? [-15, -10, -5, 0, 5, 10, 15] : [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

  const clampedCurX = Math.max(xMin, Math.min(xMax, currentX));
  const curSvgX = toX(clampedCurX);

  // Closest point to currentX
  let curPt: SweepPoint | null = null;
  let bestDist = Infinity;
  for (const pt of data) {
    const d = Math.abs(pt.xValue - currentX);
    if (d < bestDist) {
      bestDist = d;
      curPt = pt;
    }
  }

  const hoverPt = hoverIdx !== null ? data[hoverIdx] : null;
  const activePt = hoverPt ?? curPt;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    if (sx < padL || sx > W - padR || data.length === 0) {
      onHoverIdx(null);
      return;
    }
    const targetX = xMin + ((sx - padL) / plotW) * (xMax - xMin);
    let idx = 0;
    let minD = Infinity;
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(data[i].xValue - targetX);
      if (d < minD) {
        minD = d;
        idx = i;
      }
    }
    onHoverIdx(idx);
  };

  return (
    <div className="p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <span
                className="w-3 h-0.5 inline-block rounded-full"
                style={{ backgroundColor: s.color, height: '2.5px' }}
              />
              <span>{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => onHoverIdx(null)}
        >
          {/* Detached Shock Background Zones */}
          {detachedRects.map((r, i) => {
            const x1 = toX(r.x1);
            const x2 = Math.max(x1 + 3, toX(r.x2));
            return (
              <rect
                key={`det-${i}`}
                x={x1}
                y={padT}
                width={x2 - x1}
                height={plotH}
                fill="#FFE4E6"
                fillOpacity={0.65}
              />
            );
          })}

          {/* Horizontal Gridlines */}
          {yTicks.map((yv, i) => {
            const sy = toY(yv);
            return (
              <g key={`yt-${i}`}>
                <line
                  x1={padL}
                  y1={sy}
                  x2={W - padR}
                  y2={sy}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={sy}
                  textAnchor="end"
                  dominantBaseline="central"
                  className="text-[10.5px] font-mono tabular-nums fill-slate-700"
                >
                  {yv.toFixed(Math.abs(yv) >= 10 ? 1 : 2)}
                </text>
              </g>
            );
          })}

          {/* Zero Baseline */}
          {yMin < 0 && yMax > 0 && (
            <line
              x1={padL}
              y1={toY(0)}
              x2={W - padR}
              y2={toY(0)}
              stroke="#94A3B8"
              strokeWidth={1.1}
              strokeDasharray="4 3"
            />
          )}

          {/* X Axis Ticks */}
          {xTicks.map((xt) => {
            const sx = toX(xt);
            return (
              <g key={`xt-${xt}`}>
                <line
                  x1={sx}
                  y1={padT}
                  x2={sx}
                  y2={H - padB}
                  stroke="#F1F5F9"
                  strokeWidth={1}
                />
                <text
                  x={sx}
                  y={H - padB + 14}
                  textAnchor="middle"
                  className="text-[10.5px] font-mono tabular-nums fill-slate-700"
                >
                  {sweepMode === 'alpha' ? `${xt}°` : xt.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X Axis Label */}
          <text
            x={padL + plotW / 2}
            y={H - 5}
            textAnchor="middle"
            className="text-[11px] font-semibold fill-slate-800"
          >
            {sweepMode === 'alpha' ? '받음각 α (deg)' : '자유류 마하수 M∞'}
          </text>

          {/* Plot Border */}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth={1}
          />

          {/* Data Curves */}
          {series.map((s) => (
            <path
              key={s.key}
              d={buildPath(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
          ))}

          {/* Current Operating Point Vertical Line */}
          <line
            x1={curSvgX}
            y1={padT}
            x2={curSvgX}
            y2={H - padB}
            stroke="#0F172A"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />

          {/* Current Operating Point Dots */}
          {curPt &&
            series.map((s) => {
              const v = curPt![s.key];
              if (v === null || !isFinite(v)) return null;
              return (
                <circle
                  key={`cur-${s.key}`}
                  cx={toX(curPt!.xValue)}
                  cy={toY(v)}
                  r={4}
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              );
            })}

          {/* Hover Crosshair */}
          {hoverPt && (
            <g>
              <line
                x1={toX(hoverPt.xValue)}
                y1={padT}
                x2={toX(hoverPt.xValue)}
                y2={H - padB}
                stroke="#475569"
                strokeWidth={1}
              />
              {series.map((s) => {
                const v = hoverPt[s.key];
                if (v === null || !isFinite(v)) return null;
                return (
                  <circle
                    key={`hov-${s.key}`}
                    cx={toX(hoverPt.xValue)}
                    cy={toY(v)}
                    r={4.5}
                    fill="#FFFFFF"
                    stroke={s.color}
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Live Numeric Readout Bar under Chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900">
        <span className="font-semibold text-slate-800">
          {hoverPt ? '커서 위치:' : '현재 운전점:'}{' '}
          {activePt
            ? sweepMode === 'alpha'
              ? `α = ${activePt.xValue.toFixed(1)}°`
              : `M∞ = ${activePt.xValue.toFixed(2)}`
            : '—'}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {activePt && !activePt.isAttached ? (
            <span className="font-sans font-semibold text-rose-800">
              ▲ 이탈 충격파 발생 구간 (해석 불가)
            </span>
          ) : (
            series.map((s) => {
              const val = activePt ? activePt[s.key] : null;
              return (
                <span key={`rd-${s.key}`} className="font-semibold" style={{ color: s.color }}>
                  {s.key === 'cl' ? 'Cl' : s.key === 'cd' ? 'Cd' : 'L/D'} ={' '}
                  {val !== null && isFinite(val) ? val.toFixed(4) : '—'}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
