import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { ControlSidebar, GeometryEditMode } from './components/ControlSidebar';
import { WaveDiagram } from './components/WaveDiagram';
import { SurfaceParamsPanel } from './components/SurfaceParamsPanel';
import { ParametricCharts } from './components/ParametricCharts';
import {
  AIRFOIL_PRESETS,
  AirfoilVertices,
  FLUID_PRESETS,
  parametricToVertices,
  solveAirfoilShockExpansion,
} from './lib/shockExpansion';

const DEFAULT_FLUID_ID = 'air';
const DEFAULT_GAMMA = 1.4;
const DEFAULT_MACH = 2.0;
const DEFAULT_ALPHA = 0.0;
const DEFAULT_VERTICES: AirfoilVertices = parametricToVertices(AIRFOIL_PRESETS[0].shape);

export default function App() {
  const [selectedFluidId, setSelectedFluidId] = useState<string>(DEFAULT_FLUID_ID);
  const [gamma, setGamma] = useState<number>(DEFAULT_GAMMA);
  const [machInf, setMachInf] = useState<number>(DEFAULT_MACH);
  const [alphaDeg, setAlphaDeg] = useState<number>(DEFAULT_ALPHA);
  const [vertices, setVertices] = useState<AirfoilVertices>(DEFAULT_VERTICES);
  const [geometryMode, setGeometryMode] = useState<GeometryEditMode>('parametric');
  const [symmetricLock, setSymmetricLock] = useState<boolean>(true);

  const handleSelectFluid = (fluidId: string) => {
    setSelectedFluidId(fluidId);
    const found = FLUID_PRESETS.find((f) => f.id === fluidId);
    if (found) {
      setGamma(found.gamma);
    }
  };

  const handleChangeGamma = (nextGamma: number) => {
    setGamma(nextGamma);
    const matching = FLUID_PRESETS.find((f) => Math.abs(f.gamma - nextGamma) < 1e-4);
    setSelectedFluidId(matching ? matching.id : 'custom');
  };

  const handleResetAll = () => {
    setSelectedFluidId(DEFAULT_FLUID_ID);
    setGamma(DEFAULT_GAMMA);
    setMachInf(DEFAULT_MACH);
    setAlphaDeg(DEFAULT_ALPHA);
    setVertices(DEFAULT_VERTICES);
    setSymmetricLock(true);
  };

  const aeroResult = useMemo(
    () => solveAirfoilShockExpansion(vertices, machInf, alphaDeg, gamma),
    [vertices, machInf, alphaDeg, gamma]
  );

  const handleExportCsv = () => {
    const fluid = FLUID_PRESETS.find((f) => f.id === selectedFluidId);
    const lines: string[] = [
      '2D Supersonic Diamond/Quadrilateral Airfoil Shock-Expansion Results',
      `Fluid,${fluid ? `${fluid.nameKo} (${fluid.formula})` : 'Custom'}`,
      `Gamma,${aeroResult.gamma.toFixed(4)}`,
      `Mach_Inf,${aeroResult.machInf.toFixed(4)}`,
      `Alpha_deg,${aeroResult.alphaDeg.toFixed(3)}`,
      `Attached_Flow,${aeroResult.isAttached ? 'Yes' : 'No (Detached/Subsonic)'}`,
      `Cl,${aeroResult.isAttached ? aeroResult.cl.toFixed(6) : 'NaN'}`,
      `Cd,${aeroResult.isAttached ? aeroResult.cd.toFixed(6) : 'NaN'}`,
      `L_over_D,${aeroResult.isAttached ? aeroResult.ldRatio.toFixed(6) : 'NaN'}`,
      `Cm_LE,${aeroResult.isAttached ? aeroResult.cmLe.toFixed(6) : 'NaN'}`,
      '',
      'Vertices (Body Frame)',
      'Vertex,x/c,y/c',
      `V1 (LE),${vertices.v1.x.toFixed(4)},${vertices.v1.y.toFixed(4)}`,
      `V2 (Upper),${vertices.v2.x.toFixed(4)},${vertices.v2.y.toFixed(4)}`,
      `V3 (TE),${vertices.v3.x.toFixed(4)},${vertices.v3.y.toFixed(4)}`,
      `V4 (Lower),${vertices.v4.x.toFixed(4)},${vertices.v4.y.toFixed(4)}`,
      '',
      'Surface Breakdown',
      'Surface,WaveType,Inclination_deg,Turn_theta_deg,Shock_beta_deg,Mu1_deg,Mu2_deg,Local_Mach,p_over_pInf,T_over_TInf,Cp',
    ];

    for (const s of aeroResult.surfaces) {
      lines.push(
        [
          s.shortLabel,
          s.waveType,
          s.inclinationDeg.toFixed(4),
          s.turnAngleDeg.toFixed(4),
          s.shockBetaDeg !== null ? s.shockBetaDeg.toFixed(4) : '',
          s.mu1Deg !== null ? s.mu1Deg.toFixed(4) : '',
          s.mu2Deg !== null ? s.mu2Deg.toFixed(4) : '',
          s.isValid ? s.downstreamMach.toFixed(4) : 'Invalid',
          s.isValid ? s.pressureRatio.toFixed(5) : '',
          s.isValid ? s.tempRatio.toFixed(5) : '',
          s.isValid ? s.cp.toFixed(5) : '',
        ].join(',')
      );
    }

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supersonic_airfoil_M${machInf.toFixed(2)}_a${alphaDeg.toFixed(1)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusTone = !aeroResult.isGeometryValid
    ? 'error'
    : !aeroResult.isAttached
    ? 'warning'
    : 'ok';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-300">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#wave-diagram"
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            2D 초음속 익형 공력 해석기
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <a
              href="#wave-diagram"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              파동 다이어그램
            </a>
            <a
              href="#surface-params"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              표면 파라미터
            </a>
            <a
              href="#parametric-charts"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              파라메트릭 그래프
            </a>
          </nav>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 내보내기</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 flex flex-col lg:flex-row items-start gap-5">
        {/* Left Control Column */}
        <ControlSidebar
          selectedFluidId={selectedFluidId}
          onSelectFluid={handleSelectFluid}
          gamma={gamma}
          onChangeGamma={handleChangeGamma}
          machInf={machInf}
          onChangeMach={setMachInf}
          alphaDeg={alphaDeg}
          onChangeAlpha={setAlphaDeg}
          vertices={vertices}
          onChangeVertices={setVertices}
          geometryMode={geometryMode}
          onChangeGeometryMode={setGeometryMode}
          symmetricLock={symmetricLock}
          onToggleSymmetricLock={() => setSymmetricLock((s) => !s)}
          isGeometryValid={aeroResult.isGeometryValid}
          geometryErrorKo={aeroResult.geometryErrorKo}
          onResetAll={handleResetAll}
        />

        {/* Right Analytical Dashboard */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* Aerodynamic KPI Summary Strip */}
          <section
            aria-label="핵심 공력 계수 요약"
            className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3"
          >
            <KpiCard
              title="양력계수 Cl"
              value={aeroResult.isAttached ? aeroResult.cl.toFixed(4) : '—'}
              subtitle="Lift Coefficient"
              accent={aeroResult.isAttached && aeroResult.cl > 0.0001 ? 'blue' : 'neutral'}
            />
            <KpiCard
              title="항력계수 Cd"
              value={aeroResult.isAttached ? aeroResult.cd.toFixed(4) : '—'}
              subtitle="Wave Drag Coefficient"
              accent="red"
            />
            <KpiCard
              title="양항비 L/D"
              value={aeroResult.isAttached ? aeroResult.ldRatio.toFixed(3) : '—'}
              subtitle="Cl / Cd 효율"
              accent="neutral"
            />
            <KpiCard
              title="피칭 모멘트 Cm,LE"
              value={aeroResult.isAttached ? aeroResult.cmLe.toFixed(4) : '—'}
              subtitle="전연(V1) 기준 (Nose-Up +)"
              accent="neutral"
            />
            <div
              className={`col-span-2 sm:col-span-1 rounded-xl border p-4 flex flex-col justify-between ${
                statusTone === 'ok'
                  ? 'bg-white border-slate-300'
                  : 'bg-rose-50 border-rose-300'
              }`}
            >
              <span className="text-xs font-semibold text-slate-700">유동 해석 상태</span>
              <div className="mt-1">
                {statusTone === 'ok' ? (
                  <span className="text-sm font-bold text-emerald-800">● 부착 유동 정상</span>
                ) : statusTone === 'warning' ? (
                  <span className="text-sm font-bold text-rose-800">▲ 이탈 충격파 발생</span>
                ) : (
                  <span className="text-sm font-bold text-rose-800">✖ 기하 형상 오류</span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-700 mt-1">
                {statusTone === 'ok'
                  ? `θmax(M∞) = ${aeroResult.thetaMaxInfDeg.toFixed(1)}°`
                  : '충격파 부착 한계 초과'}
              </span>
            </div>
          </section>

          {/* 1. Primary 2D Shock & Expansion Wave Diagram */}
          <WaveDiagram
            result={aeroResult}
            rawVertices={vertices}
            onChangeVertices={setVertices}
          />

          {/* 2. Directly Below Diagram: Detailed Flow & Surface Parameters */}
          <SurfaceParamsPanel
            result={aeroResult}
            selectedFluidId={selectedFluidId}
          />

          {/* 3. Parametric Study Sweep Graphs */}
          <ParametricCharts
            vertices={vertices}
            machInf={machInf}
            alphaDeg={alphaDeg}
            gamma={gamma}
            isGeometryValid={aeroResult.isGeometryValid}
          />
        </div>
      </main>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  accent: 'blue' | 'red' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, accent }) => {
  const valColor =
    accent === 'blue'
      ? 'text-blue-800'
      : accent === 'red'
      ? 'text-red-800'
      : 'text-slate-900';

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col justify-between">
      <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{title}</span>
      <div className={`text-2xl font-mono tabular-nums font-bold tracking-tight mt-1 ${valColor}`}>
        {value}
      </div>
      <span className="text-[11px] text-slate-600 mt-1 truncate">{subtitle}</span>
    </div>
  );
};
