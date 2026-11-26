import React from 'react';
import {
  AirfoilAeroResult,
  FLUID_PRESETS,
  SurfaceSolution,
} from '../lib/shockExpansion';

interface SurfaceParamsPanelProps {
  result: AirfoilAeroResult;
  selectedFluidId: string;
}

export const SurfaceParamsPanel: React.FC<SurfaceParamsPanelProps> = ({
  result,
  selectedFluidId,
}) => {
  const fluid = FLUID_PRESETS.find((f) => f.id === selectedFluidId);
  const fluidLabel = fluid ? `${fluid.nameKo} (${fluid.formula})` : '사용자 지정 기체';

  return (
    <section
      id="surface-params"
      className="bg-white border border-slate-300 rounded-xl overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            유동 및 4개 표면별 상세 파라미터
          </h2>
          <p className="text-xs text-slate-700 mt-0.5">
            자유류 기준 값 및 각 면(F1~F4)의 경사충격파 · Prandtl-Meyer 팽창파 해석 결과
          </p>
        </div>
        <div className="text-xs font-medium text-slate-800">
          선택 유체: <span className="font-semibold text-slate-900">{fluidLabel}</span>
        </div>
      </div>

      {/* Freestream Reference Parameters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/40">
        <RefStatCell
          label="자유류 마하수 M∞"
          value={result.machInf.toFixed(3)}
          sub="초음속 (M > 1)"
        />
        <RefStatCell
          label="받음각 α"
          value={`${result.alphaDeg >= 0 ? '+' : ''}${result.alphaDeg.toFixed(2)}°`}
          sub="전연 V1 기준"
        />
        <RefStatCell
          label="비열비 γ"
          value={result.gamma.toFixed(3)}
          sub={fluid ? fluid.formula : 'Custom'}
        />
        <RefStatCell
          label="자유류 마하각 μ∞"
          value={`${result.muInfDeg.toFixed(2)}°`}
          sub="arcsin(1/M∞)"
        />
        <RefStatCell
          label="P-M 함수 ν(M∞)"
          value={`${result.nuInfDeg.toFixed(2)}°`}
          sub="기준 팽창각"
        />
        <RefStatCell
          label="최대 부착각 θmax"
          value={`${result.thetaMaxInfDeg.toFixed(2)}°`}
          sub="M∞에서의 한계각"
        />
      </div>

      {/* Surface-by-Surface Detailed Parameter Table */}
      {!result.isGeometryValid ? (
        <div className="p-6 text-center text-sm text-rose-800 bg-rose-50">
          유효하지 않은 사각형 기하 형상입니다. 좌측 패널에서 볼록 사각형 조건을 확인해 주세요.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-300 text-xs font-semibold text-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">표면 구간</th>
                <th className="py-3 px-3 whitespace-nowrap">발생 파동 유형</th>
                <th
                  className="py-3 px-3 text-right whitespace-nowrap"
                  title="자유류 유동(+x축) 기준 각 표면의 경사각 (받음각 α 변화에 따라 변동)"
                >
                  표면 경사각 φ <span className="font-normal text-slate-500">(유동기준)</span>
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap">유동 편향각 θ</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">파동각 (β / μ)</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">국소 마하수 Mᵢ</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">압력비 pᵢ/p∞</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">온도비 Tᵢ/T∞</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">압력계수 Cₚ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[13px]">
              {result.surfaces.map((s) => (
                <SurfaceRow key={s.id} s={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Explanatory Footer Notes for Each Wave */}
      {result.isGeometryValid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50/70 border-t border-slate-200">
          {result.surfaces.map((s) => {
            const fNum =
              s.id === 'upper_front'
                ? 'F1'
                : s.id === 'upper_rear'
                ? 'F2'
                : s.id === 'lower_front'
                ? 'F3'
                : 'F4';

            return (
              <div
                key={`card-${s.id}`}
                className={`p-3.5 rounded-lg border bg-white ${
                  !s.isValid ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    {fNum} · {s.labelKo}
                  </span>
                  <WaveStatusText s={s} />
                </div>

                {s.isValid ? (
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums text-slate-800 pt-1">
                    <div>
                      <span className="block text-[11px] font-sans text-slate-600">상류→국소 M</span>
                      <span className="font-semibold">
                        {s.upstreamMach.toFixed(2)} → {s.downstreamMach.toFixed(2)}
                      </span>
                    </div>
                    {s.waveType === 'shock' && s.thetaMaxDeg !== null ? (
                      <div>
                        <span className="block text-[11px] font-sans text-slate-600">부착 여유 (θmax−θ)</span>
                        <span className="font-semibold text-slate-900">
                          +{(s.thetaMaxDeg - s.absTurnDeg).toFixed(2)}°
                        </span>
                      </div>
                    ) : s.waveType === 'expansion' && s.nuUpDeg !== null && s.nuDownDeg !== null ? (
                      <div>
                        <span className="block text-[11px] font-sans text-slate-600">P-M 각 ν₁→ν₂</span>
                        <span className="font-semibold text-blue-800">
                          {s.nuUpDeg.toFixed(1)}° → {s.nuDownDeg.toFixed(1)}°
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="block text-[11px] font-sans text-slate-600">길이비 L/c</span>
                        <span className="font-semibold">{s.lengthRatio.toFixed(3)}</span>
                      </div>
                    )}
                    <div>
                      <span className="block text-[11px] font-sans text-slate-600">압력계수 Cₚ</span>
                      <span
                        className={`font-semibold ${
                          s.cp >= 0 ? 'text-red-700' : 'text-blue-700'
                        }`}
                      >
                        {s.cp >= 0 ? '+' : ''}
                        {s.cp.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-rose-800 mt-1">
                    {s.errorReasonKo}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const RefStatCell: React.FC<{ label: string; value: string; sub: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="px-4 py-3">
    <div className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">{label}</div>
    <div className="text-base font-mono tabular-nums font-bold text-slate-900 mt-0.5">
      {value}
    </div>
    <div className="text-[11px] font-mono text-slate-600 mt-0.5">{sub}</div>
  </div>
);

const WaveStatusText: React.FC<{ s: SurfaceSolution }> = ({ s }) => {
  if (s.waveType === 'shock') {
    return <span className="text-xs font-semibold text-red-700">▲ 경사충격파</span>;
  }
  if (s.waveType === 'expansion') {
    return <span className="text-xs font-semibold text-blue-700">▼ P-M 팽창파</span>;
  }
  if (s.waveType === 'mach') {
    return <span className="text-xs font-semibold text-slate-700">— 마하파</span>;
  }
  return <span className="text-xs font-semibold text-rose-800">✖ {s.waveTypeKo}</span>;
};

const SurfaceRow: React.FC<{ s: SurfaceSolution }> = ({ s }) => {
  const fCode =
    s.id === 'upper_front'
      ? 'F1'
      : s.id === 'upper_rear'
      ? 'F2'
      : s.id === 'lower_front'
      ? 'F3'
      : 'F4';
  const vertSpan =
    s.id === 'upper_front'
      ? 'V1→V2'
      : s.id === 'upper_rear'
      ? 'V2→V3'
      : s.id === 'lower_front'
      ? 'V1→V4'
      : 'V4→V3';

  const waveAngleText = !s.isValid
    ? s.thetaMaxDeg !== null
      ? `θmax ${s.thetaMaxDeg.toFixed(1)}°`
      : '—'
    : s.waveType === 'shock' && s.shockBetaDeg !== null
    ? `β = ${s.shockBetaDeg.toFixed(2)}°`
    : s.waveType === 'expansion' && s.mu1Deg !== null && s.mu2Deg !== null
    ? `${s.mu1Deg.toFixed(1)}° → ${s.mu2Deg.toFixed(1)}°`
    : s.mu1Deg !== null
    ? `μ = ${s.mu1Deg.toFixed(2)}°`
    : '—';

  return (
    <tr className={!s.isValid ? 'bg-rose-50/60' : 'hover:bg-slate-50/90 transition-colors'}>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="font-semibold text-slate-900">
          {fCode} · {s.labelKo.split(' (')[0]}
        </div>
        <div className="text-[11px] font-mono tabular-nums text-slate-600">
          {vertSpan} · L/c={s.lengthRatio.toFixed(3)}
        </div>
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <WaveStatusText s={s} />
      </td>
      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
        {s.inclinationDeg >= 0 ? '+' : ''}
        {s.inclinationDeg.toFixed(2)}°
      </td>
      <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
        {s.turnAngleDeg >= 0 ? '+' : ''}
        {s.turnAngleDeg.toFixed(2)}°
      </td>
      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
        {waveAngleText}
      </td>
      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
        {s.isValid ? s.downstreamMach.toFixed(3) : '이탈/아음속'}
      </td>
      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
        {s.isValid ? s.pressureRatio.toFixed(4) : '—'}
      </td>
      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
        {s.isValid ? s.tempRatio.toFixed(4) : '—'}
      </td>
      <td
        className={`py-3 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
          !s.isValid
            ? 'text-rose-800'
            : s.cp >= 0
            ? 'text-red-700'
            : 'text-blue-700'
        }`}
      >
        {s.isValid ? `${s.cp >= 0 ? '+' : ''}${s.cp.toFixed(4)}` : '—'}
      </td>
    </tr>
  );
};
