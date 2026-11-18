// ═══════════════════════════════════════════════════════════════
// SCORING ENGINE — updated from Filters_and_ranges.xlsx
// ═══════════════════════════════════════════════════════════════

export const OVERHEAD_COST_COEFF = 0.015
export const FACTOR_OF_SAFETY    = 1.5
export const LABOUR_COST_COEFF   = 1.666667
export const TMU_SECONDS_FACTOR  = 0.036

// ── NATURE ──────────────────────────────────────────────────────
export const NATURE_OPTIONS = [
  { label: 'Non-Destructive',  value: 'NonDestructive' },
  { label: 'Destructive',      value: 'Destructive' },
  { label: 'Semi Destructive', value: 'SemiDestructive' },
]

// ── DEI: TIME ───────────────────────────────────────────────────
export const TIME_OPTIONS = [
  { label: '< 5 secs',  value: '<5',   score: 0  },
  { label: '25 secs',   value: '25',   score: 5  },
  { label: '50 secs',   value: '50',   score: 10 },
  { label: '90 secs',   value: '90',   score: 15 },
  { label: '140 secs',  value: '140',  score: 20 },
  { label: '210 secs',  value: '210',  score: 25 },
]

// ── DEI: TOOL ───────────────────────────────────────────────────
export const TOOL_OPTIONS = [
  { label: 'None',       value: 'None',       score: 0  },
  { label: 'Air Gun',    value: 'AirGun',     score: 2  },
  { label: 'Mechanic',   value: 'Mechanic',   score: 4  },
  { label: 'OEM',        value: 'OEM',        score: 6  },
  { label: 'Special',    value: 'Special',    score: 8  },
  { label: 'Improvised', value: 'Improvised', score: 10 },
]

// ── DEI: FIXTURE ────────────────────────────────────────────────
export const FIXTURE_OPTIONS = [
  { label: 'None',       value: 'None',       score: 0  },
  { label: 'One-Hand',   value: 'OneHand',    score: 3  },
  { label: 'Two-Hands',  value: 'TwoHands',   score: 6  },
  { label: 'Clamps',     value: 'Clamps',     score: 9  },
  { label: 'Winch',      value: 'Winch',      score: 12 },
  { label: 'Automation', value: 'Automation', score: 15 },
]

// ── DEI: ACCESS ─────────────────────────────────────────────────
export const ACCESS_OPTIONS = [
  { label: 'Z-Axis',      value: 'ZAxis',      score: 0  },
  { label: 'XY-Axis',     value: 'XYAxis',     score: 3  },
  { label: 'Deep',        value: 'Deep',       score: 6  },
  { label: 'From Below',  value: 'FromBelow',  score: 9  },
  { label: 'Dual Axis',   value: 'DualAxis',   score: 12 },
  { label: 'Not Visible', value: 'NotVisible', score: 15 },
]

// ── DEI: TRAINING ───────────────────────────────────────────────
export const INSTRUCTION_OPTIONS = [
  { label: 'None',          value: 'None',         score: 0  },
  { label: '10-20 secs',    value: '10-20secs',    score: 2  },
  { label: '> 30 secs',     value: '>30secs',      score: 4  },
  { label: 'Group Discuss', value: 'GroupDiscuss', score: 6  },
  { label: 'Contact OEM',   value: 'ContactOEM',   score: 8  },
  { label: 'Training',      value: 'Training',     score: 10 },
]

// ── DEI: HAZARD ─────────────────────────────────────────────────
export const HAZARD_OPTIONS = [
  { label: 'None',          value: 'None',        score: 0 },
  { label: 'Gloves',        value: 'Gloves',      score: 1 },
  { label: 'Face Mask',     value: 'FaceMask',    score: 2 },
  { label: 'Fire Problem',  value: 'FireProblem', score: 3 },
  { label: 'Air Supply',    value: 'AirSupply',   score: 4 },
  { label: 'Body Suit',     value: 'BodySuit',    score: 5 },
]

// ── DEI: FORCE TYPE ─────────────────────────────────────────────
export const FORCE_TYPE_OPTIONS = [
  { label: 'Unfasten', value: 'Unfasten' },
  { label: 'Human',    value: 'Human' },
  { label: 'Machine',  value: 'Machine' },
]

// ── DEI: FORCE — Unfasten ────────────────────────────────────────
export const FORCE_UNFASTEN_OPTIONS = [
  { label: 'Axial',       value: 'Axial',      score: 0  },
  { label: 'Torsional',   value: 'Torsional',  score: 4  },
  { label: 'Orthogonal',  value: 'Orthogonal', score: 8  },
  { label: 'Leverage',    value: 'Leverage',   score: 12 },
  { label: 'Low Impact',  value: 'LowImpact',  score: 16 },
  { label: 'High Impact', value: 'HighImpact', score: 20 },
]

// ── DEI: FORCE — Human ──────────────────────────────────────────
export const FORCE_HUMAN_OPTIONS = [
  { label: '1 kg',  value: '1kg',  score: 0  },
  { label: '3 kg',  value: '3kg',  score: 4  },
  { label: '7 kg',  value: '7kg',  score: 8  },
  { label: '11 kg', value: '11kg', score: 12 },
  { label: '16 kg', value: '16kg', score: 16 },
  { label: '23 kg', value: '23kg', score: 20 },
]

// ── DEI: FORCE — Machine ─────────────────────────────────────────
export const FORCE_MACHINE_OPTIONS = [
  { label: '23 kg',  value: '23kg',  score: 0  },
  { label: '34 kg',  value: '34kg',  score: 4  },
  { label: '50 kg',  value: '50kg',  score: 8  },
  { label: '73 kg',  value: '73kg',  score: 12 },
  { label: '100 kg', value: '100kg', score: 16 },
  { label: '136 kg', value: '136kg', score: 20 },
]

// ── DEI: FORCE (legacy fallback / combined) ──────────────────────
export const FORCE_OPTIONS = FORCE_MACHINE_OPTIONS

// Helper: get the right force options based on forceType
export function getForceOptions(forceType) {
  if (forceType === 'Unfasten') return FORCE_UNFASTEN_OPTIONS
  if (forceType === 'Human')    return FORCE_HUMAN_OPTIONS
  if (forceType === 'Machine')  return FORCE_MACHINE_OPTIONS
  return FORCE_MACHINE_OPTIONS
}

// ── ERGONOMICS: DISASSEMBLY EFFORT (size) ───────────────────────
export const TMU_EFFORT_OPTIONS = [
  { label: 'Small',  value: 'Small' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Large',  value: 'Large' },
]

// ── ERGONOMICS: DISASSEMBLY FORCE (depends on effort) ───────────
export const TMU_DISASSEMBLY_FORCE_OPTIONS = [
  { label: 'St.Line / Hand / No Pressure',        value: 'StLine_Hand_NoPr' },
  { label: 'St.Line + Twist / Hand / No Pressure',value: 'StLineTwist_Hand_NoPr' },
  { label: 'St.Line / Tool / With Pressure',       value: 'StLine_Tool_WPr' },
  { label: 'St.Line + Twist / Hand / With Pressure',value: 'StLineTwist_Hand_WPr' },
  { label: 'Twist / With Pressure',               value: 'Twist_WPr' },
]

// Score lookup: [force_value][effort_value] = score
export const TMU_FORCE_SCORE_MAP = {
  'StLine_Hand_NoPr':       { Small: 0.5, Medium: 1,   Large: 3   },
  'StLineTwist_Hand_NoPr':  { Small: 1,   Medium: 2,   Large: 4   },
  'StLine_Tool_WPr':        { Small: 2.5, Medium: 3,   Large: 5   },
  'StLineTwist_Hand_WPr':   { Small: 3,   Medium: 3.5, Large: 5.5 },
  'Twist_WPr':              { Small: 3,   Medium: 4.5, Large: 6   },
}

// ── ERGONOMICS: GRASPING ────────────────────────────────────────
export const TMU_GRASPING_OPTIONS = [
  { label: 'Not Applicable', value: 'NotApplicable', score: 2   },
  { label: 'Easy',           value: 'Easy',          score: 3.5 },
  { label: 'Moderate',       value: 'Moderate',      score: 4   },
  { label: 'Difficult',      value: 'Difficult',     score: 0   },
]

// ── ERGONOMICS: WEIGHT ──────────────────────────────────────────
export const TMU_WEIGHT_OPTIONS = [
  { label: 'Light  < 3.5 kg', value: 'Light',  score: 2   },
  { label: 'Medium < 8 kg',   value: 'Medium', score: 2.5 },
  { label: 'Heavy  > 12 kg',  value: 'Heavy',  score: 3   },
]

// ── ERGONOMICS: SYMMETRY (depends on weight) ────────────────────
export const TMU_SYMMETRY_OPTIONS = [
  { label: 'Symmetrical',     value: 'Sym' },
  { label: 'Semi Symmetrical',value: 'SemiSym' },
  { label: 'Asymmetrical',    value: 'Asym' },
]

export const TMU_SYMMETRY_SCORE_MAP = {
  'Sym':     { Light: 0.8, Medium: 2,   Heavy: 4.4 },
  'SemiSym': { Light: 1.2, Medium: 2.2, Heavy: 4.6 },
  'Asym':    { Light: 1.4, Medium: 2.4, Heavy: 5   },
}

// ── ERGONOMICS: FORCE EXERTION ──────────────────────────────────
export const TMU_FORCE_EXERTION_OPTIONS = [
  { label: 'No Force', value: 'NoForce', score: 0 },
  { label: 'No Tools', value: 'NoTools', score: 1 },
  { label: 'Common',   value: 'Common',  score: 2 },
  { label: 'Special',  value: 'Special', score: 3 },
]

// ── ERGONOMICS: TORQUE EXERTION ─────────────────────────────────
export const TMU_TORQUE_EXERTION_OPTIONS = [
  { label: 'No Torque', value: 'NoTorque', score: 0 },
  { label: 'No Tools',  value: 'NoTools',  score: 1 },
  { label: 'Common',    value: 'Common',   score: 2 },
  { label: 'Special',   value: 'Special',  score: 3 },
]

// ── ERGONOMICS: INTERFACE VISIBILITY ────────────────────────────
export const TMU_VISIBILITY_OPTIONS = [
  { label: 'Clearly Visible',   value: 'ClearlyVisible',   score: 1   },
  { label: 'Slightly Obscured', value: 'SlightlyObscured', score: 1.6 },
  { label: 'Highly Obscured',   value: 'HighlyObscured',   score: 2   },
]

// ── ERGONOMICS: INTERFACE ACCESSIBILITY ─────────────────────────
export const TMU_ACCESS_OPTIONS = [
  { label: 'Easy',     value: 'Easy',     score: 1   },
  { label: 'Moderate', value: 'Moderate', score: 1.6 },
  { label: 'Difficult',value: 'Difficult',score: 2   },
]

// ── ERGONOMICS: ACCURACY REQUIRED ───────────────────────────────
export const TMU_ACCURACY_OPTIONS = [
  { label: 'Not Applicable', value: 'NotApplicable', score: 0   },
  { label: 'No Accuracy',    value: 'NoAccuracy',    score: 1.2 },
  { label: 'Low Accuracy',   value: 'LowAccuracy',   score: 1.6 },
  { label: 'Medium Accuracy',value: 'MedAccuracy',   score: 2.5 },
  { label: 'High Accuracy',  value: 'HighAccuracy',  score: 5.5 },
]

// ── ERGONOMICS: POSTURE PROBLEMS ────────────────────────────────
export const TMU_POSTURE_OPTIONS = [
  { label: 'No Posture Problems',    value: 'NoPosture',     score: 0 },
  { label: 'Excess Grip / Force',    value: 'ExcessGrip',    score: 3 },
  { label: 'Excess Reach',           value: 'ExcessReach',   score: 3 },
  { label: 'Excess Neck Bend/Twist', value: 'ExcessNeck',    score: 4 },
  { label: 'Excess Torso Bend/Twist',value: 'ExcessTorso',   score: 4 },
  { label: 'Excess Wrist Bend',      value: 'ExcessWrist',   score: 3 },
]

// ── DEFAULT VALUES ───────────────────────────────────────────────
export const DEFAULT_ERGONOMICS = {
  effort:          '',
  disassemblyForce:'',
  grasping:        '',
  weight:          '',
  symmetry:        '',
  forceExertion:   '',
  torqueExertion:  '',
  visibility:      '',
  accessibility:   '',
  accuracy:        '',
  posture:         '',
}

export const DEFAULT_INTERFACE = {
  id: '',
  name: '',
  jointToken: '',
  fromModel: false,
  part1: '',
  part2: '',
  constraint: '',
  repetitions: 1,
  nature:      '',
  time:        '',
  tool:        '',
  fixture:     '',
  access:      '',
  instruction: '',
  hazard:      '',
  forceType:   '',
  force:       '',
  ergonomics:  { ...DEFAULT_ERGONOMICS },
}

// ── HELPERS ──────────────────────────────────────────────────────
const findScore = (options, value, fallback = 0) => {
  const opt = options.find(o => o.value === value)
  return (opt && typeof opt.score === 'number') ? opt.score : fallback
}

// ── DEI CALCULATION ──────────────────────────────────────────────
export function calcDEI(iface) {
  const timeScore     = findScore(TIME_OPTIONS,              iface.time)
  const toolScore     = findScore(TOOL_OPTIONS,              iface.tool)
  const fixtureScore  = findScore(FIXTURE_OPTIONS,           iface.fixture)
  const accessScore   = findScore(ACCESS_OPTIONS,            iface.access)
  const instructScore = findScore(INSTRUCTION_OPTIONS,       iface.instruction)
  const hazardScore   = findScore(HAZARD_OPTIONS,            iface.hazard)
  const forceScore    = findScore(getForceOptions(iface.forceType), iface.force)

  const deiPerInterface = timeScore + toolScore + fixtureScore + accessScore + instructScore + hazardScore + forceScore
  const reps = Number(iface.repetitions) || 1
  const totalDEI = deiPerInterface * reps

  return { timeScore, toolScore, fixtureScore, accessScore, instructScore, hazardScore, forceScore, deiPerInterface, totalDEI }
}

// ── TMU CALCULATION ──────────────────────────────────────────────
export function calcTMU(ergo, repetitions = 1, fos = FACTOR_OF_SAFETY) {
  const effort = ergo.effort || 'Small'
  const weight = ergo.weight || 'Light'

  // Disassembly force: depends on effort
  const forceMap = TMU_FORCE_SCORE_MAP[ergo.disassemblyForce]
  const disassemblyForceScore = forceMap ? (forceMap[effort] || 0) : 0

  // Symmetry: depends on weight
  const symMap = TMU_SYMMETRY_SCORE_MAP[ergo.symmetry]
  const symmetryScore = symMap ? (symMap[weight] || 0) : 0

  const scores = {
    disassemblyForce: disassemblyForceScore,
    grasping:         findScore(TMU_GRASPING_OPTIONS,        ergo.grasping),
    weight:           findScore(TMU_WEIGHT_OPTIONS,          ergo.weight),
    symmetry:         symmetryScore,
    forceExertion:    findScore(TMU_FORCE_EXERTION_OPTIONS,  ergo.forceExertion),
    torqueExertion:   findScore(TMU_TORQUE_EXERTION_OPTIONS, ergo.torqueExertion),
    visibility:       findScore(TMU_VISIBILITY_OPTIONS,      ergo.visibility),
    accessibility:    findScore(TMU_ACCESS_OPTIONS,          ergo.accessibility),
    accuracy:         findScore(TMU_ACCURACY_OPTIONS,        ergo.accuracy),
    posture:          findScore(TMU_POSTURE_OPTIONS,         ergo.posture),
  }

  const totalTMUPerInterface = Object.values(scores).reduce((a, b) => a + b, 0)
  const reps = Number(repetitions) || 1
  const totalTMU = totalTMUPerInterface * reps
  const estimatedTimeSec = totalTMU * TMU_SECONDS_FACTOR
  const adjustedTimeSec  = estimatedTimeSec * fos

  return { scores, totalTMUPerInterface, totalTMU, estimatedTimeSec, adjustedTimeSec }
}

// ── PROJECT SUMMARY ──────────────────────────────────────────────
export function calcProjectSummary(interfaces, parts, fos = FACTOR_OF_SAFETY, occ = OVERHEAD_COST_COEFF, lcc = LABOUR_COST_COEFF) {
  let totalDEI = 0, totalTMU = 0, totalTimeSec = 0
  const toolCounts = {}, partInterfaceCount = {}

  for (const iface of interfaces) {
    const dei = calcDEI(iface)
    const tmu = calcTMU(iface.ergonomics || {}, iface.repetitions, fos)
    totalDEI += dei.totalDEI
    totalTMU += tmu.totalTMU
    totalTimeSec += tmu.adjustedTimeSec
    if (iface.tool && iface.tool !== 'None') {
      toolCounts[iface.tool] = (toolCounts[iface.tool] || 0) + 1
    }
    if (iface.part1) partInterfaceCount[iface.part1] = (partInterfaceCount[iface.part1] || 0) + 1
    if (iface.part2) partInterfaceCount[iface.part2] = (partInterfaceCount[iface.part2] || 0) + 1
  }

  const DLC = totalTimeSec * lcc
  const DOC = interfaces.length * occ
  const totalCost = DLC + DOC

  return { totalDEI, totalTMU, totalTimeSec, toolCounts, partInterfaceCount,
    totalInterfaces: interfaces.length, totalParts: parts.length, DLC, DOC, totalCost }
}

// ── CLASSIFY ─────────────────────────────────────────────────────
export function classifyDEI(score) {
  if (score < 30)  return { level: 'Low',    class: 'score-low',  color: '#22c55e' }
  if (score < 70)  return { level: 'Medium', class: 'score-med',  color: '#eab308' }
  return               { level: 'High',   class: 'score-high', color: '#ef4444' }
}

export function classifyTMU(score) {
  if (score < 15) return { level: 'Low',    class: 'score-low',  color: '#22c55e' }
  if (score < 30) return { level: 'Medium', class: 'score-med',  color: '#eab308' }
  return              { level: 'High',   class: 'score-high', color: '#ef4444' }
}
