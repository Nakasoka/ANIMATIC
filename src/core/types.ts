export type EntityId = "player";

export interface StageData {
  id: string;
  name: string;
  size: { width: number; height: number };
  groundY: number;
  playerStart: { x: number; y: number };
  goalX: number;
  animationIds: string[];
}

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
  property: "x" | "y" | "vx" | "vy";
  keyframes: Array<Keyframe<number>>;
}

export interface VisualState {
  color: string;
  scale: number;
}

export interface EffectState {
  positionOverride?: { x?: number; y?: number };
  velocityOverride?: { x?: number; y?: number };
}
