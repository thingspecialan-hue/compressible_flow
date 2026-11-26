import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AirfoilAeroResult } from '../lib/shockExpansion';

type PressureUnit = 'Pa' | 'kPa' | 'atm';

const PRESSURE_TO_PA: Record<PressureUnit, number> = {
  Pa: 1,
  kPa: 1000,
  atm: 101325,
};

const DEFAULT_PRESSURE_PA = 101325;
const DEFAULT_CHORD_M = 1.0;
const DEFAULT_SPAN_M = 5.0;

interface DimensionalForcesPanelProps {
  result: AirfoilAeroResult;
  resetSignal?: number;
}

function formatScaledUnit(
  value: number,
  baseUnit: string,
  allowSign: boolean
): { primary: string; secondary: string } {
  if (!Number.isFinite(value)) {
    return { primary: '—', secondary: '계산 범위 초과' };
  }
  const abs = Math.abs(value);
  const sign = allowSign && value < 0 ? '-' : '';

  const formatNum = (n: number, decimals: number) =>
    n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  let primary = '';
  if (abs === 0) {
    primary = `0.00 ${baseUnit}`;
  } else if (abs < 1e-3) {
    primary = `${value.toExponential(3)} ${baseUnit}`;
  } else if (abs < 1000) {
    primary = `${sign}${formatNum(abs, 2)} ${baseUnit}`;
  } else if (abs < 1e6) {
    primary = `${sign}${formatNum(abs / 1e3, 3)} k${baseUnit}`;
  } else if (abs < 1e9) {
    primary = `${sign}${formatNum(abs / 1e6, 3)} M${baseUnit}`;
  } else if (abs < 1e12) {
    primary = `${sign}${formatNum(abs / 1e9, 3)} G${baseUnit}`;
  } else {
    primary = `${value.toExponential(3)} ${baseUnit}`;
  }

  const secondary =
    abs === 0
      ? `0 ${baseUnit}`
      : abs >= 1e9 || abs < 1e-2
      ? `${value.toExponential(3)} ${baseUnit}`
      : `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${baseUnit}`;

  return { primary, secondary };
}

function formatArea(areaM2: number): string {
  if (!Number.isFinite(areaM2)) return '—';
  if (areaM2 < 1e-3 || areaM2 >= 1e7) {
    return `${areaM2.toExponential(3)} m²`;
  }
  return `${areaM2.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} m²`;
}

export const DimensionalForcesPanel: React.FC<DimensionalForcesPanelProps> = ({
  result,
  resetSignal = 0,
}) => {
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('Pa');
  const [staticPressurePa, setStaticPressurePa] = useState<number>(DEFAULT_PRESSURE_PA);
  const [chordM, setChordM] = useState<number>(DEFAULT_CHORD_M);
  const [spanM, setSpanM] = useState<number>(DEFAULT_SPAN_M);

  const [pressureError, setPressureError] = useState<string | null>(null);
  const [chordError, setChordError] = useState<string | null>(null);
  const [spanError, setSpanError] = useState<string | null>(null);

  const displayedPressure = staticPressurePa / PRESSURE_TO_PA[pressureUnit];
  const pressureDecimals = pressureUnit === 'Pa' ? 2 : 4;

  const qInfPa = 0.5 * result.gamma * staticPressurePa * result.machInf * result.machInf;
  const wingAreaM2 = chordM * spanM;
  const validAero = result.isGeometryValid && result.isAttached;

  const liftN = validAero ? qInfPa * wingAreaM2 * result.cl : NaN;
  const dragN = validAero ? qInfPa * wingAreaM2 * result.cd : NaN;

  const qFmt = formatScaledUnit(qInfPa, 'Pa', false);
  const liftFmt = validAero
    ? formatScaledUnit(liftN, 'N', true)
    : { primary: '—', secondary: '이탈 충격파 / 형상 오류' };
  const dragFmt = validAero
    ? formatScaledUnit(dragN, 'N', true)
    : { primary: '—', secondary: '이탈 충격파 / 형상 오류' };

  const handleReset = () => {
    setPressureUnit('Pa');
    setStaticPressurePa(DEFAULT_PRESSURE_PA);
    setChordM(DEFAULT_CHORD_M);
    setSpanM(DEFAULT_SPAN_M);
    setPressureError(null);
    setChordError(null);
    setSpanError(null);
  };

  useEffect(() => {
    if (resetSignal > 0) {
      handleReset();
    }
  }, [resetSignal]);

  return (
    <section
      id="dimensional-forces"
      className="bg-white border border-slate-300 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            실차원 양력 · 항력 환산 (Dimensional Lift &amp; Drag)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            현재 유동 조건(γ={result.gamma.toFixed(3)}, M<sub>∞</sub>={result.machInf.toFixed(2)}) 및 무차원 계수(C<sub>l</sub>, C<sub>d</sub>)에 실제 정압과 날개 치수를 곱해 힘을 계산합니다
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="실차원 입력값 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>기본값 복원</span>
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* 3 Dimensional Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Freestream Static Pressure p_inf */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="dim-pressure-input" className="text-xs font-semibold text-slate-800">
                자유류 정압 p<sub>∞</sub>
              </label>
              <div className="inline-flex rounded-md border border-slate-300 bg-white overflow-hidden">
                {(['Pa', 'kPa', 'atm'] as PressureUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setPressureUnit(u);
                      setPressureError(null);
                    }}
                    className={`px-2 py-0.5 text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                      pressureUnit === u
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex items-center">
              <PositiveDraftInput
                id="dim-pressure-input"
                value={displayedPressure}
                decimals={pressureDecimals}
                resetKey={pressureUnit}
                onCommit={(val) => setStaticPressurePa(val * PRESSURE_TO_PA[pressureUnit])}
                onError={setPressureError}
                className="w-full pr-12 pl-3 py-2 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="absolute right-3 text-xs font-mono font-medium text-slate-600 pointer-events-none">
                {pressureUnit}
              </span>
            </div>
            {pressureError ? (
              <p className="text-xs font-medium text-rose-700">{pressureError}</p>
            ) : (
              <p className="text-[11px] font-mono tabular-nums text-slate-600">
                기준값: {staticPressurePa.toLocaleString('en-US', { maximumFractionDigits: 2 })} Pa · 상한 제한 없음
              </p>
            )}
          </div>

          {/* Chord Length c */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="dim-chord-input" className="text-xs font-semibold text-slate-800">
                코드 길이 c (Chord)
              </label>
              <span className="text-[11px] font-mono text-slate-600">m</span>
            </div>
            <div className="relative flex items-center">
              <PositiveDraftInput
                id="dim-chord-input"
                value={chordM}
                decimals={4}
                onCommit={setChordM}
                onError={setChordError}
                className="w-full pr-10 pl-3 py-2 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="absolute right-3 text-xs font-mono font-medium text-slate-600 pointer-events-none">
                m
              </span>
            </div>
            {chordError ? (
              <p className="text-xs font-medium text-rose-700">{chordError}</p>
            ) : (
              <p className="text-[11px] text-slate-600">
                전연~후연 기준 시위 길이 (0 초과 자유 입력)
              </p>
            )}
          </div>

          {/* Wing Span b */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="dim-span-input" className="text-xs font-semibold text-slate-800">
                날개 폭 b (Wing Span)
              </label>
              <span className="text-[11px] font-mono text-slate-600">m</span>
            </div>
            <div className="relative flex items-center">
              <PositiveDraftInput
                id="dim-span-input"
                value={spanM}
                decimals={4}
                onCommit={setSpanM}
                onError={setSpanError}
                className="w-full pr-10 pl-3 py-2 text-right text-sm font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="absolute right-3 text-xs font-mono font-medium text-slate-600 pointer-events-none">
                m
              </span>
            </div>
            {spanError ? (
              <p className="text-xs font-medium text-rose-700">{spanError}</p>
            ) : (
              <p className="text-[11px] text-slate-600">
                2D 단면 적분용 날개 스팬 길이 (0 초과 자유 입력)
              </p>
            )}
          </div>
        </div>

        {/* 4 Output Cards: q_inf, S, L, D */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-700">자유류 동압 q<sub>∞</sub></span>
            <div className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-slate-900 mt-1 truncate" title={qFmt.secondary}>
              {qFmt.primary}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-600 mt-1 truncate">
              {qFmt.secondary}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-700">기준 익면 S (c · b)</span>
            <div className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-slate-900 mt-1 truncate">
              {formatArea(wingAreaM2)}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-600 mt-1 truncate">
              {chordM} m × {spanM} m
            </span>
          </div>

          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-950">실제 양력 L</span>
            <div className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-blue-800 mt-1 truncate" title={liftFmt.secondary}>
              {liftFmt.primary}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-700 mt-1 truncate">
              {validAero ? `${liftFmt.secondary} · Cl=${result.cl.toFixed(4)}` : liftFmt.secondary}
            </span>
          </div>

          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-rose-950">실제 조파항력 D</span>
            <div className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-red-800 mt-1 truncate" title={dragFmt.secondary}>
              {dragFmt.primary}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-700 mt-1 truncate">
              {validAero ? `${dragFmt.secondary} · Cd=${result.cd.toFixed(4)}` : dragFmt.secondary}
            </span>
          </div>
        </div>
      </div>

      {/* Formula Footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
        <span>q∞ = ½ · γ · p∞ · M∞²</span>
        <span>S = c · b</span>
        <span>L = q∞ · S · Cl · D = q∞ · S · Cd</span>
      </div>
    </section>
  );
};

interface PositiveDraftInputProps {
  id: string;
  value: number;
  decimals: number;
  resetKey?: string;
  onCommit: (val: number) => void;
  onError: (msg: string | null) => void;
  className: string;
}

const PositiveDraftInput: React.FC<PositiveDraftInputProps> = ({
  id,
  value,
  decimals,
  resetKey,
  onCommit,
  onError,
  className,
}) => {
  const formatVal = (v: number) => {
    if (Math.abs(v) >= 1e9 || (Math.abs(v) > 0 && Math.abs(v) < 1e-4)) {
      return String(v);
    }
    return String(Number(v.toFixed(decimals)));
  };

  const [draft, setDraft] = useState<string>(() => formatVal(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatVal(value));
    }
  }, [value, decimals, resetKey, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);

    if (raw.trim() === '' || raw === '.' || raw === '-' || raw.endsWith('e') || raw.endsWith('e-') || raw.endsWith('e+')) {
      onError(null);
      return;
    }

    const num = Number(raw);
    if (isNaN(num) || !isFinite(num)) {
      onError('유효한 숫자를 입력하세요.');
      return;
    }
    if (num <= 0) {
      onError('0보다 큰 값을 입력하세요.');
      return;
    }
    onError(null);
    onCommit(num);
  };

  const commitFinal = () => {
    setIsFocused(false);
    const trimmed = draft.trim();
    const num = Number(trimmed);
    if (trimmed === '' || isNaN(num) || !isFinite(num) || num <= 0) {
      setDraft(formatVal(value));
      onError(trimmed !== '' && !isNaN(num) && num <= 0 ? '0보다 큰 값을 입력하세요.' : null);
      return;
    }
    onCommit(num);
    setDraft(formatVal(num));
    onError(null);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setIsFocused(true)}
      onChange={handleChange}
      onBlur={commitFinal}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commitFinal();
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
};
