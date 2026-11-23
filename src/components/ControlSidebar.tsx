import React from 'react';
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
  onResetAll: () => void;
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
  onResetAll,
}) => {
  const parametric = verticesToParametric(vertices);
  const wedgeAngles = verticesToWedgeAngles(vertices);
  const activeFluid = FLUID_PRESETS.find((f) => f.id === selectedFluidId);

  const handleParamChange = (key: keyof ParametricShape, val: number) => {
    const next: ParametricShape = { ...parametric, [key]: val };
    if (symmetricLock) {
      if (key === 'upperThicknessRatio') next.lowerThicknessRatio = val;
      if (key === 'lowerThicknessRatio') next.upperThicknessRatio = val;
      if (key === 'upperPeakPos') next.lowerPeakPos = val;
      if (key === 'lowerPeakPos') next.upperPeakPos = val;
    }
    onChangeVertices(parametricToVertices(next));
  };

  const handleWedgeChange = (key: keyof WedgeAngles, val: number) => {
    const clamped = Math.max(0.5, Math.min(40, val));
    const next: WedgeAngles = { ...wedgeAngles, [key]: clamped };
    if (symmetricLock) {
      if (key === 'upperFrontDeg') next.lowerFrontDeg = clamped;
      if (key === 'lowerFrontDeg') next.upperFrontDeg = clamped;
      if (key === 'upperRearDeg') next.lowerRearDeg = clamped;
      if (key === 'lowerRearDeg') next.upperRearDeg = clamped;
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
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="기본값으로 초기화"
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
            onChange={(e) => onSelectFluid(e.target.value)}
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
              <input
                id="gamma-input"
                type="number"
                min={1.05}
                max={1.67}
                step={0.001}
                value={Number(gamma.toFixed(3))}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) onChangeGamma(Math.min(1.67, Math.max(1.05, v)));
                }}
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
            onChange={(e) => onChangeGamma(parseFloat(e.target.value))}
            aria-label="비열비 γ 슬라이더"
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600">
            <span>1.05 (다원자)</span>
            <span>1.40 (공기)</span>
            <span>1.67 (단원자)</span>
          </div>
        </div>

        {/* Freestream Mach Number */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="mach-input" className="text-xs font-semibold text-slate-800">
              자유류 마하수 M<sub>∞</sub>
            </label>
            <input
              id="mach-input"
              type="number"
              min={1.05}
              max={8.0}
              step={0.05}
              value={Number(machInf.toFixed(2))}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChangeMach(Math.min(8.0, Math.max(1.05, v)));
              }}
              className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <input
            type="range"
            min={1.05}
            max={6.0}
            step={0.05}
            value={Math.min(6.0, machInf)}
            onChange={(e) => onChangeMach(parseFloat(e.target.value))}
            aria-label="자유류 마하수 M 슬라이더"
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600">
            <span>M 1.05</span>
            <span>M 2.50</span>
            <span>M 4.50</span>
            <span>M 6.0+</span>
          </div>
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
                onClick={() => onChangeAlpha(0)}
                className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                0° 기준
              </button>
              <div className="relative flex items-center">
                <input
                  id="alpha-input"
                  type="number"
                  min={-25}
                  max={25}
                  step={0.2}
                  value={Number(alphaDeg.toFixed(2))}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onChangeAlpha(Math.min(25, Math.max(-25, v)));
                  }}
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
            onChange={(e) => onChangeAlpha(parseFloat(e.target.value))}
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
        </div>
      </section>

      {/* Section 2: Quadrilateral Airfoil Geometry */}
      <section className="bg-white border border-slate-300 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">2. 익형 기하 형상 (사각형 단면)</h2>
            <p className="text-xs text-slate-600 mt-0.5">전연 V1(0,0) 회전 중심 · 4면 자유 변형</p>
          </div>
          <button
            type="button"
            onClick={onToggleSymmetricLock}
            disabled={geometryMode === 'vertices'}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              geometryMode === 'vertices'
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : symmetricLock
                ? 'bg-blue-50 text-blue-800 border-blue-300 cursor-pointer'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
            }`}
            title="상하 대칭 구속 전환"
          >
            {symmetricLock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{symmetricLock ? '대칭 고정' : '비대칭 자유'}</span>
          </button>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-800 block">형상 프리셋</span>
          <div className="grid grid-cols-2 gap-1.5">
            {AIRFOIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeVertices(parametricToVertices(preset.shape))}
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
              min={0.01}
              max={0.22}
              step={0.005}
              display={`${(parametric.upperThicknessRatio * 100).toFixed(1)}%`}
              onChange={(v) => handleParamChange('upperThicknessRatio', v)}
            />
            <ParamSliderRow
              label="상면 꼭짓점 위치 (x₂ / c)"
              value={parametric.upperPeakPos}
              min={0.1}
              max={0.9}
              step={0.01}
              display={`${(parametric.upperPeakPos * 100).toFixed(0)}%`}
              onChange={(v) => handleParamChange('upperPeakPos', v)}
            />
            <div className="border-t border-slate-200 pt-3 space-y-3.5">
              <ParamSliderRow
                label="하면 두께비 (|y₄| / c)"
                value={parametric.lowerThicknessRatio}
                min={0.01}
                max={0.22}
                step={0.005}
                display={`${(parametric.lowerThicknessRatio * 100).toFixed(1)}%`}
                onChange={(v) => handleParamChange('lowerThicknessRatio', v)}
              />
              <ParamSliderRow
                label="하면 꼭짓점 위치 (x₄ / c)"
                value={parametric.lowerPeakPos}
                min={0.1}
                max={0.9}
                step={0.01}
                display={`${(parametric.lowerPeakPos * 100).toFixed(0)}%`}
                onChange={(v) => handleParamChange('lowerPeakPos', v)}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between font-mono tabular-nums">
              <span>총 두께비 t/c: {((parametric.upperThicknessRatio + parametric.lowerThicknessRatio) * 100).toFixed(1)}%</span>
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
              min={1}
              max={30}
              step={0.2}
              display={`${wedgeAngles.upperFrontDeg.toFixed(1)}°`}
              onChange={(v) => handleWedgeChange('upperFrontDeg', v)}
            />
            <ParamSliderRow
              label="상면 뒷전 쐐기각 (ε₂u)"
              value={wedgeAngles.upperRearDeg}
              min={1}
              max={30}
              step={0.2}
              display={`${wedgeAngles.upperRearDeg.toFixed(1)}°`}
              onChange={(v) => handleWedgeChange('upperRearDeg', v)}
            />
            <div className="border-t border-slate-200 pt-3 space-y-3.5">
              <ParamSliderRow
                label="하면 앞전 쐐기각 (ε₁l)"
                value={wedgeAngles.lowerFrontDeg}
                min={1}
                max={30}
                step={0.2}
                display={`${wedgeAngles.lowerFrontDeg.toFixed(1)}°`}
                onChange={(v) => handleWedgeChange('lowerFrontDeg', v)}
              />
              <ParamSliderRow
                label="하면 뒷전 쐐기각 (ε₂l)"
                value={wedgeAngles.lowerRearDeg}
                min={1}
                max={30}
                step={0.2}
                display={`${wedgeAngles.lowerRearDeg.toFixed(1)}°`}
                onChange={(v) => handleWedgeChange('lowerRearDeg', v)}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between font-mono tabular-nums">
              <span>전연 총 쐐기각: {(wedgeAngles.upperFrontDeg + wedgeAngles.lowerFrontDeg).toFixed(1)}°</span>
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
            />
            {/* V3 Trailing Edge */}
            <VertexCoordRow
              label="V3 (후연)"
              point={vertices.v3}
              onChangeX={(x) => handleVertexChange('v3', 'x', x)}
              onChangeY={(y) => handleVertexChange('v3', 'y', y)}
            />
            {/* V4 Lower Peak */}
            <VertexCoordRow
              label="V4 (하면)"
              point={vertices.v4}
              onChangeX={(x) => handleVertexChange('v4', 'x', x)}
              onChangeY={(y) => handleVertexChange('v4', 'y', y)}
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
}

const ParamSliderRow: React.FC<ParamSliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className="font-mono tabular-nums font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        {display}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={Math.min(max, Math.max(min, value))}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
    />
  </div>
);

interface VertexCoordRowProps {
  label: string;
  point: { x: number; y: number };
  onChangeX: (val: number) => void;
  onChangeY: (val: number) => void;
}

const VertexCoordRow: React.FC<VertexCoordRowProps> = ({ label, point, onChangeX, onChangeY }) => (
  <div className="grid grid-cols-[72px_1fr_1fr] gap-2 items-center">
    <span className="text-xs font-semibold text-slate-800 pl-1">{label}</span>
    <input
      type="number"
      step={0.01}
      value={Number(point.x.toFixed(3))}
      onChange={(e) => onChangeX(parseFloat(e.target.value))}
      aria-label={`${label} x 좌표`}
      className="w-full px-2 py-1 text-xs font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
    />
    <input
      type="number"
      step={0.01}
      value={Number(point.y.toFixed(3))}
      onChange={(e) => onChangeY(parseFloat(e.target.value))}
      aria-label={`${label} y 좌표`}
      className="w-full px-2 py-1 text-xs font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
    />
  </div>
);
