export type EntityId = "player";

export interface EnemyDefinition extends Rect {
  id: string;
  type: "bullet_shooter";
  shootIntervalMs: number;
  bulletSpeed: number;
  facing: "left" | "right";
}

export interface BulletState extends Rect {
  id: string;
  vx: number;
  vy: number;
}

export interface StageData {
  id: string;
  name: string;
  size: { width: number; height: number };
  groundY: number;
  holes: Array<{ x: number; width: number }>;
  maxSelectionCount: number;
  animationChoices: string[];
  // 初登場の演出用に、選択画面でNEW表示するアニメーションID。
  newAnimationIds?: string[];
  playerStart: { x: number; y: number };
  goal: GoalLine;
  platforms: PlatformDefinition[];
  obstacles: FallingSpikeDefinition[];
  enemies?: EnemyDefinition[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlatformDefinition extends Rect {
  id?: string;
  vanishOnStandMs?: number;
  color?: string;
}

export interface GoalLine {
  x: number;
  y: number;
  height: number;
}

export interface FallingSpikeDefinition {
  id: string;
  type: "falling_spike";
  x: number;
  y: number;
  width: number;
  height: number;
  trigger: Rect;
  fallSpeed: number;
}

export type ObstacleState =
  | (FallingSpikeDefinition & { state: "idle" | "falling" | "gone" });

export interface AnimationClip {
  id: string;
  target: EntityId;
  startMs: number;
  durationMs: number;
  priority: number;
  visuals?: VisualTrack[];
  effects?: EffectTrack[];
}

export interface Keyframe<T> {
  time: number;
  value: T;
}

export interface VisualTrack {
  property: "color" | "scale";
  keyframes: Array<Keyframe<string | number>>;
}

export interface EffectTrack {
  property: "x" | "y" | "vx" | "vy" | "dir" | "height" | "gravityScale" | "dashShape" | "isDefending" | "passThroughPlatforms";
  keyframes: Array<Keyframe<number>>;
}

export interface VisualState {
  color: string;
  scale: number;
}

export interface EffectState {
  positionOverride?: { x?: number; y?: number };
  velocityOverride?: { x?: number; y?: number };
  directionFlip?: number;
  heightOverride?: number;
  gravityScale?: number;
  dashShape?: number;
  isDefending?: number;
  passThroughPlatforms?: number;
}

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}
