import React, { useRef, useState } from 'react';
import { AlertTriangle, Eye, RotateCcw } from 'lucide-react';
import {
  AirfoilAeroResult,
  AirfoilVertices,
  Point2D,
  SurfaceSolution,
  toRad,
} from '../lib/shockExpansion';

interface WaveDiagramProps {
  result: AirfoilAeroResult;
  rawVertices: AirfoilVertices;
  onChangeVertices: (v: AirfoilVertices) => void;
}

export const WaveDiagram: React.FC<WaveDiagramProps> = ({
  result,
  rawVertices,
  onChangeVertices,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingKey, setDraggingKey] = useState<'v2' | 'v3' | 'v4' | null>(null);
  const [hoverCoord, setHoverCoord] = useState<Point2D | null>(null);
  const [showAngles, setShowAngles] = useState(true);
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [showPressureVectors, setShowPressureVectors] = useState(true);
  const [showFaceLabels, setShowFaceLabels] = useState(true);

  // SVG coordinate system: viewBox width=960, height=480
  // World domain: x in [-0.45, 1.65] (span 2.10), y in [-0.55, 0.55] (span 1.10)
  const W = 960;
  const H = 480;
  const xMin = -0.45;
  const xMax = 1.65;
  const yMin = -0.55;
  const yMax = 0.55;

  const toSvg = (p: Point2D): Point2D => ({
    x: ((p.x - xMin) / (xMax - xMin)) * W,
    y: H - ((p.y - yMin) / (yMax - yMin)) * H,
  });

  const toWorld = (svgX: number, svgY: number): Point2D => ({
    x: xMin + (svgX / W) * (xMax - xMin),
    y: yMin + ((H - svgY) / H) * (yMax - yMin),
  });

  const getPointerWorld = (e: React.PointerEvent<SVGSVGElement>): Point2D | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    return toWorld(sx, sy);
  };

  // Un-rotate world point back to body frame around V1(0,0) when dragging
  const worldToBody = (p: Point2D): Point2D => {
    const chordTiltRad = Math.atan2(
      rawVertices.v3.y - rawVertices.v1.y,
      rawVertices.v3.x - rawVertices.v1.x
    );
    const rotCCWRad = toRad(result.alphaDeg) + chordTiltRad;
    return {
      x: p.x * Math.cos(rotCCWRad) - p.y * Math.sin(rotCCWRad),
      y: p.x * Math.sin(rotCCWRad) + p.y * Math.cos(rotCCWRad),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const wp = getPointerWorld(e);
    if (!wp) return;
    setHoverCoord(wp);

    if (!draggingKey) return;
    const bp = worldToBody(wp);
    if (draggingKey === 'v2') {
      onChangeVertices({
        ...rawVertices,
        v2: {
          x: Number(Math.max(0.06, Math.min(0.94, bp.x)).toFixed(3)),
          y: Number(Math.max(0.015, Math.min(0.35, bp.y)).toFixed(3)),
        },
      });
    } else if (draggingKey === 'v4') {
      onChangeVertices({
        ...rawVertices,
        v4: {
          x: Number(Math.max(0.06, Math.min(0.94, bp.x)).toFixed(3)),
          y: Number(Math.min(-0.015, Math.max(-0.35, bp.y)).toFixed(3)),
        },
      });
    } else if (draggingKey === 'v3') {
      onChangeVertices({
        ...rawVertices,
        v3: {
          x: Number(Math.max(0.5, Math.min(1.4, bp.x)).toFixed(3)),
          y: Number(Math.max(-0.25, Math.min(0.25, bp.y)).toFixed(3)),
        },
      });
    }
  };

  const rv = result.rotatedVertices;
  const sV1 = toSvg(rv.v1);
  const sV2 = toSvg(rv.v2);
  const sV3 = toSvg(rv.v3);
  const sV4 = toSvg(rv.v4);

  // Grid lines every 0.25 chord
  const xTicks = [-0.25, 0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];
  const yTicks = [-0.4, -0.2, 0, 0.2, 0.4];

  // Helper to draw a ray from a world origin at worldAngleDeg
  const rayEndWorld = (origin: Point2D, angleDeg: number, dist: number): Point2D => ({
    x: origin.x + dist * Math.cos(toRad(angleDeg)),
    y: origin.y + dist * Math.sin(toRad(angleDeg)),
  });

  // Render wave primitives for a surface transition
  const renderSurfaceWave = (s: SurfaceSolution, prevInclinationDeg: number) => {
    const origin = s.start;
    const sOrigin = toSvg(origin);
    const waveLength = 1.35;

    if (s.waveType === 'detached') {
      return null; // Handled by prominent Bow Shock
    }

    if (s.waveType === 'shock' && s.shockWorldAngleDeg !== null && s.shockBetaDeg !== null) {
      const endW = rayEndWorld(origin, s.shockWorldAngleDeg, waveLength);
      const sEnd = toSvg(endW);
      // Label midway along shock line
      const labelW = rayEndWorld(origin, s.shockWorldAngleDeg, s.id.includes('front') ? 0.52 : 0.44);
      const sLabel = toSvg(labelW);
      const yOff = s.stream === 'upper' ? -12 : 18;

      return (
        <g key={`wave-${s.id}`}>
          <line
            x1={sOrigin.x}
            y1={sOrigin.y}
            x2={sEnd.x}
            y2={sEnd.y}
            stroke="#DC2626"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          {showAngles && (
            <g transform={`translate(${sLabel.x}, ${sLabel.y + yOff})`}>
              <rect
                x={-34}
                y={-11}
                width={68}
                height={18}
                rx={4}
                fill="#FFFFFF"
                fillOpacity={0.94}
                stroke="#FCA5A5"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                y={-2}
                className="text-[11px] font-mono font-semibold fill-red-700"
              >
                β {s.shockBetaDeg.toFixed(1)}°
              </text>
            </g>
          )}
        </g>
      );
    }

    if (s.waveType === 'expansion' && s.mu1Deg !== null && s.mu2Deg !== null) {
      // Forward Mach line angle: prevInclination +/- mu1
      // Rear Mach line angle: s.inclination +/- mu2
      const sign = s.stream === 'upper' ? 1 : -1;
      const a1 = prevInclinationDeg + sign * s.mu1Deg;
      const a2 = s.inclinationDeg + sign * s.mu2Deg;
      const p1 = toSvg(rayEndWorld(origin, a1, waveLength));
      const p2 = toSvg(rayEndWorld(origin, a2, waveLength));

      // Intermediate Mach rays inside the fan
      const fanRays = [0.25, 0.5, 0.75].map((t) => {
        const ang = a1 + (a2 - a1) * t;
        return toSvg(rayEndWorld(origin, ang, waveLength));
      });

      const midAngle = 0.5 * (a1 + a2);
      const sLabel = toSvg(rayEndWorld(origin, midAngle, 0.44));
      const yOff = s.stream === 'upper' ? -10 : 14;

      return (
        <g key={`wave-${s.id}`}>
          <polygon
            points={`${sOrigin.x},${sOrigin.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
            fill="#2563EB"
            fillOpacity={0.13}
          />
          <line x1={sOrigin.x} y1={sOrigin.y} x2={p1.x} y2={p1.y} stroke="#1D4ED8" strokeWidth={1.6} />
          {fanRays.map((fr, idx) => (
            <line
              key={idx}
              x1={sOrigin.x}
              y1={sOrigin.y}
              x2={fr.x}
              y2={fr.y}
              stroke="#3B82F6"
              strokeWidth={0.9}
              strokeDasharray="4 3"
              strokeOpacity={0.75}
            />
          ))}
          <line x1={sOrigin.x} y1={sOrigin.y} x2={p2.x} y2={p2.y} stroke="#1D4ED8" strokeWidth={1.6} />
          {showAngles && (
            <g transform={`translate(${sLabel.x}, ${sLabel.y + yOff})`}>
              <rect
                x={-38}
                y={-11}
                width={76}
                height={18}
                rx={4}
                fill="#FFFFFF"
                fillOpacity={0.94}
                stroke="#93C5FD"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                y={-2}
                className="text-[11px] font-mono font-semibold fill-blue-800"
              >
                Δν {s.absTurnDeg.toFixed(1)}°
              </text>
            </g>
          )}
        </g>
      );
    }

    if (s.waveType === 'mach' && s.shockWorldAngleDeg !== null) {
      const sEnd = toSvg(rayEndWorld(origin, s.shockWorldAngleDeg, waveLength));
      return (
        <line
          key={`wave-${s.id}`}
          x1={sOrigin.x}
          y1={sOrigin.y}
          x2={sEnd.x}
          y2={sEnd.y}
          stroke="#475569"
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
      );
    }

    return null;
  };

  // Render pressure normal vectors along each face
  const renderPressureArrows = (s: SurfaceSolution) => {
    if (!s.isValid || !showPressureVectors) return null;
    const mid: Point2D = {
      x: 0.5 * (s.start.x + s.end.x),
      y: 0.5 * (s.start.y + s.end.y),
    };
    // Vector magnitude scaled cleanly to [0.04, 0.16] world units
    const mag = Math.min(0.16, Math.max(0.035, Math.abs(s.cp) * 0.25 + 0.03));
    const isCompression = s.cp >= 0;
    const color = isCompression ? '#DC2626' : '#1D4ED8';

    // Arrow points inward for positive Cp (pushing on surface), outward for negative Cp (suction)
    const dir = isCompression
      ? { x: -s.outwardNormal.x, y: -s.outwardNormal.y }
      : { x: s.outwardNormal.x, y: s.outwardNormal.y };

    // Place arrows outside the airfoil body along outwardNormal
    const baseOuter = isCompression
      ? { x: mid.x + s.outwardNormal.x * mag, y: mid.y + s.outwardNormal.y * mag }
      : { x: mid.x + s.outwardNormal.x * 0.015, y: mid.y + s.outwardNormal.y * 0.015 };
    const tipOuter = isCompression
      ? { x: mid.x + s.outwardNormal.x * 0.015, y: mid.y + s.outwardNormal.y * 0.015 }
      : { x: mid.x + dir.x * (mag + 0.015), y: mid.y + dir.y * (mag + 0.015) };

    const p1 = toSvg(baseOuter);
    const p2 = toSvg(tipOuter);

    // Arrowhead
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const ah = 6;
    const leftWing = `${p2.x - ux * ah - uy * 3.5},${p2.y - uy * ah + ux * 3.5}`;
    const rightWing = `${p2.x - ux * ah + uy * 3.5},${p2.y - uy * ah - ux * 3.5}`;

    return (
      <g key={`pvec-${s.id}`}>
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={1.8} />
        <polygon points={`${p2.x},${p2.y} ${leftWing} ${rightWing}`} fill={color} />
      </g>
    );
  };

  // Surface inline label (M and p/p_inf)
  const renderFaceTag = (s: SurfaceSolution) => {
    if (!showFaceLabels) return null;
    const mid: Point2D = {
      x: 0.5 * (s.start.x + s.end.x),
      y: 0.5 * (s.start.y + s.end.y),
    };
    const offsetDist = s.stream === 'upper' ? 0.145 : 0.155;
    const labelPos = toSvg({
      x: mid.x + s.outwardNormal.x * offsetDist,
      y: mid.y + s.outwardNormal.y * offsetDist,
    });

    const fNum =
      s.id === 'upper_front'
        ? 'F1'
        : s.id === 'upper_rear'
        ? 'F2'
        : s.id === 'lower_front'
        ? 'F3'
        : 'F4';

    return (
      <g key={`ftag-${s.id}`} transform={`translate(${labelPos.x}, ${labelPos.y})`}>
        <rect
          x={-48}
          y={-15}
          width={96}
          height={30}
          rx={5}
          fill="#FFFFFF"
          fillOpacity={0.95}
          stroke={s.isValid ? '#CBD5E1' : '#FDA4AF'}
          strokeWidth={1}
        />
        <text
          textAnchor="middle"
          y={-3}
          className="text-[10.5px] font-mono font-semibold fill-slate-900"
        >
          {fNum} · {s.isValid ? `M=${s.downstreamMach.toFixed(2)}` : '이탈/오류'}
        </text>
        <text
          textAnchor="middle"
          y={10}
          className={`text-[10px] font-mono font-medium ${
            s.isValid
              ? s.cp >= 0
                ? 'fill-red-700'
                : 'fill-blue-700'
              : 'fill-rose-700'
          }`}
        >
          {s.isValid ? `p/p∞=${s.pressureRatio.toFixed(2)}` : 'Detached'}
        </text>
      </g>
    );
  };

  // Trailing edge waves (Condition 4: wake does not affect airfoil)
  const renderTrailingWaves = () => {
    const tw = result.trailingWaves;
    if (!result.isAttached || !tw.valid) return null;
    const len = 0.85;
    const uEnd = toSvg(rayEndWorld(rv.v3, tw.upperAngleDeg, len));
    const lEnd = toSvg(rayEndWorld(rv.v3, tw.lowerAngleDeg, len));
    const slipEnd = toSvg(rayEndWorld(rv.v3, tw.slipstreamAngleDeg, len));

    return (
      <g opacity={0.75}>
        {/* Slipstream wake centerline */}
        <line
          x1={sV3.x}
          y1={sV3.y}
          x2={slipEnd.x}
          y2={slipEnd.y}
          stroke="#64748B"
          strokeWidth={1.2}
          strokeDasharray="6 4"
        />
        {/* Upper trailing wave */}
        <line
          x1={sV3.x}
          y1={sV3.y}
          x2={uEnd.x}
          y2={uEnd.y}
          stroke={tw.upperWaveType === 'shock' ? '#DC2626' : '#1D4ED8'}
          strokeWidth={1.5}
          strokeDasharray="5 3"
        />
        {/* Lower trailing wave */}
        <line
          x1={sV3.x}
          y1={sV3.y}
          x2={lEnd.x}
          y2={lEnd.y}
          stroke={tw.lowerWaveType === 'shock' ? '#DC2626' : '#1D4ED8'}
          strokeWidth={1.5}
          strokeDasharray="5 3"
        />
      </g>
    );
  };

  // Angle of attack arc around V1=(0,0)
  const renderAlphaArc = () => {
    const chordEndRef = toSvg({ x: 0.36, y: 0 });
    const chordDir = { x: rv.v3.x - rv.v1.x, y: rv.v3.y - rv.v1.y };
    const chordLen = Math.hypot(chordDir.x, chordDir.y) || 1;
    const chordExt = toSvg({
      x: (chordDir.x / chordLen) * 1.15,
      y: (chordDir.y / chordLen) * 1.15,
    });

    const alphaRad = toRad(-result.alphaDeg);
    const arcR = 72;
    const x2 = sV1.x + arcR * Math.cos(alphaRad);
    const y2 = sV1.y - arcR * Math.sin(alphaRad);
    const sweepFlag = result.alphaDeg >= 0 ? 1 : 0;

    return (
      <g>
        {/* Freestream horizontal reference axis through V1 */}
        <line
          x1={sV1.x - 120}
          y1={sV1.y}
          x2={chordEndRef.x + 280}
          y2={sV1.y}
          stroke="#64748B"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {/* Airfoil chord line V1 -> V3 */}
        <line
          x1={sV1.x}
          y1={sV1.y}
          x2={chordExt.x}
          y2={chordExt.y}
          stroke="#0F172A"
          strokeWidth={1.2}
          strokeDasharray="6 3"
          strokeOpacity={0.6}
        />
        {Math.abs(result.alphaDeg) > 0.3 && (
          <>
            <path
              d={`M ${sV1.x + arcR} ${sV1.y} A ${arcR} ${arcR} 0 0 ${sweepFlag} ${x2} ${y2}`}
              fill="none"
              stroke="#0F172A"
              strokeWidth={1.5}
            />
            <text
              x={sV1.x + arcR + 8}
              y={sV1.y + (result.alphaDeg > 0 ? 14 : -8)}
              className="text-[11px] font-mono font-semibold fill-slate-900"
            >
              α={result.alphaDeg.toFixed(1)}°
            </text>
          </>
        )}
      </g>
    );
  };

  // Detached Bow Shock visualization in front of Leading Edge
  const renderBowShock = () => {
    if (result.isAttached || !result.isGeometryValid) return null;
    const apex = toSvg({ x: -0.09, y: 0 });
    const top = toSvg({ x: 0.48, y: 0.52 });
    const bot = toSvg({ x: 0.48, y: -0.52 });
    const ctrlTop = toSvg({ x: -0.07, y: 0.28 });
    const ctrlBot = toSvg({ x: -0.07, y: -0.28 });

    return (
      <g>
        <path
          d={`M ${top.x} ${top.y} Q ${ctrlTop.x} ${ctrlTop.y} ${apex.x} ${apex.y} Q ${ctrlBot.x} ${ctrlBot.y} ${bot.x} ${bot.y}`}
          fill="none"
          stroke="#BE123C"
          strokeWidth={3}
          strokeDasharray="7 4"
        />
        <g transform={`translate(${apex.x - 52}, ${apex.y - 26})`}>
          <rect
            x={-54}
            y={-12}
            width={108}
            height={22}
            rx={5}
            fill="#FFF1F2"
            stroke="#FB7185"
            strokeWidth={1.2}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            y={-1}
            className="text-[11px] font-semibold fill-rose-900"
          >
            이탈 충격파 (Bow)
          </text>
        </g>
      </g>
    );
  };

  const s1 = result.surfaces.find((s) => s.id === 'upper_front');
  const s2 = result.surfaces.find((s) => s.id === 'upper_rear');
  const s3 = result.surfaces.find((s) => s.id === 'lower_front');
  const s4 = result.surfaces.find((s) => s.id === 'lower_rear');

  return (
    <section
      id="wave-diagram"
      className="bg-white border border-slate-300 rounded-xl overflow-hidden"
    >
      {/* Diagram Header & Layer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-semibold text-slate-900">
            2D 경사충격파 · Prandtl-Meyer 팽창파 유동장 다이어그램
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-700">
            M<sub>∞</sub>={result.machInf.toFixed(2)} · α={result.alphaDeg.toFixed(1)}° · γ={result.gamma.toFixed(3)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <LayerToggleButton
            active={showAngles}
            onClick={() => setShowAngles((v) => !v)}
            label="파동 각도"
          />
          <LayerToggleButton
            active={showStreamlines}
            onClick={() => setShowStreamlines((v) => !v)}
            label="자유류 유선"
          />
          <LayerToggleButton
            active={showPressureVectors}
            onClick={() => setShowPressureVectors((v) => !v)}
            label="압력 벡터"
          />
          <LayerToggleButton
            active={showFaceLabels}
            onClick={() => setShowFaceLabels((v) => !v)}
            label="표면 수치"
          />
        </div>
      </div>

      {/* Detached Shock Exception Banner */}
      {result.isGeometryValid && !result.isAttached && (
        <div className="flex items-start gap-2.5 px-5 py-3 bg-rose-50 border-b border-rose-300 text-rose-950">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold">이탈 충격파 (Detached Shock) 조건 감지:</span>{' '}
            <span>
              {result.detachedFaces.join(', ')}에서 충격파 부착 한계각(θ<sub>max</sub>)을 초과하거나 충격파 후류가 아음속으로 전환되어 순수 Shock-Expansion 해석이 성립하지 않습니다. 마하수를 높이거나 쐐기각·받음각을 줄여주세요.
            </span>
          </div>
        </div>
      )}

      {/* Main SVG Stage */}
      <div className="relative bg-white">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`w-full h-auto block select-none ${
            draggingKey ? 'cursor-grabbing' : 'cursor-crosshair'
          }`}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDraggingKey(null)}
          onPointerLeave={() => {
            setDraggingKey(null);
            setHoverCoord(null);
          }}
        >
          {/* Coordinate Grid */}
          <g>
            {xTicks.map((xt) => {
              const sx = toSvg({ x: xt, y: 0 }).x;
              return (
                <g key={`xg-${xt}`}>
                  <line
                    x1={sx}
                    y1={0}
                    x2={sx}
                    y2={H}
                    stroke={xt === 0 ? '#CBD5E1' : '#E2E8F0'}
                    strokeWidth={xt === 0 ? 1.2 : 0.8}
                  />
                  <text
                    x={sx + 4}
                    y={H - 8}
                    className="text-[10px] font-mono tabular-nums fill-slate-600"
                  >
                    {xt.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {yTicks.map((yt) => {
              const sy = toSvg({ x: 0, y: yt }).y;
              return (
                <g key={`yg-${yt}`}>
                  <line
                    x1={0}
                    y1={sy}
                    x2={W}
                    y2={sy}
                    stroke={yt === 0 ? '#CBD5E1' : '#E2E8F0'}
                    strokeWidth={yt === 0 ? 1.2 : 0.8}
                  />
                  {yt !== 0 && (
                    <text
                      x={8}
                      y={sy - 4}
                      className="text-[10px] font-mono tabular-nums fill-slate-600"
                    >
                      {yt > 0 ? `+${yt.toFixed(1)}` : yt.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Freestream Flow Arrows */}
          {showStreamlines && (
            <g>
              {[-0.32, -0.16, 0, 0.16, 0.32].map((yVal) => {
                const start = toSvg({ x: -0.4, y: yVal });
                const end = toSvg({ x: -0.17, y: yVal });
                return (
                  <g key={`fs-${yVal}`}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#475569"
                      strokeWidth={1.6}
                    />
                    <polygon
                      points={`${end.x},${end.y} ${end.x - 8},${end.y - 4} ${end.x - 8},${end.y + 4}`}
                      fill="#475569"
                    />
                  </g>
                );
              })}
              <text
                x={toSvg({ x: -0.39, y: 0.38 }).x}
                y={toSvg({ x: -0.39, y: 0.38 }).y}
                className="text-xs font-mono font-semibold fill-slate-800"
              >
                Freestream M∞ = {result.machInf.toFixed(2)} →
              </text>
            </g>
          )}

          {/* Angle of Attack Reference & Chord */}
          {renderAlphaArc()}

          {/* Waves (Shocks & Expansion Fans) */}
          {result.isGeometryValid && (
            <g>
              {s1 && renderSurfaceWave(s1, 0)}
              {s2 && s1 && renderSurfaceWave(s2, s1.inclinationDeg)}
              {s3 && renderSurfaceWave(s3, 0)}
              {s4 && s3 && renderSurfaceWave(s4, s3.inclinationDeg)}
              {renderTrailingWaves()}
              {renderBowShock()}
            </g>
          )}

          {/* Airfoil Quadrilateral Body */}
          <polygon
            points={`${sV1.x},${sV1.y} ${sV2.x},${sV2.y} ${sV3.x},${sV3.y} ${sV4.x},${sV4.y}`}
            fill="#E2E8F0"
            fillOpacity={0.78}
            stroke="#0F172A"
            strokeWidth={2.2}
            strokeLinejoin="round"
          />

          {/* Color-coded active surface edges */}
          {result.surfaces.map((s) => {
            const pA = toSvg(s.start);
            const pB = toSvg(s.end);
            const edgeColor = !s.isValid
              ? '#BE123C'
              : s.waveType === 'shock'
              ? '#DC2626'
              : s.waveType === 'expansion'
              ? '#1D4ED8'
              : '#334155';
            return (
              <line
                key={`edge-${s.id}`}
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={edgeColor}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          {/* Pressure Vectors & Surface Tags */}
          {result.surfaces.map((s) => renderPressureArrows(s))}
          {result.surfaces.map((s) => renderFaceTag(s))}

          {/* Interactive Vertex Handles */}
          {/* V1 Fixed Leading Edge Pivot */}
          <g>
            <circle cx={sV1.x} cy={sV1.y} r={5.5} fill="#0F172A" stroke="#FFFFFF" strokeWidth={2} />
            <text
              x={sV1.x - 16}
              y={sV1.y - 11}
              className="text-[11px] font-mono font-bold fill-slate-900"
            >
              V1 (Pivot)
            </text>
          </g>

          {/* Draggable V2, V3, V4 */}
          {(
            [
              { key: 'v2', pt: sV2, label: 'V2', dy: -12, dx: 0 },
              { key: 'v3', pt: sV3, label: 'V3', dy: -12, dx: 12 },
              { key: 'v4', pt: sV4, label: 'V4', dy: 18, dx: 0 },
            ] as const
          ).map((h) => (
            <g
              key={h.key}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDraggingKey(h.key);
              }}
            >
              <circle
                cx={h.pt.x}
                cy={h.pt.y}
                r={12}
                fill="transparent"
              />
              <circle
                cx={h.pt.x}
                cy={h.pt.y}
                r={5.5}
                fill={draggingKey === h.key ? '#1D4ED8' : '#FFFFFF'}
                stroke="#0F172A"
                strokeWidth={2}
              />
              <text
                x={h.pt.x + h.dx}
                y={h.pt.y + h.dy}
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-slate-900 pointer-events-none"
              >
                {h.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Bottom-right live coordinate probe */}
        <div className="absolute bottom-2.5 right-3 px-2.5 py-1 bg-white/95 border border-slate-300 rounded-md text-[11px] font-mono tabular-nums text-slate-800 pointer-events-none">
          {hoverCoord
            ? `x/c: ${hoverCoord.x.toFixed(3)} · y/c: ${hoverCoord.y.toFixed(3)}`
            : '꼭짓점 V2, V3, V4 드래그 편집 가능'}
        </div>
      </div>

      {/* Diagram Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-800">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="w-5 h-0.5 bg-red-600 inline-block" />
            <span>경사충격파 (Oblique Shock · 압축)</span>
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="w-5 h-3 bg-blue-600/20 border border-blue-700 inline-block rounded-xs" />
            <span>Prandtl-Meyer 팽창팬 (Expansion)</span>
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-slate-500 inline-block" />
            <span>후연 파동 · 후류 (기저압 영향 무시)</span>
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
            <span>전연 회전 중심 V1(0,0)</span>
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-600">
          2D 비점성 압축성 유동 해석 모델
        </span>
      </div>
    </section>
  );
};

interface LayerToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const LayerToggleButton: React.FC<LayerToggleButtonProps> = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
    }`}
  >
    <Eye className="w-3 h-3" />
    <span>{label}</span>
  </button>
);

void RotateCcw;
