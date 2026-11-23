export interface Point2D {
  x: number;
  y: number;
}

export interface AirfoilVertices {
  v1: Point2D; // Leading Edge (fixed pivot at 0,0)
  v2: Point2D; // Upper Peak
  v3: Point2D; // Trailing Edge
  v4: Point2D; // Lower Peak
}

export interface ParametricShape {
  upperThicknessRatio: number; // t_u / c (0.01 to 0.25)
  lowerThicknessRatio: number; // t_l / c (0.01 to 0.25)
  upperPeakPos: number;        // x_u / c (0.10 to 0.90)
  lowerPeakPos: number;        // x_l / c (0.10 to 0.90)
}

export interface WedgeAngles {
  upperFrontDeg: number; // eps_1u
  upperRearDeg: number;  // eps_2u
  lowerFrontDeg: number; // eps_1l
  lowerRearDeg: number;  // eps_2l
}

export interface FluidPreset {
  id: string;
  nameKo: string;
  formula: string;
  gamma: number;
  noteKo: string;
}

export const FLUID_PRESETS: FluidPreset[] = [
  { id: 'air', nameKo: '공기 (표준 대기)', formula: 'Air', gamma: 1.4, noteKo: '이원자 혼합기체 (상온 기본값)' },
  { id: 'n2', nameKo: '질소', formula: 'N₂', gamma: 1.4, noteKo: '이원자 기체' },
  { id: 'o2', nameKo: '산소', formula: 'O₂', gamma: 1.395, noteKo: '이원자 기체' },
  { id: 'h2', nameKo: '수소', formula: 'H₂', gamma: 1.405, noteKo: '경량 이원자 기체' },
  { id: 'he', nameKo: '헬륨', formula: 'He', gamma: 1.667, noteKo: '단원자 불활성 기체' },
  { id: 'ar', nameKo: '아르곤', formula: 'Ar', gamma: 1.667, noteKo: '단원자 불활성 기체' },
  { id: 'co2', nameKo: '이산화탄소', formula: 'CO₂', gamma: 1.289, noteKo: '선형 삼원자 기체' },
  { id: 'ch4', nameKo: '메탄', formula: 'CH₄', gamma: 1.304, noteKo: '다원자 탄화수소' },
  { id: 'h2o', nameKo: '수증기 (고온)', formula: 'H₂O', gamma: 1.33, noteKo: '삼원자 기체' },
  { id: 'combustion', nameKo: '고온 연소가스', formula: 'Exhaust', gamma: 1.24, noteKo: '추진 노즐/로켓 배기가스' },
  { id: 'sf6', nameKo: '육불화황', formula: 'SF₆', gamma: 1.094, noteKo: '고분자량 극저비열비 기체' },
];

export interface AirfoilPreset {
  id: string;
  nameKo: string;
  descriptionKo: string;
  shape: ParametricShape;
}

export const AIRFOIL_PRESETS: AirfoilPreset[] = [
  {
    id: 'sym-12',
    nameKo: '대칭 마름모 (12%)',
    descriptionKo: '표준 상하 대칭 다이아몬드 익형 (t/c = 0.12)',
    shape: { upperThicknessRatio: 0.06, lowerThicknessRatio: 0.06, upperPeakPos: 0.5, lowerPeakPos: 0.5 },
  },
  {
    id: 'thin-6',
    nameKo: '초음속 박형 마름모 (6%)',
    descriptionKo: '저항력 고마하수용 얇은 대칭 마름모 (t/c = 0.06)',
    shape: { upperThicknessRatio: 0.03, lowerThicknessRatio: 0.03, upperPeakPos: 0.5, lowerPeakPos: 0.5 },
  },
  {
    id: 'asym-camber',
    nameKo: '비대칭 사각형',
    descriptionKo: '상면 전방 돌출 · 하면 완만한 비대칭 단면',
    shape: { upperThicknessRatio: 0.08, lowerThicknessRatio: 0.04, upperPeakPos: 0.35, lowerPeakPos: 0.55 },
  },
  {
    id: 'fwd-wedge',
    nameKo: '전방 쐐기형',
    descriptionKo: '최대 두께가 앞전에 가까운 전방 치우침 마름모',
    shape: { upperThicknessRatio: 0.05, lowerThicknessRatio: 0.05, upperPeakPos: 0.28, lowerPeakPos: 0.28 },
  },
];

export type WaveType = 'shock' | 'expansion' | 'mach' | 'detached' | 'subsonic';

export interface SurfaceSolution {
  id: 'upper_front' | 'upper_rear' | 'lower_front' | 'lower_rear';
  labelKo: string;
  shortLabel: string;
  stream: 'upper' | 'lower';
  start: Point2D;        // rotated freestream-aligned coordinates
  end: Point2D;
  lengthRatio: number;   // L_i / c
  inclinationDeg: number; // angle of surface w.r.t freestream (+x)
  turnAngleDeg: number;   // signed turning angle (>0 compression, <0 expansion)
  absTurnDeg: number;     // |theta|
  waveType: WaveType;
  waveTypeKo: string;
  upstreamMach: number;
  downstreamMach: number; // M_i on this surface
  shockBetaDeg: number | null;       // beta for oblique shock (relative to upstream flow)
  shockWorldAngleDeg: number | null; // global angle of shock line from +x
  thetaMaxDeg: number | null;        // max attached deflection at upstreamMach
  nuUpDeg: number | null;
  nuDownDeg: number | null;
  mu1Deg: number | null;             // leading Mach angle of fan
  mu2Deg: number | null;             // trailing Mach angle of fan
  pressureRatio: number;             // p_i / p_inf
  tempRatio: number;                 // T_i / T_inf
  densityRatio: number;              // rho_i / rho_inf
  cp: number;                        // pressure coefficient
  outwardNormal: Point2D;
  isValid: boolean;
  errorReasonKo?: string;
}

export interface TrailingWaveInfo {
  valid: boolean;
  slipstreamAngleDeg: number;
  upperWaveType: 'shock' | 'expansion' | 'mach';
  lowerWaveType: 'shock' | 'expansion' | 'mach';
  upperAngleDeg: number; // global wave angle
  lowerAngleDeg: number;
  upperMu2Deg?: number;
  lowerMu2Deg?: number;
}

export interface AirfoilAeroResult {
  isGeometryValid: boolean;
  geometryErrorKo?: string;
  isAttached: boolean;
  detachedFaces: string[];
  chordLength: number;
  rotatedVertices: AirfoilVertices;
  machInf: number;
  alphaDeg: number;
  gamma: number;
  muInfDeg: number;
  thetaMaxInfDeg: number;
  nuInfDeg: number;
  surfaces: SurfaceSolution[];
  cl: number;
  cd: number;
  ldRatio: number;
  cmLe: number;
  trailingWaves: TrailingWaveInfo;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function toRad(deg: number): number {
  return deg * DEG2RAD;
}

export function toDeg(rad: number): number {
  return rad * RAD2DEG;
}

/**
 * Convert ParametricShape -> AirfoilVertices (V1=(0,0), V3=(1,0))
 */
export function parametricToVertices(shape: ParametricShape): AirfoilVertices {
  return {
    v1: { x: 0, y: 0 },
    v2: { x: shape.upperPeakPos, y: shape.upperThicknessRatio },
    v3: { x: 1, y: 0 },
    v4: { x: shape.lowerPeakPos, y: -shape.lowerThicknessRatio },
  };
}

/**
 * Convert WedgeAngles -> AirfoilVertices (V1=(0,0), V3=(1,0))
 */
export function wedgeAnglesToVertices(angles: WedgeAngles): AirfoilVertices {
  const e1u = toRad(Math.max(0.5, Math.min(45, angles.upperFrontDeg)));
  const e2u = toRad(Math.max(0.5, Math.min(45, angles.upperRearDeg)));
  const e1l = toRad(Math.max(0.5, Math.min(45, angles.lowerFrontDeg)));
  const e2l = toRad(Math.max(0.5, Math.min(45, angles.lowerRearDeg)));

  const xu = Math.tan(e2u) / (Math.tan(e1u) + Math.tan(e2u));
  const yu = xu * Math.tan(e1u);

  const xl = Math.tan(e2l) / (Math.tan(e1l) + Math.tan(e2l));
  const yl = -xl * Math.tan(e1l);

  return {
    v1: { x: 0, y: 0 },
    v2: { x: Number(xu.toFixed(4)), y: Number(yu.toFixed(4)) },
    v3: { x: 1, y: 0 },
    v4: { x: Number(xl.toFixed(4)), y: Number(yl.toFixed(4)) },
  };
}

/**
 * Extract WedgeAngles relative to chord line V1 -> V3
 */
export function verticesToWedgeAngles(v: AirfoilVertices): WedgeAngles {
  const chordAngle = Math.atan2(v.v3.y - v.v1.y, v.v3.x - v.v1.x);
  const rot = (p: Point2D): Point2D => {
    const dx = p.x - v.v1.x;
    const dy = p.y - v.v1.y;
    return {
      x: dx * Math.cos(-chordAngle) - dy * Math.sin(-chordAngle),
      y: dx * Math.sin(-chordAngle) + dy * Math.cos(-chordAngle),
    };
  };
  const p2 = rot(v.v2);
  const p3 = rot(v.v3);
  const p4 = rot(v.v4);

  return {
    upperFrontDeg: toDeg(Math.atan2(p2.y, Math.max(1e-6, p2.x))),
    upperRearDeg: toDeg(Math.atan2(p2.y, Math.max(1e-6, p3.x - p2.x))),
    lowerFrontDeg: toDeg(Math.atan2(-p4.y, Math.max(1e-6, p4.x))),
    lowerRearDeg: toDeg(Math.atan2(-p4.y, Math.max(1e-6, p3.x - p4.x))),
  };
}

/**
 * Extract ParametricShape normalized by chord length
 */
export function verticesToParametric(v: AirfoilVertices): ParametricShape {
  const dx = v.v3.x - v.v1.x;
  const dy = v.v3.y - v.v1.y;
  const c = Math.hypot(dx, dy) || 1;
  const chordAngle = Math.atan2(dy, dx);
  const rot = (p: Point2D): Point2D => {
    const rx = p.x - v.v1.x;
    const ry = p.y - v.v1.y;
    return {
      x: (rx * Math.cos(-chordAngle) - ry * Math.sin(-chordAngle)) / c,
      y: (rx * Math.sin(-chordAngle) + ry * Math.cos(-chordAngle)) / c,
    };
  };
  const p2 = rot(v.v2);
  const p4 = rot(v.v4);
  return {
    upperThicknessRatio: Math.max(0.005, p2.y),
    lowerThicknessRatio: Math.max(0.005, -p4.y),
    upperPeakPos: Math.min(0.95, Math.max(0.05, p2.x)),
    lowerPeakPos: Math.min(0.95, Math.max(0.05, p4.x)),
  };
}

/**
 * Validate quadrilateral convexity (clockwise V1 -> V2 -> V3 -> V4)
 */
export function validateAirfoilGeometry(v: AirfoilVertices): { valid: boolean; reasonKo?: string; chordLength: number } {
  const chordVec = { x: v.v3.x - v.v1.x, y: v.v3.y - v.v1.y };
  const chordLength = Math.hypot(chordVec.x, chordVec.y);
  if (chordLength < 0.05) {
    return { valid: false, reasonKo: '전연(V1)과 후연(V3) 사이 코드 길이가 너무 짧습니다.', chordLength };
  }

  const pts = [v.v1, v.v2, v.v3, v.v4];
  // Check strict clockwise convexity: cross product (p[i+1]-p[i]) x (p[i+2]-p[i+1]) < 0
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const bcx = c.x - b.x;
    const bcy = c.y - b.y;
    if (Math.hypot(abx, aby) < 1e-4) {
      return { valid: false, reasonKo: '인접한 두 꼭짓점이 겹쳐 있습니다.', chordLength };
    }
    const cross = abx * bcy - aby * bcx;
    if (cross >= -1e-6) {
      return {
        valid: false,
        reasonKo: '사각형이 볼록(Convex) 형태가 아니거나 꼭짓점 순서(V1→V2→V3→V4 시계방향)가 어긋났습니다.',
        chordLength,
      };
    }
  }

  return { valid: true, chordLength };
}

/**
 * Prandtl-Meyer function nu(M) in radians
 */
export function prandtlMeyerNu(M: number, gamma: number): number {
  if (M <= 1) return 0;
  const gp1 = gamma + 1;
  const gm1 = gamma - 1;
  const k = Math.sqrt(gp1 / gm1);
  const m2m1 = M * M - 1;
  return k * Math.atan(Math.sqrt((gm1 / gp1) * m2m1)) - Math.atan(Math.sqrt(m2m1));
}

/**
 * Inverse Prandtl-Meyer: find M >= 1 such that nu(M) = targetNuRad
 */
export function inversePrandtlMeyer(targetNuRad: number, gamma: number): number | null {
  if (targetNuRad <= 0) return 1.0;
  const nuMax = (Math.PI / 2) * (Math.sqrt((gamma + 1) / (gamma - 1)) - 1);
  if (targetNuRad >= nuMax - 1e-6) {
    return null; // Vacuum limit exceeded
  }

  let lo = 1.0;
  let hi = 2.0;
  while (prandtlMeyerNu(hi, gamma) < targetNuRad && hi < 500) {
    lo = hi;
    hi *= 2;
  }

  for (let i = 0; i < 64; i++) {
    const mid = 0.5 * (lo + hi);
    const val = prandtlMeyerNu(mid, gamma);
    if (val < targetNuRad) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

/**
 * Maximum deflection angle theta_max (radians) and corresponding beta_max (radians)
 */
export function maxObliqueShockDeflection(M1: number, gamma: number): { thetaMaxRad: number; betaMaxRad: number } {
  if (M1 <= 1) return { thetaMaxRad: 0, betaMaxRad: Math.PI / 2 };
  const m2 = M1 * M1;
  const gp1 = gamma + 1;
  const gm1 = gamma - 1;
  const term = gp1 * (1 + (gm1 / 2) * m2 + (gp1 / 16) * m2 * m2);
  let sin2BetaMax = ((gp1 / 4) * m2 - 1 + Math.sqrt(term)) / (gamma * m2);
  sin2BetaMax = Math.min(1, Math.max(1 / m2, sin2BetaMax));
  const betaMaxRad = Math.asin(Math.sqrt(sin2BetaMax));
  const thetaMaxRad = obliqueShockTheta(M1, betaMaxRad, gamma);
  return { thetaMaxRad, betaMaxRad };
}

/**
 * Theta-Beta-M relation: returns theta (radians) for given M1, beta (radians), gamma
 */
export function obliqueShockTheta(M1: number, betaRad: number, gamma: number): number {
  const sinB = Math.sin(betaRad);
  const cos2B = Math.cos(2 * betaRad);
  const m2 = M1 * M1;
  const num = 2 * (1 / Math.tan(betaRad)) * (m2 * sinB * sinB - 1);
  const den = m2 * (gamma + cos2B) + 2;
  return Math.atan(num / den);
}

/**
 * Solve weak oblique shock wave angle beta (radians) for deflection thetaRad > 0
 */
export function solveObliqueShock(
  M1: number,
  thetaRad: number,
  gamma: number
): {
  status: 'ok' | 'detached' | 'subsonic';
  betaRad: number | null;
  thetaMaxRad: number;
  M2: number | null;
  p2p1: number;
  t2t1: number;
  rho2rho1: number;
} {
  const { thetaMaxRad, betaMaxRad } = maxObliqueShockDeflection(M1, gamma);
  if (thetaRad > thetaMaxRad) {
    return {
      status: 'detached',
      betaRad: null,
      thetaMaxRad,
      M2: null,
      p2p1: NaN,
      t2t1: NaN,
      rho2rho1: NaN,
    };
  }

  const mu = Math.asin(1 / M1);
  if (thetaRad <= 1e-9) {
    return {
      status: 'ok',
      betaRad: mu,
      thetaMaxRad,
      M2: M1,
      p2p1: 1,
      t2t1: 1,
      rho2rho1: 1,
    };
  }

  let lo = mu;
  let hi = betaMaxRad;
  for (let i = 0; i < 64; i++) {
    const mid = 0.5 * (lo + hi);
    const t = obliqueShockTheta(M1, mid, gamma);
    if (t < thetaRad) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const betaRad = 0.5 * (lo + hi);
  const mn1 = M1 * Math.sin(betaRad);
  const mn1Sq = mn1 * mn1;
  const gp1 = gamma + 1;
  const gm1 = gamma - 1;

  const mn2Sq = (1 + (gm1 / 2) * mn1Sq) / (gamma * mn1Sq - gm1 / 2);
  const mn2 = Math.sqrt(Math.max(0, mn2Sq));
  const M2 = mn2 / Math.sin(betaRad - thetaRad);

  const p2p1 = 1 + ((2 * gamma) / gp1) * (mn1Sq - 1);
  const rho2rho1 = (gp1 * mn1Sq) / (gm1 * mn1Sq + 2);
  const t2t1 = p2p1 / rho2rho1;

  if (M2 <= 1.0) {
    return {
      status: 'subsonic',
      betaRad,
      thetaMaxRad,
      M2,
      p2p1,
      t2t1,
      rho2rho1,
    };
  }

  return {
    status: 'ok',
    betaRad,
    thetaMaxRad,
    M2,
    p2p1,
    t2t1,
    rho2rho1,
  };
}

/**
 * Solve Prandtl-Meyer expansion across turning angle dThetaRad > 0
 */
export function solvePrandtlMeyer(
  M1: number,
  dThetaRad: number,
  gamma: number
): {
  ok: boolean;
  M2: number | null;
  nu1Rad: number;
  nu2Rad: number;
  mu1Rad: number;
  mu2Rad: number | null;
  p2p1: number;
  t2t1: number;
  rho2rho1: number;
} {
  const nu1Rad = prandtlMeyerNu(M1, gamma);
  const nu2Rad = nu1Rad + dThetaRad;
  const mu1Rad = Math.asin(1 / M1);
  const M2 = inversePrandtlMeyer(nu2Rad, gamma);
  if (M2 === null) {
    return {
      ok: false,
      M2: null,
      nu1Rad,
      nu2Rad,
      mu1Rad,
      mu2Rad: null,
      p2p1: NaN,
      t2t1: NaN,
      rho2rho1: NaN,
    };
  }
  const mu2Rad = Math.asin(1 / M2);
  const gm1 = gamma - 1;
  const t2t1 = (1 + (gm1 / 2) * M1 * M1) / (1 + (gm1 / 2) * M2 * M2);
  const p2p1 = Math.pow(t2t1, gamma / gm1);
  const rho2rho1 = Math.pow(t2t1, 1 / gm1);

  return {
    ok: true,
    M2,
    nu1Rad,
    nu2Rad,
    mu1Rad,
    mu2Rad,
    p2p1,
    t2t1,
    rho2rho1,
  };
}

/**
 * Compute pressure ratio across a deflection from upstream (M, inclination) to target inclination
 */
function pressureAfterTurn(
  M: number,
  signedTurnIntoStreamRad: number,
  pBase: number,
  gamma: number
): { ok: boolean; p: number; M2: number; type: 'shock' | 'expansion' | 'mach'; waveAngleLocalRad: number; mu2LocalRad?: number } {
  if (Math.abs(signedTurnIntoStreamRad) < 1e-7) {
    return { ok: true, p: pBase, M2: M, type: 'mach', waveAngleLocalRad: Math.asin(1 / M) };
  }
  if (signedTurnIntoStreamRad > 0) {
    const s = solveObliqueShock(M, signedTurnIntoStreamRad, gamma);
    if (s.status !== 'ok' || s.M2 === null || s.betaRad === null) {
      return { ok: false, p: NaN, M2: NaN, type: 'shock', waveAngleLocalRad: NaN };
    }
    return { ok: true, p: pBase * s.p2p1, M2: s.M2, type: 'shock', waveAngleLocalRad: s.betaRad };
  } else {
    const e = solvePrandtlMeyer(M, -signedTurnIntoStreamRad, gamma);
    if (!e.ok || e.M2 === null || e.mu2Rad === null) {
      return { ok: false, p: NaN, M2: NaN, type: 'expansion', waveAngleLocalRad: NaN };
    }
    return {
      ok: true,
      p: pBase * e.p2p1,
      M2: e.M2,
      type: 'expansion',
      waveAngleLocalRad: e.mu1Rad,
      mu2LocalRad: e.mu2Rad,
    };
  }
}

/**
 * Main Airfoil Shock-Expansion Solver
 */
export function solveAirfoilShockExpansion(
  vertices: AirfoilVertices,
  machInf: number,
  alphaDeg: number,
  gamma: number
): AirfoilAeroResult {
  const validation = validateAirfoilGeometry(vertices);
  const M = Math.max(1.01, machInf);
  const g = Math.max(1.05, Math.min(1.67, gamma));
  const muInfDeg = toDeg(Math.asin(1 / M));
  const { thetaMaxRad: thetaMaxInfRad } = maxObliqueShockDeflection(M, g);
  const thetaMaxInfDeg = toDeg(thetaMaxInfRad);
  const nuInfDeg = toDeg(prandtlMeyerNu(M, g));

  // Rotate airfoil clockwise by (alpha + chordTilt) around V1=(0,0)
  const chordTiltRad = Math.atan2(vertices.v3.y - vertices.v1.y, vertices.v3.x - vertices.v1.x);
  const rotCCWRad = -(toRad(alphaDeg) + chordTiltRad);
  const cosR = Math.cos(rotCCWRad);
  const sinR = Math.sin(rotCCWRad);

  const rotatePt = (p: Point2D): Point2D => {
    const dx = p.x - vertices.v1.x;
    const dy = p.y - vertices.v1.y;
    return {
      x: dx * cosR - dy * sinR,
      y: dx * sinR + dy * cosR,
    };
  };

  const rotatedVertices: AirfoilVertices = {
    v1: { x: 0, y: 0 },
    v2: rotatePt(vertices.v2),
    v3: rotatePt(vertices.v3),
    v4: rotatePt(vertices.v4),
  };

  if (!validation.valid) {
    return {
      isGeometryValid: false,
      geometryErrorKo: validation.reasonKo,
      isAttached: false,
      detachedFaces: [],
      chordLength: validation.chordLength,
      rotatedVertices,
      machInf: M,
      alphaDeg,
      gamma: g,
      muInfDeg,
      thetaMaxInfDeg,
      nuInfDeg,
      surfaces: [],
      cl: NaN,
      cd: NaN,
      ldRatio: NaN,
      cmLe: NaN,
      trailingWaves: {
        valid: false,
        slipstreamAngleDeg: 0,
        upperWaveType: 'shock',
        lowerWaveType: 'shock',
        upperAngleDeg: 0,
        lowerAngleDeg: 0,
      },
    };
  }

  const c = validation.chordLength;
  const qFactor = (g / 2) * M * M;

  const solveFace = (
    id: SurfaceSolution['id'],
    labelKo: string,
    shortLabel: string,
    stream: 'upper' | 'lower',
    start: Point2D,
    end: Point2D,
    upstreamInclinationRad: number,
    upstreamMach: number,
    upstreamPRatio: number,
    upstreamTRatio: number,
    upstreamRhoRatio: number,
    upstreamValid: boolean
  ): SurfaceSolution => {
    const tx = end.x - start.x;
    const ty = end.y - start.y;
    const L = Math.hypot(tx, ty);
    const incRad = Math.atan2(ty, tx);

    // Outward normal: upper faces (left of t), lower faces (right of t)
    const outwardNormal: Point2D =
      stream === 'upper' ? { x: -ty / L, y: tx / L } : { x: ty / L, y: -tx / L };

    // Positive turnIntoStreamRad means surface turns INTO the flow (compression / shock)
    const deltaRad = incRad - upstreamInclinationRad;
    const turnIntoStreamRad = stream === 'upper' ? deltaRad : -deltaRad;
    const absTurnRad = Math.abs(turnIntoStreamRad);

    if (!upstreamValid || isNaN(upstreamMach) || upstreamMach <= 1.0) {
      return {
        id,
        labelKo,
        shortLabel,
        stream,
        start,
        end,
        lengthRatio: L / c,
        inclinationDeg: toDeg(incRad),
        turnAngleDeg: toDeg(turnIntoStreamRad),
        absTurnDeg: toDeg(absTurnRad),
        waveType: 'subsonic',
        waveTypeKo: '상류 유동 해석 불가',
        upstreamMach,
        downstreamMach: NaN,
        shockBetaDeg: null,
        shockWorldAngleDeg: null,
        thetaMaxDeg: null,
        nuUpDeg: null,
        nuDownDeg: null,
        mu1Deg: null,
        mu2Deg: null,
        pressureRatio: NaN,
        tempRatio: NaN,
        densityRatio: NaN,
        cp: NaN,
        outwardNormal,
        isValid: false,
        errorReasonKo: '상류 표면에서 이탈 충격파 또는 아음속 영역이 발생하여 연속 해석이 중단되었습니다.',
      };
    }

    if (absTurnRad < 1e-6) {
      const mu = toDeg(Math.asin(1 / upstreamMach));
      const cp = (upstreamPRatio - 1) / qFactor;
      return {
        id,
        labelKo,
        shortLabel,
        stream,
        start,
        end,
        lengthRatio: L / c,
        inclinationDeg: toDeg(incRad),
        turnAngleDeg: 0,
        absTurnDeg: 0,
        waveType: 'mach',
        waveTypeKo: '마하파 (변향 없음)',
        upstreamMach,
        downstreamMach: upstreamMach,
        shockBetaDeg: mu,
        shockWorldAngleDeg: toDeg(
          stream === 'upper' ? upstreamInclinationRad + toRad(mu) : upstreamInclinationRad - toRad(mu)
        ),
        thetaMaxDeg: toDeg(maxObliqueShockDeflection(upstreamMach, g).thetaMaxRad),
        nuUpDeg: toDeg(prandtlMeyerNu(upstreamMach, g)),
        nuDownDeg: toDeg(prandtlMeyerNu(upstreamMach, g)),
        mu1Deg: mu,
        mu2Deg: mu,
        pressureRatio: upstreamPRatio,
        tempRatio: upstreamTRatio,
        densityRatio: upstreamRhoRatio,
        cp,
        outwardNormal,
        isValid: true,
      };
    }

    if (turnIntoStreamRad > 0) {
      const shock = solveObliqueShock(upstreamMach, absTurnRad, g);
      const thetaMaxDeg = toDeg(shock.thetaMaxRad);

      if (shock.status === 'detached' || shock.betaRad === null) {
        return {
          id,
          labelKo,
          shortLabel,
          stream,
          start,
          end,
          lengthRatio: L / c,
          inclinationDeg: toDeg(incRad),
          turnAngleDeg: toDeg(turnIntoStreamRad),
          absTurnDeg: toDeg(absTurnRad),
          waveType: 'detached',
          waveTypeKo: '이탈 충격파 (Detached)',
          upstreamMach,
          downstreamMach: NaN,
          shockBetaDeg: null,
          shockWorldAngleDeg: null,
          thetaMaxDeg,
          nuUpDeg: null,
          nuDownDeg: null,
          mu1Deg: null,
          mu2Deg: null,
          pressureRatio: NaN,
          tempRatio: NaN,
          densityRatio: NaN,
          cp: NaN,
          outwardNormal,
          isValid: false,
          errorReasonKo: `편향각 θ=${toDeg(absTurnRad).toFixed(2)}°가 한계각 θmax=${thetaMaxDeg.toFixed(2)}°를 초과했습니다.`,
        };
      }

      const betaDeg = toDeg(shock.betaRad);
      const worldShockRad =
        stream === 'upper' ? upstreamInclinationRad + shock.betaRad : upstreamInclinationRad - shock.betaRad;
      const pRatio = upstreamPRatio * shock.p2p1;
      const tRatio = upstreamTRatio * shock.t2t1;
      const rhoRatio = upstreamRhoRatio * shock.rho2rho1;
      const cp = (pRatio - 1) / qFactor;

      if (shock.status === 'subsonic' || shock.M2 === null) {
        return {
          id,
          labelKo,
          shortLabel,
          stream,
          start,
          end,
          lengthRatio: L / c,
          inclinationDeg: toDeg(incRad),
          turnAngleDeg: toDeg(turnIntoStreamRad),
          absTurnDeg: toDeg(absTurnRad),
          waveType: 'subsonic',
          waveTypeKo: '충격파 후류 아음속 전환',
          upstreamMach,
          downstreamMach: shock.M2 ?? NaN,
          shockBetaDeg: betaDeg,
          shockWorldAngleDeg: toDeg(worldShockRad),
          thetaMaxDeg,
          nuUpDeg: null,
          nuDownDeg: null,
          mu1Deg: null,
          mu2Deg: null,
          pressureRatio: pRatio,
          tempRatio: tRatio,
          densityRatio: rhoRatio,
          cp,
          outwardNormal,
          isValid: false,
          errorReasonKo: `부착 충격파 후류 마하수(M=${shock.M2?.toFixed(3)})가 1.0 이하로 감소했습니다.`,
        };
      }

      return {
        id,
        labelKo,
        shortLabel,
        stream,
        start,
        end,
        lengthRatio: L / c,
        inclinationDeg: toDeg(incRad),
        turnAngleDeg: toDeg(turnIntoStreamRad),
        absTurnDeg: toDeg(absTurnRad),
        waveType: 'shock',
        waveTypeKo: '경사충격파 (Oblique Shock)',
        upstreamMach,
        downstreamMach: shock.M2,
        shockBetaDeg: betaDeg,
        shockWorldAngleDeg: toDeg(worldShockRad),
        thetaMaxDeg,
        nuUpDeg: null,
        nuDownDeg: null,
        mu1Deg: null,
        mu2Deg: null,
        pressureRatio: pRatio,
        tempRatio: tRatio,
        densityRatio: rhoRatio,
        cp,
        outwardNormal,
        isValid: true,
      };
    } else {
      // Prandtl-Meyer Expansion
      const pm = solvePrandtlMeyer(upstreamMach, absTurnRad, g);
      if (!pm.ok || pm.M2 === null || pm.mu2Rad === null) {
        return {
          id,
          labelKo,
          shortLabel,
          stream,
          start,
          end,
          lengthRatio: L / c,
          inclinationDeg: toDeg(incRad),
          turnAngleDeg: toDeg(turnIntoStreamRad),
          absTurnDeg: toDeg(absTurnRad),
          waveType: 'subsonic',
          waveTypeKo: '팽창 한계 초과 (진공)',
          upstreamMach,
          downstreamMach: NaN,
          shockBetaDeg: null,
          shockWorldAngleDeg: null,
          thetaMaxDeg: null,
          nuUpDeg: toDeg(pm.nu1Rad),
          nuDownDeg: null,
          mu1Deg: toDeg(pm.mu1Rad),
          mu2Deg: null,
          pressureRatio: NaN,
          tempRatio: NaN,
          densityRatio: NaN,
          cp: NaN,
          outwardNormal,
          isValid: false,
          errorReasonKo: '이론적 최대 Prandtl-Meyer 팽창각(νmax)을 초과했습니다.',
        };
      }

      const pRatio = upstreamPRatio * pm.p2p1;
      const tRatio = upstreamTRatio * pm.t2t1;
      const rhoRatio = upstreamRhoRatio * pm.rho2rho1;
      const cp = (pRatio - 1) / qFactor;

      return {
        id,
        labelKo,
        shortLabel,
        stream,
        start,
        end,
        lengthRatio: L / c,
        inclinationDeg: toDeg(incRad),
        turnAngleDeg: toDeg(turnIntoStreamRad),
        absTurnDeg: toDeg(absTurnRad),
        waveType: 'expansion',
        waveTypeKo: 'Prandtl-Meyer 팽창파',
        upstreamMach,
        downstreamMach: pm.M2,
        shockBetaDeg: null,
        shockWorldAngleDeg: null,
        thetaMaxDeg: null,
        nuUpDeg: toDeg(pm.nu1Rad),
        nuDownDeg: toDeg(pm.nu2Rad),
        mu1Deg: toDeg(pm.mu1Rad),
        mu2Deg: toDeg(pm.mu2Rad),
        pressureRatio: pRatio,
        tempRatio: tRatio,
        densityRatio: rhoRatio,
        cp,
        outwardNormal,
        isValid: true,
      };
    }
  };

  // Solve Upper Stream: Face 1 (V1 -> V2), Face 2 (V2 -> V3)
  const s1 = solveFace(
    'upper_front',
    '상면 전방 (Face 1)',
    'Upper Front',
    'upper',
    rotatedVertices.v1,
    rotatedVertices.v2,
    0,
    M,
    1,
    1,
    1,
    true
  );

  const s2 = solveFace(
    'upper_rear',
    '상면 후방 (Face 2)',
    'Upper Rear',
    'upper',
    rotatedVertices.v2,
    rotatedVertices.v3,
    toRad(s1.inclinationDeg),
    s1.downstreamMach,
    s1.pressureRatio,
    s1.tempRatio,
    s1.densityRatio,
    s1.isValid
  );

  // Solve Lower Stream: Face 3 (V1 -> V4), Face 4 (V4 -> V3)
  const s3 = solveFace(
    'lower_front',
    '하면 전방 (Face 3)',
    'Lower Front',
    'lower',
    rotatedVertices.v1,
    rotatedVertices.v4,
    0,
    M,
    1,
    1,
    1,
    true
  );

  const s4 = solveFace(
    'lower_rear',
    '하면 후방 (Face 4)',
    'Lower Rear',
    'lower',
    rotatedVertices.v4,
    rotatedVertices.v3,
    toRad(s3.inclinationDeg),
    s3.downstreamMach,
    s3.pressureRatio,
    s3.tempRatio,
    s3.densityRatio,
    s3.isValid
  );

  const surfaces = [s1, s2, s3, s4];
  const detachedFaces = surfaces.filter((s) => !s.isValid).map((s) => s.labelKo);
  const isAttached = detachedFaces.length === 0;

  let cl = NaN;
  let cd = NaN;
  let ldRatio = NaN;
  let cmLe = NaN;

  if (isAttached) {
    cl = 0;
    cd = 0;
    cmLe = 0;
    for (const s of surfaces) {
      const fx = s.cp * (-s.outwardNormal.x) * s.lengthRatio;
      const fy = s.cp * (-s.outwardNormal.y) * s.lengthRatio;
      cd += fx;
      cl += fy;
      // Midpoint relative to V1=(0,0), normalized by chord c
      const rx = 0.5 * (s.start.x + s.end.x) / c;
      const ry = 0.5 * (s.start.y + s.end.y) / c;
      // Nose-up positive moment about LE: r_y * fx - r_x * fy
      cmLe += ry * fx - rx * fy;
    }
    ldRatio = Math.abs(cd) > 1e-9 ? cl / cd : 0;
  }

  // Trailing edge wave calculation for visual completeness (slipstream pressure match)
  let trailingWaves: TrailingWaveInfo = {
    valid: false,
    slipstreamAngleDeg: 0,
    upperWaveType: 'shock',
    lowerWaveType: 'shock',
    upperAngleDeg: 0,
    lowerAngleDeg: 0,
  };

  if (isAttached) {
    const phiU = toRad(s2.inclinationDeg);
    const phiL = toRad(s4.inclinationDeg);
    // Find slipstream angle phi_slip between phiU and phiL (or slightly wider) where pU == pL
    const loSlip = Math.min(phiU, phiL) - toRad(10);
    const hiSlip = Math.max(phiU, phiL) + toRad(10);

    const evalDiff = (phiSlip: number) => {
      // Upper stream turns from phiU to phiSlip: if phiSlip > phiU, turns UP (into upper stream -> shock)
      const uRes = pressureAfterTurn(s2.downstreamMach, phiSlip - phiU, s2.pressureRatio, g);
      // Lower stream turns from phiL to phiSlip: if phiSlip < phiL, turns DOWN (into lower stream -> shock)
      const lRes = pressureAfterTurn(s4.downstreamMach, phiL - phiSlip, s4.pressureRatio, g);
      return { diff: uRes.p - lRes.p, uRes, lRes };
    };

    // Bracket search between phiU and phiL
    let a = Math.min(phiU, phiL) - toRad(2);
    let b = Math.max(phiU, phiL) + toRad(2);
    let found = false;
    let fa = evalDiff(a).diff;
    let fb = evalDiff(b).diff;

    if (!isNaN(fa) && !isNaN(fb) && fa * fb <= 0) {
      found = true;
    } else {
      // Try tighter bracket inside [phiU, phiL]
      a = phiU;
      b = phiL;
      fa = evalDiff(a).diff;
      fb = evalDiff(b).diff;
      if (!isNaN(fa) && !isNaN(fb) && fa * fb <= 0) found = true;
    }

    if (found) {
      for (let i = 0; i < 40; i++) {
        const mid = 0.5 * (a + b);
        const fm = evalDiff(mid).diff;
        if (isNaN(fm)) break;
        if (fa * fm <= 0) {
          b = mid;
          fb = fm;
        } else {
          a = mid;
          fa = fm;
        }
      }
      const phiSlip = 0.5 * (a + b);
      const finalEval = evalDiff(phiSlip);
      if (finalEval.uRes.ok && finalEval.lRes.ok) {
        trailingWaves = {
          valid: true,
          slipstreamAngleDeg: toDeg(phiSlip),
          upperWaveType: finalEval.uRes.type,
          lowerWaveType: finalEval.lRes.type,
          upperAngleDeg: toDeg(phiU + finalEval.uRes.waveAngleLocalRad),
          lowerAngleDeg: toDeg(phiL - finalEval.lRes.waveAngleLocalRad),
          upperMu2Deg:
            finalEval.uRes.mu2LocalRad !== undefined ? toDeg(phiSlip + finalEval.uRes.mu2LocalRad) : undefined,
          lowerMu2Deg:
            finalEval.lRes.mu2LocalRad !== undefined ? toDeg(phiSlip - finalEval.lRes.mu2LocalRad) : undefined,
        };
      }
    } else {
      // Fallback visual waves returning toward freestream (0 deg)
      const uRes = pressureAfterTurn(s2.downstreamMach, 0 - phiU, s2.pressureRatio, g);
      const lRes = pressureAfterTurn(s4.downstreamMach, phiL - 0, s4.pressureRatio, g);
      if (uRes.ok && lRes.ok) {
        trailingWaves = {
          valid: true,
          slipstreamAngleDeg: 0,
          upperWaveType: uRes.type,
          lowerWaveType: lRes.type,
          upperAngleDeg: toDeg(phiU + uRes.waveAngleLocalRad),
          lowerAngleDeg: toDeg(phiL - lRes.waveAngleLocalRad),
        };
      }
    }
    void loSlip;
    void hiSlip;
  }

  return {
    isGeometryValid: true,
    isAttached,
    detachedFaces,
    chordLength: c,
    rotatedVertices,
    machInf: M,
    alphaDeg,
    gamma: g,
    muInfDeg,
    thetaMaxInfDeg,
    nuInfDeg,
    surfaces,
    cl,
    cd,
    ldRatio,
    cmLe,
    trailingWaves,
  };
}

export interface SweepPoint {
  xValue: number;
  cl: number | null;
  cd: number | null;
  ldRatio: number | null;
  isAttached: boolean;
}

/**
 * Generate parametric sweep data over AoA or Mach
 */
export function generateParametricSweep(
  vertices: AirfoilVertices,
  machInf: number,
  alphaDeg: number,
  gamma: number,
  mode: 'alpha' | 'mach'
): SweepPoint[] {
  const points: SweepPoint[] = [];
  if (mode === 'alpha') {
    const steps = 61; // -15 to +15 every 0.5 deg
    for (let i = 0; i < steps; i++) {
      const a = -15 + i * 0.5;
      const res = solveAirfoilShockExpansion(vertices, machInf, a, gamma);
      points.push({
        xValue: Number(a.toFixed(2)),
        cl: res.isAttached ? res.cl : null,
        cd: res.isAttached ? res.cd : null,
        ldRatio: res.isAttached ? res.ldRatio : null,
        isAttached: res.isAttached,
      });
    }
  } else {
    const steps = 56; // 1.15 to 5.0
    for (let i = 0; i < steps; i++) {
      const m = 1.15 + (i / (steps - 1)) * (5.0 - 1.15);
      const res = solveAirfoilShockExpansion(vertices, m, alphaDeg, gamma);
      points.push({
        xValue: Number(m.toFixed(3)),
        cl: res.isAttached ? res.cl : null,
        cd: res.isAttached ? res.cd : null,
        ldRatio: res.isAttached ? res.ldRatio : null,
        isAttached: res.isAttached,
      });
    }
  }
  return points;
}
