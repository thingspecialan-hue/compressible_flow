import React, { useEffect, useState } from 'react';
import { RotateCcw, AlertTriangle, Lock, Unlock } from 'lucide-react';
import {
  AIRFOIL_PRESETS,
  AirfoilVertices,
  FLUID_PRESETS,
  ParametricShape,
  WedgeAngles,
  parametricToVertices,
  verticesToParametric,
  verticesToWedgeAngles,
  wedgeAnglesToVertices,
} from '../lib/shockExpansion';

export type GeometryEditMode = 'parametric' | 'wedge' | 'vertices';

export type ActiveGeometryPart =
  | 'upperThickness'
  | 'upperPeakPos'
  | 'lowerThickness'
  | 'lowerPeakPos'
  | 'upperFrontDeg'
  | 'upperRearDeg'
  | 'lowerFrontDeg'
  | 'lowerRearDeg'
  | 'v2'
  | 'v3'
  | 'v4'
  | null;

interface ControlSidebarProps {
  selectedFluidId: string;
  onSelectFluid: (fluidId: string) => void;
  gamma: number;
  onChangeGamma: (gamma: number) => void;
  machInf: number;
  onChangeMach: (mach: number) => void;
  alphaDeg: number;
  onChangeAlpha: (alpha: number) => void;
  vertices: AirfoilVertices;
  onChangeVertices: (v: AirfoilVertices) => void;
  geometryMode: GeometryEditMode;
  onChangeGeometryMode: (mode: GeometryEditMode) => void;
  symmetricLock: boolean;
  onToggleSymmetricLock: () => void;
  isGeometryValid: boolean;
  geometryErrorKo?: string;
  onResetFlow: () => void;
  onResetGeometry: () => void;
  resetSignal?: number;
  activeGeometryPart: ActiveGeometryPart;
  onChangeActiveGeometryPart: React.Dispatch<React.SetStateAction<ActiveGeometryPart>>;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  selectedFluidId,
  onSelectFluid,
  gamma,
  onChangeGamma,
  machInf,
  onChangeMach,
  alphaDeg,
  onChangeAlpha,
  vertices,
  onChangeVertices,
  geometryMode,
  onChangeGeometryMode,
  symmetricLock,
  onToggleSymmetricLock,
  isGeometryValid,
  geometryErrorKo,
  onResetFlow,
  onResetGeometry,
  resetSignal = 0,
  activeGeometryPart,
  onChangeActiveGeometryPart,
}) => {
  const parametric = verticesToParametric(vertices);
  const wedgeAngles = verticesToWedgeAngles(vertices);
  const activeFluid = FLUID_PRESETS.find((f) => f.id === selectedFluidId);

  const [gammaLimitMsg, setGammaLimitMsg] = useState<string | null>(null);
  const [machLimitMsg, setMachLimitMsg] = useState<string | null>(null);
  const [alphaLimitMsg, setAlphaLimitMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resetSignal > 0) {
      setGammaLimitMsg(null);
      setMachLimitMsg(null);
      setAlphaLimitMsg(null);
    }
  }, [resetSignal]);

  const handlePartActive = (part: Exclude<ActiveGeometryPart, null>, active: boolean) => {
    onChangeActiveGeometryPart((prev) => {
      if (active) return part;
      return prev === part ? null : prev;
    });
  };

  const handleParamChange = (key: keyof ParametricShape, val: number) => {
    const next: ParametricShape = { ...parametric, [key]: val };
    if (symmetricLock) {
      if (key === 'upperThicknessRatio') next.lowerThicknessRatio = Math.max(0, val);
      if (key === 'lowerThicknessRatio') {
        if (val <= 0) {
          onToggleSymmetricLock();
        } else {
          next.upperThicknessRatio = val;
        }
      }
      if (key === 'upperPeakPos') next.lowerPeakPos = val;
      if (key === 'lowerPeakPos') next.upperPeakPos = val;
    }
    onChangeVertices(parametricToVertices(next));
  };

  const handleWedgeChange = (key: keyof WedgeAngles, val: number) => {
    const isUpper = key === 'upperFrontDeg' || key === 'upperRearDeg';
    const clamped = isUpper
      ? Math.max(0, Math.min(35, val))
      : Math.max(-25, Math.min(35, val));
    const next: WedgeAngles = { ...wedgeAngles, [key]: clamped };

    // Keep front & rear angles on the same side coherent across 0°
    if (key === 'upperFrontDeg' && clamped === 0) {
      next.upperRearDeg = 0;
    } else if (key === 'upperRearDeg' && clamped === 0) {
      next.upperFrontDeg = 0;
    } else if (key === 'upperFrontDeg' && clamped > 0 && next.upperRearDeg <= 0) {
      next.upperRearDeg = clamped;
    } else if (key === 'upperRearDeg' && clamped > 0 && next.upperFrontDeg <= 0) {
      next.upperFrontDeg = clamped;
    }

    if (key === 'lowerFrontDeg') {
      if (clamped === 0) {
        next.lowerRearDeg = 0;
      } else if (clamped < 0 && next.lowerRearDeg >= 0) {
        next.lowerRearDeg = next.lowerRearDeg === 0 ? clamped : -Math.abs(next.lowerRearDeg);
      } else if (clamped > 0 && next.lowerRearDeg <= 0) {
        next.lowerRearDeg = next.lowerRearDeg === 0 ? clamped : Math.abs(next.lowerRearDeg);
      }
    } else if (key === 'lowerRearDeg') {
      if (clamped === 0) {
        next.lowerFrontDeg = 0;
      } else if (clamped < 0 && next.lowerFrontDeg >= 0) {
        next.lowerFrontDeg = next.lowerFrontDeg === 0 ? clamped : -Math.abs(next.lowerFrontDeg);
      } else if (clamped > 0 && next.lowerFrontDeg <= 0) {
        next.lowerFrontDeg = next.lowerFrontDeg === 0 ? clamped : Math.abs(next.lowerFrontDeg);
      }
    }

    if (symmetricLock) {
      if (key === 'upperFrontDeg') next.lowerFrontDeg = clamped;
      if (key === 'upperRearDeg') next.lowerRearDeg = clamped;
      if (key === 'lowerFrontDeg') {
        if (clamped <= 0) {
          onToggleSymmetricLock();
        } else {
          next.upperFrontDeg = clamped;
        }
      }
      if (key === 'lowerRearDeg') {
        if (clamped <= 0) {
          onToggleSymmetricLock();
        } else {
          next.upperRearDeg = clamped;
        }
      }
    }
    onChangeVertices(wedgeAnglesToVertices(next));
  };

  const handleVertexChange = (
    vertexKey: 'v2' | 'v3' | 'v4',
    axis: 'x' | 'y',
    rawVal: number
  ) => {
    if (isNaN(rawVal)) return;
    const next: AirfoilVertices = {
      ...vertices,
      [vertexKey]: {
        ...vertices[vertexKey],
        [axis]: rawVal,
      },
    };

    if (symmetricLock) {
      const dx = next.v3.x - next.v1.x;
      const dy = next.v3.y - next.v1.y;
      const c = Math.hypot(dx, dy) || 1;
      const ux = dx / c;
      const uy = dy / c;
      const nx = -uy;
      const ny = ux;

      if (vertexKey === 'v2') {
        const rx = next.v2.x - next.v1.x;
        const ry = next.v2.y - next.v1.y;
        const along = rx * ux + ry * uy;
        const perp = Math.max(0, rx * nx + ry * ny);
        next.v2 = {
          x: Number((next.v1.x + along * ux + perp * nx).toFixed(4)),
          y: Number((next.v1.y + along * uy + perp * ny).toFixed(4)),
        };
        next.v4 = {
          x: Number((next.v1.x + along * ux - perp * nx).toFixed(4)),
          y: Number((next.v1.y + along * uy - perp * ny).toFixed(4)),
        };
      } else if (vertexKey === 'v4') {
        const rx = next.v4.x - next.v1.x;
        const ry = next.v4.y - next.v1.y;
        const along = rx * ux + ry * uy;
        const absPerp = Math.max(0, -(rx * nx + ry * ny));
        next.v4 = {
          x: Number((next.v1.x + along * ux - absPerp * nx).toFixed(4)),
          y: Number((next.v1.y + along * uy - absPerp * ny).toFixed(4)),
        };
        next.v2 = {
          x: Number((next.v1.x + along * ux + absPerp * nx).toFixed(4)),
          y: Number((next.v1.y + along * uy + absPerp * ny).toFixed(4)),
        };
      } else if (vertexKey === 'v3') {
        const rx = next.v2.x - next.v1.x;
        const ry = next.v2.y - next.v1.y;
        const along = rx * ux + ry * uy;
        const perp = Math.max(0, rx * nx + ry * ny);
        next.v2 = {
          x: Number((next.v1.x + along * ux + perp * nx).toFixed(4)),
          y: Number((next.v1.y + along * uy + perp * ny).toFixed(4)),
        };
        next.v4 = {
          x: Number((next.v1.x + along * ux - perp * nx).toFixed(4)),
          y: Number((next.v1.y + along * uy - perp * ny).toFixed(4)),
        };
      }
    }

    onChangeVertices(next);
  };

  return (
    <aside className="w-full lg:w-[368px] xl:w-[384px] shrink-0 space-y-4">
      {/* Section 1: Fluid & Flow Conditions */}
      <section className="bg-white border border-slate-300 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">1. 유체 및 유동 조건</h2>
            <p className="text-xs text-slate-600 mt-0.5">Working Fluid &amp; Freestream (M &gt; 1)</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setGammaLimitMsg(null);
              setMachLimitMsg(null);
              setAlphaLimitMsg(null);
              onResetFlow();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="유체 및 유동 조건만 기본값으로 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
        </div>

        {/* Fluid Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="fluid-select" className="text-xs font-semibold text-slate-800">
              작동 유체 (Working Fluid)
            </label>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              {activeFluid ? activeFluid.formula : 'Custom'}
            </span>
          </div>
          <select
            id="fluid-select"
            value={selectedFluidId}
            onChange={(e) => {
              setGammaLimitMsg(null);
              onSelectFluid(e.target.value);
            }}
            className="w-full px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
          >
            {FLUID_PRESETS.map((fluid) => (
              <option key={fluid.id} value={fluid.id}>
                {fluid.nameKo} ({fluid.formula}) — γ = {fluid.gamma.toFixed(3)}
              </option>
            ))}
            <option value="custom">사용자 직접 입력 (Custom γ)</option>
          </select>
          <p className="text-xs text-slate-600">
            {activeFluid ? activeFluid.noteKo : '사용자 지정 비열비(γ)가 적용되었습니다.'}
          </p>
        </div>

        {/* Specific Heat Ratio (gamma) */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="gamma-input" className="text-xs font-semibold text-slate-800">
              비열비 γ (Specific Heat Ratio)
            </label>
            <div className="flex items-center gap-1.5">
              <BoundedDraftInput
                id="gamma-input"
                value={gamma}
                min={1.05}
                max={1.67}
                step={0.001}
                decimals={3}
                minLabel="1.05"
                maxLabel="1.67"
                onCommit={(v) => onChangeGamma(v)}
                onLimitMessage={setGammaLimitMsg}
                className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <input
            type="range"
            min={1.05}
            max={1.67}
            step={0.001}
            value={gamma}
            onChange={(e) => {
              setGammaLimitMsg(null);
              onChangeGamma(parseFloat(e.target.value));
            }}
            aria-label="비열비 γ 슬라이더"
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600">
            <span>1.05 (다원자)</span>
            <span>1.40 (공기)</span>
            <span>1.67 (단원자)</span>
          </div>
          {gammaLimitMsg && (
            <p className="text-xs font-medium text-rose-700">{gammaLimitMsg}</p>
          )}
        </div>

        {/* Freestream Mach Number */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="mach-input" className="text-xs font-semibold text-slate-800">
              자유류 마하수 M<sub>∞</sub>
            </label>
            <BoundedDraftInput
              id="mach-input"
              value={machInf}
              min={1.05}
              max={50}
              step={0.05}
              decimals={2}
              minLabel="1.05"
              maxLabel="50"
              onCommit={(v) => onChangeMach(v)}
              onLimitMessage={setMachLimitMsg}
              className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <input
            type="range"
            min={1.05}
            max={10.0}
            step={0.05}
            value={Math.min(10.0, machInf)}
            onChange={(e) => {
              setMachLimitMsg(null);
              onChangeMach(parseFloat(e.target.value));
            }}
            aria-label="자유류 마하수 M 슬라이더"
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600">
            <span>M 1.05</span>
            <span>M 4.00</span>
            <span>M 7.00</span>
            <span>M 10+</span>
          </div>
          {machLimitMsg && (
            <p className="text-xs font-medium text-rose-700">{machLimitMsg}</p>
          )}
        </div>

        {/* Angle of Attack (alpha) */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="alpha-input" className="text-xs font-semibold text-slate-800">
              받음각 α (Angle of Attack)
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAlphaLimitMsg(null);
                  onChangeAlpha(0);
                }}
                className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                0° 기준
              </button>
              <div className="relative flex items-center">
                <BoundedDraftInput
                  id="alpha-input"
                  value={alphaDeg}
                  min={-90}
                  max={90}
                  step={0.2}
                  decimals={2}
                  minLabel="-90°"
                  maxLabel="90°"
                  onCommit={(v) => onChangeAlpha(v)}
                  onLimitMessage={setAlphaLimitMsg}
                  className="w-20 pr-5 pl-2 py-1 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="absolute right-1.5 text-xs font-mono text-slate-600 pointer-events-none">°</span>
              </div>
            </div>
          </div>
          <input
            type="range"
            min={-20}
            max={20}
            step={0.2}
            value={Math.max(-20, Math.min(20, alphaDeg))}
            onChange={(e) => {
              setAlphaLimitMsg(null);
              onChangeAlpha(parseFloat(e.target.value));
            }}
            aria-label="받음각 α 슬라이더"
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600">
            <span>-20°</span>
            <span>-10°</span>
            <span>0°</span>
            <span>+10°</span>
            <span>+20°</span>
          </div>
          {alphaLimitMsg && (
            <p className="text-xs font-medium text-rose-700">{alphaLimitMsg}</p>
          )}
        </div>
      </section>

      {/* Section 2: Quadrilateral Airfoil Geometry */}
      <section className="bg-white border border-slate-300 rounded-xl p-5 space-y-4">
        <div className="border-b border-slate-200 pb-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-slate-900 whitespace-nowrap">2. 익형 기하 형상</h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onResetGeometry}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="익형 기하 형상만 기본값으로 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>초기화</span>
              </button>
              <button
                type="button"
                onClick={onToggleSymmetricLock}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  symmetricLock
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title={symmetricLock ? '비대칭 자유 편집으로 전환' : '상하 대칭으로 정렬 및 고정'}
              >
                {symmetricLock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{symmetricLock ? '대칭 고정' : '비대칭 자유'}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-600">사각형 단면 · 전연 V1(0,0) 회전 중심 · 4면 자유 변형</p>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-800 block">형상 프리셋</span>
          <div className="grid grid-cols-2 gap-1.5">
            {AIRFOIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  const isSym =
                    Math.abs(preset.shape.upperThicknessRatio - preset.shape.lowerThicknessRatio) < 1e-6 &&
                    Math.abs(preset.shape.upperPeakPos - preset.shape.lowerPeakPos) < 1e-6 &&
                    preset.shape.lowerThicknessRatio > 0;
                  if (!isSym && symmetricLock) {
                    onToggleSymmetricLock();
                  }
                  onChangeVertices(parametricToVertices(preset.shape));
                }}
                className="px-2.5 py-2 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-300 hover:border-blue-400 rounded-lg transition-colors cursor-pointer truncate"
                title={preset.descriptionKo}
              >
                {preset.nameKo}
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => onChangeGeometryMode('parametric')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              geometryMode === 'parametric'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/70'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            두께 · 위치
          </button>
          <button
            type="button"
            onClick={() => onChangeGeometryMode('wedge')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              geometryMode === 'wedge'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/70'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            쐐기각 (°)
          </button>
          <button
            type="button"
            onClick={() => onChangeGeometryMode('vertices')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              geometryMode === 'vertices'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/70'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            4꼭짓점 좌표
          </button>
        </div>

        {/* Mode 1: Thickness & Peak Position */}
        {geometryMode === 'parametric' && (
          <div className="space-y-3.5 pt-1">
            <ParamSliderRow
              label="상면 두께비 (y₂ / c)"
              value={parametric.upperThicknessRatio}
              min={0}
              max={0.22}
              step={0.005}
              display={`${(parametric.upperThicknessRatio * 100).toFixed(1)}%`}
              onChange={(v) => handleParamChange('upperThicknessRatio', v)}
              isHighlighted={activeGeometryPart === 'upperThickness'}
              onActiveChange={(active) => handlePartActive('upperThickness', active)}
            />
            <ParamSliderRow
              label="상면 꼭짓점 위치 (x₂ / c)"
              value={parametric.upperPeakPos}
              min={0.1}
              max={0.9}
              step={0.01}
              display={`${(parametric.upperPeakPos * 100).toFixed(0)}%`}
              onChange={(v) => handleParamChange('upperPeakPos', v)}
              isHighlighted={activeGeometryPart === 'upperPeakPos'}
              onActiveChange={(active) => handlePartActive('upperPeakPos', active)}
            />
            <div className="border-t border-slate-200 pt-3 space-y-3.5">
              <ParamSliderRow
                label="하면 두께비 (−y₄ / c · 음수=겹침)"
                value={parametric.lowerThicknessRatio}
                min={-0.2}
                max={0.22}
                step={0.005}
                display={`${(parametric.lowerThicknessRatio * 100).toFixed(1)}%`}
                onChange={(v) => handleParamChange('lowerThicknessRatio', v)}
                isHighlighted={activeGeometryPart === 'lowerThickness'}
                onActiveChange={(active) => handlePartActive('lowerThickness', active)}
              />
              <ParamSliderRow
                label="하면 꼭짓점 위치 (x₄ / c)"
                value={parametric.lowerPeakPos}
                min={0.1}
                max={0.9}
                step={0.01}
                display={`${(parametric.lowerPeakPos * 100).toFixed(0)}%`}
                onChange={(v) => handleParamChange('lowerPeakPos', v)}
                isHighlighted={activeGeometryPart === 'lowerPeakPos'}
                onActiveChange={(active) => handlePartActive('lowerPeakPos', active)}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between font-mono tabular-nums">
              <span>순 두께비 Δy/c: {((parametric.upperThicknessRatio + parametric.lowerThicknessRatio) * 100).toFixed(1)}%</span>
              <span>앞전 반각: {wedgeAngles.upperFrontDeg.toFixed(1)}° / {wedgeAngles.lowerFrontDeg.toFixed(1)}°</span>
            </div>
          </div>
        )}

        {/* Mode 2: Wedge Angles */}
        {geometryMode === 'wedge' && (
          <div className="space-y-3.5 pt-1">
            <ParamSliderRow
              label="상면 앞전 쐐기각 (ε₁u)"
              value={wedgeAngles.upperFrontDeg}
              min={0}
              max={30}
              step={0.2}
              display={`${wedgeAngles.upperFrontDeg.toFixed(1)}°`}
              onChange={(v) => handleWedgeChange('upperFrontDeg', v)}
              isHighlighted={activeGeometryPart === 'upperFrontDeg'}
              onActiveChange={(active) => handlePartActive('upperFrontDeg', active)}
            />
            <ParamSliderRow
              label="상면 뒷전 쐐기각 (ε₂u)"
              value={wedgeAngles.upperRearDeg}
              min={0}
              max={30}
              step={0.2}
              display={`${wedgeAngles.upperRearDeg.toFixed(1)}°`}
              onChange={(v) => handleWedgeChange('upperRearDeg', v)}
              isHighlighted={activeGeometryPart === 'upperRearDeg'}
              onActiveChange={(active) => handlePartActive('upperRearDeg', active)}
            />
            <div className="border-t border-slate-200 pt-3 space-y-3.5">
              <ParamSliderRow
                label="하면 앞전 쐐기각 (ε₁l · ≤0° 겹침)"
                value={wedgeAngles.lowerFrontDeg}
                min={-25}
                max={30}
                step={0.2}
                display={`${wedgeAngles.lowerFrontDeg.toFixed(1)}°`}
                onChange={(v) => handleWedgeChange('lowerFrontDeg', v)}
                isHighlighted={activeGeometryPart === 'lowerFrontDeg'}
                onActiveChange={(active) => handlePartActive('lowerFrontDeg', active)}
              />
              <ParamSliderRow
                label="하면 뒷전 쐐기각 (ε₂l · ≤0° 겹침)"
                value={wedgeAngles.lowerRearDeg}
                min={-25}
                max={30}
                step={0.2}
                display={`${wedgeAngles.lowerRearDeg.toFixed(1)}°`}
                onChange={(v) => handleWedgeChange('lowerRearDeg', v)}
                isHighlighted={activeGeometryPart === 'lowerRearDeg'}
                onActiveChange={(active) => handlePartActive('lowerRearDeg', active)}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between font-mono tabular-nums">
              <span>전연 총 각: {(wedgeAngles.upperFrontDeg + wedgeAngles.lowerFrontDeg).toFixed(1)}°</span>
              <span>후연 총 각: {(wedgeAngles.upperRearDeg + wedgeAngles.lowerRearDeg).toFixed(1)}°</span>
            </div>
          </div>
        )}

        {/* Mode 3: Direct 4-Vertex Coordinates */}
        {geometryMode === 'vertices' && (
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-[72px_1fr_1fr] gap-2 text-xs font-semibold text-slate-700 px-1">
              <span>꼭짓점</span>
              <span>x / c</span>
              <span>y / c</span>
            </div>
            {/* V1 Fixed Pivot */}
            <div className="grid grid-cols-[72px_1fr_1fr] gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <span className="text-xs font-semibold text-slate-800">V1 (전연)</span>
              <span className="text-xs font-mono tabular-nums text-slate-700 px-2">0.000</span>
              <span className="text-xs font-mono tabular-nums text-slate-700 px-2">0.000</span>
            </div>
            {/* V2 Upper Peak */}
            <VertexCoordRow
              label="V2 (상면)"
              point={vertices.v2}
              onChangeX={(x) => handleVertexChange('v2', 'x', x)}
              onChangeY={(y) => handleVertexChange('v2', 'y', y)}
              isHighlighted={activeGeometryPart === 'v2'}
              onActiveChange={(active) => handlePartActive('v2', active)}
            />
            {/* V3 Trailing Edge */}
            <VertexCoordRow
              label="V3 (후연)"
              point={vertices.v3}
              onChangeX={(x) => handleVertexChange('v3', 'x', x)}
              onChangeY={(y) => handleVertexChange('v3', 'y', y)}
              isHighlighted={activeGeometryPart === 'v3'}
              onActiveChange={(active) => handlePartActive('v3', active)}
            />
            {/* V4 Lower Peak */}
            <VertexCoordRow
              label="V4 (하면)"
              point={vertices.v4}
              onChangeX={(x) => handleVertexChange('v4', 'x', x)}
              onChangeY={(y) => handleVertexChange('v4', 'y', y)}
              isHighlighted={activeGeometryPart === 'v4'}
              onActiveChange={(active) => handlePartActive('v4', active)}
            />
            <p className="text-xs text-slate-600 pt-1">
              우측 2D 다이어그램에서 V2, V3, V4 핸들을 마우스로 드래그해 직접 수정할 수도 있습니다.
            </p>
          </div>
        )}

        {/* Geometry Validity Error */}
        {!isGeometryValid && geometryErrorKo && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{geometryErrorKo}</span>
          </div>
        )}
      </section>
    </aside>
  );
};

interface ParamSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (val: number) => void;
  isHighlighted?: boolean;
  onActiveChange?: (active: boolean) => void;
}

const ParamSliderRow: React.FC<ParamSliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  isHighlighted = false,
  onActiveChange,
}) => {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => setDragging(false);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging]);

  useEffect(() => {
    onActiveChange?.(hovered || dragging || focused);
  }, [hovered, dragging, focused]);

  useEffect(() => {
    return () => {
      onActiveChange?.(false);
    };
  }, []);

  return (
    <div
      className={`space-y-1.5 rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
        isHighlighted ? 'bg-emerald-50/70' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${isHighlighted ? 'text-emerald-900' : 'text-slate-800'}`}>
          {label}
        </span>
        <span
          className={`font-mono tabular-nums font-semibold px-2 py-0.5 rounded border transition-colors ${
            isHighlighted
              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
              : 'bg-slate-100 text-slate-900 border-slate-200'
          }`}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onPointerDown={() => setDragging(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
      />
    </div>
  );
};

interface VertexCoordRowProps {
  label: string;
  point: { x: number; y: number };
  onChangeX: (val: number) => void;
  onChangeY: (val: number) => void;
  isHighlighted?: boolean;
  onActiveChange?: (active: boolean) => void;
}

const VertexCoordRow: React.FC<VertexCoordRowProps> = ({
  label,
  point,
  onChangeX,
  onChangeY,
  isHighlighted = false,
  onActiveChange,
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    onActiveChange?.(hovered || focused);
  }, [hovered, focused]);

  useEffect(() => {
    return () => {
      onActiveChange?.(false);
    };
  }, []);

  return (
    <div
      className={`grid grid-cols-[72px_1fr_1fr] gap-2 items-center rounded-lg px-1.5 py-1 -mx-1.5 transition-colors ${
        isHighlighted ? 'bg-emerald-50/80' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`text-xs font-semibold pl-1 ${isHighlighted ? 'text-emerald-900' : 'text-slate-800'}`}>
        {label}
      </span>
      <input
        type="number"
        step={0.01}
        value={Number(point.x.toFixed(3))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChangeX(parseFloat(e.target.value))}
        aria-label={`${label} x 좌표`}
        className={`w-full px-2 py-1 text-xs font-mono tabular-nums font-semibold bg-white border rounded-md focus:outline-none focus:ring-2 ${
          isHighlighted
            ? 'text-emerald-950 border-emerald-500 focus:ring-emerald-600'
            : 'text-slate-900 border-slate-300 focus:ring-blue-600'
        }`}
      />
      <input
        type="number"
        step={0.01}
        value={Number(point.y.toFixed(3))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChangeY(parseFloat(e.target.value))}
        aria-label={`${label} y 좌표`}
        className={`w-full px-2 py-1 text-xs font-mono tabular-nums font-semibold bg-white border rounded-md focus:outline-none focus:ring-2 ${
          isHighlighted
            ? 'text-emerald-950 border-emerald-500 focus:ring-emerald-600'
            : 'text-slate-900 border-slate-300 focus:ring-blue-600'
        }`}
      />
    </div>
  );
};

interface BoundedDraftInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  minLabel: string;
  maxLabel: string;
  onCommit: (val: number) => void;
  onLimitMessage: (msg: string | null) => void;
  className: string;
}

const BoundedDraftInput: React.FC<BoundedDraftInputProps> = ({
  id,
  value,
  min,
  max,
  step,
  decimals,
  minLabel,
  maxLabel,
  onCommit,
  onLimitMessage,
  className,
}) => {
  const formatted = String(Number(value.toFixed(decimals)));
  const [draft, setDraft] = useState<string>(formatted);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(String(Number(value.toFixed(decimals))));
    }
  }, [value, decimals, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);

    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      onLimitMessage(null);
      return;
    }

    const num = Number(raw);
    if (isNaN(num) || !isFinite(num)) return;

    if (num > max) {
      onLimitMessage(`최대값은 ${maxLabel}입니다.`);
      onCommit(max);
    } else if (num < min) {
      onLimitMessage(null);
    } else {
      onLimitMessage(null);
      onCommit(num);
    }
  };

  const commitFinal = () => {
    setIsFocused(false);
    const trimmed = draft.trim();
    const num = Number(trimmed);
    if (trimmed === '' || isNaN(num) || !isFinite(num)) {
      setDraft(String(Number(value.toFixed(decimals))));
      onLimitMessage(null);
      return;
    }
    if (num > max) {
      onCommit(max);
      setDraft(String(Number(max.toFixed(decimals))));
      onLimitMessage(`최대값은 ${maxLabel}입니다.`);
    } else if (num < min) {
      onCommit(min);
      setDraft(String(Number(min.toFixed(decimals))));
      onLimitMessage(`최소값은 ${minLabel}입니다.`);
    } else {
      onCommit(num);
      setDraft(String(Number(num.toFixed(decimals))));
      onLimitMessage(null);
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      data-step={step}
      value={draft}
      onFocus={() => setIsFocused(true)}
      onChange={handleChange}
      onBlur={commitFinal}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commitFinal();
          e.currentTarget.blur();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const delta = e.key === 'ArrowUp' ? step : -step;
          const base = isNaN(Number(draft)) || draft.trim() === '' ? value : Number(draft);
          const next = Math.min(max, Math.max(min, Number((base + delta).toFixed(decimals))));
          onCommit(next);
          setDraft(String(next));
          onLimitMessage(null);
        }
      }}
      className={className}
    />
  );
};
