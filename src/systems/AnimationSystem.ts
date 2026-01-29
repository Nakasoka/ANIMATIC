import {
  AnimationClip,
  EffectState,
  EffectTrack,
  Keyframe,
  VisualState,
  VisualTrack
} from "../core/types.js";

type PriorityMap = Record<string, number>;

export class AnimationSystem {
  private previousTimeMs = 0;

  constructor(private clips: AnimationClip[]) { }

  sample(timeMs: number): { visuals: Partial<VisualState>; effects: EffectState } {
    const visuals: Partial<VisualState> = {};
    const effects: EffectState = {};
    const visualPriority: PriorityMap = {};
    const effectPriority: PriorityMap = {};
    let previousTime = this.previousTimeMs;
    if (timeMs < previousTime) {
      previousTime = 0;
    }

    // クリップは優先度で上書き。衝突時は高い方を採用。
    for (const clip of this.clips) {
      if (clip.durationMs <= 0) continue;
      const isImpulse = clip.durationMs <= 20;
      if (isImpulse) {
        if (clip.startMs < previousTime || clip.startMs > timeMs) {
          continue;
        }
      } else if (timeMs < clip.startMs || timeMs > clip.startMs + clip.durationMs) {
        continue;
      }

      const localT = isImpulse ? 0 : (timeMs - clip.startMs) / clip.durationMs;

      if (clip.visuals) {
        for (const track of clip.visuals) {
          const value = sampleTrack(track, localT);
          const key = track.property;
          const prevPriority = visualPriority[key] ?? -Infinity;
          if (clip.priority >= prevPriority) {
            visualPriority[key] = clip.priority;
            if (track.property === "color") {
              visuals.color = String(value);
            } else {
              visuals.scale = Number(value);
            }
          }
        }
      }

      if (clip.effects) {
        for (const track of clip.effects) {
          const value = sampleNumericTrack(track, localT);
          const key = track.property;
          const prevPriority = effectPriority[key] ?? -Infinity;
          if (clip.priority >= prevPriority) {
            effectPriority[key] = clip.priority;
            if (track.property === "x" || track.property === "y") {
              if (!effects.positionOverride) effects.positionOverride = {};
              effects.positionOverride[track.property] = value;
            } else if (track.property === "dir") {
              effects.directionFlip = value;
            } else if (track.property === "height") {
              effects.heightOverride = value;
            } else if (track.property === "gravityScale") {
              effects.gravityScale = value;
            } else if (track.property === "dashShape") {
              effects.dashShape = value;
            } else if (track.property === "isDefending") {
              effects.isDefending = value;
            } else {
              if (!effects.velocityOverride) effects.velocityOverride = {};
              const axis = track.property === "vx" ? "x" : "y";
              effects.velocityOverride[axis] = value;
            }
          }
        }
      }
    }

    this.previousTimeMs = timeMs;
    return { visuals, effects };
  }
}

const sampleTrack = (track: VisualTrack, t: number): string | number => {
  const frames = track.keyframes;
  if (frames.length === 0) return 0;

  const clamped = Math.min(1, Math.max(0, t));
  let previous = frames[0];

  for (let i = 1; i < frames.length; i += 1) {
    const next = frames[i];
    if (clamped <= next.time) {
      return interpolateFrame(previous, next, clamped);
    }
    previous = next;
  }

  return previous.value;
};

const sampleNumericTrack = (track: EffectTrack, t: number): number => {
  const frames = track.keyframes;
  if (frames.length === 0) return 0;

  const clamped = Math.min(1, Math.max(0, t));
  let previous = frames[0];

  for (let i = 1; i < frames.length; i += 1) {
    const next = frames[i];
    if (clamped <= next.time) {
      return Number(interpolateFrame(previous, next, clamped));
    }
    previous = next;
  }

  return Number(previous.value);
};

const interpolateFrame = <T extends string | number>(
  a: Keyframe<T>,
  b: Keyframe<T>,
  t: number
): T => {
  if (typeof a.value === "number" && typeof b.value === "number") {
    const span = b.time - a.time || 1;
    const ratio = (t - a.time) / span;
    return (a.value + (b.value - a.value) * ratio) as T;
  }
  return a.value;
};
