import { AnimationClip } from "../core/types.js";

export const animations: AnimationClip[] = [
  {
    id: "tutorial-move",
    target: "player",
    startMs: 0,
    durationMs: 3500,
    priority: 1,
    effects: [
      {
        property: "vx",
        keyframes: [
          { time: 0, value: 90 },
          { time: 1, value: 90 }
        ]
      }
    ]
  },
  {
    id: "tutorial-hop",
    target: "player",
    startMs: 700,
    durationMs: 250,
    priority: 2,
    effects: [
      {
        property: "vy",
        keyframes: [
          { time: 0, value: -300 },
          { time: 1, value: -300 }
        ]
      }
    ]
  },
  {
    id: "tutorial-color",
    target: "player",
    startMs: 0,
    durationMs: 2000,
    priority: 1,
    visuals: [
      {
        property: "color",
        keyframes: [
          { time: 0, value: "#ffd166" },
          { time: 0.5, value: "#06d6a0" },
          { time: 1, value: "#ffd166" }
        ]
      }
    ]
  },
  {
    id: "tutorial-scale",
    target: "player",
    startMs: 500,
    durationMs: 1200,
    priority: 2,
    visuals: [
      {
        property: "scale",
        keyframes: [
          { time: 0, value: 1 },
          { time: 0.5, value: 1.2 },
          { time: 1, value: 1 }
        ]
      }
    ]
  }
];

const animationById = new Map(animations.map((clip) => [clip.id, clip]));

export const getAnimationsById = (ids: string[]): AnimationClip[] =>
  ids.map((id) => {
    const clip = animationById.get(id);
    if (!clip) throw new Error(`Missing animation: ${id}`);
    return clip;
  });
