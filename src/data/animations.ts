import { AnimationClip } from "../core/types.js";
import { GRAVITY } from "../core/constants.js";
import animationDefinitionsData from "./animationDefinitions.json" with { type: "json" };

export type AnimationEffect =
  | { type: "jump"; power: number }
  | { type: "double-jump"; power: number }
  | { type: "stop" }
  | { type: "move-right"; speed: number }
  | { type: "reverse"; speed: number; downSpeed: number }
  | { type: "crouch" }
  | { type: "grow-shrink" };

export interface AnimationDefinition {
  id: string;
  name: string;
  action: string;
  effect: AnimationEffect;
  durationSec: number;
  intervalSec: number;
  startDelaySec: number;
  priority: number;
}

export const animationDefinitions =
  animationDefinitionsData as AnimationDefinition[];

const definitionById = new Map(
  animationDefinitions.map((definition) => [definition.id, definition])
);

export const getAnimationDefinitionsById = (
  ids: string[]
): AnimationDefinition[] =>
  ids.map((id) => {
    const definition = definitionById.get(id);
    if (!definition) throw new Error(`Missing animation: ${id}`);
    return definition;
  });

const IMPULSE_DURATION_MS = 16;
const DOUBLE_JUMP_SECOND_START_MIN = 0.35;
const DOUBLE_JUMP_SECOND_START_MAX = 0.55;
const DOUBLE_JUMP_SECOND_START_STEP = 0.04;
const DOUBLE_JUMP_APEX_RATIO = 0.7;
const DOUBLE_JUMP_SECOND_HEIGHT_RATIO = 0.6;

export const buildAnimationClips = (
  definitionIds: string[],
  options?: { startDelayOverrideSec?: number }
): AnimationClip[] => {
  const clips: AnimationClip[] = [];
  let cursorMs = 0;

  for (const definition of getAnimationDefinitionsById(definitionIds)) {
    const actionDurationMs = definition.durationSec * 1000;
    const startDelaySec =
      options?.startDelayOverrideSec ?? definition.startDelaySec;
    cursorMs += startDelaySec * 1000;
    addEffectClips(clips, definition, cursorMs, actionDurationMs);
    cursorMs += actionDurationMs;
  }

  return clips;
};

const addEffectClips = (
  clips: AnimationClip[],
  definition: AnimationDefinition,
  startMs: number,
  actionDurationMs: number
) => {
  switch (definition.effect.type) {
    case "move-right":
      clips.push({
        id: `${definition.id}-${startMs}`,
        target: "player",
        startMs,
        durationMs: actionDurationMs,
        priority: definition.priority,
        effects: [
          {
            property: "vx",
            keyframes: [
              { time: 0, value: definition.effect.speed },
              { time: 1, value: definition.effect.speed }
            ]
          }
        ]
      });
      return;
    case "jump":
      clips.push(createJumpImpulseClip(definition, startMs));
      return;
    case "double-jump": {
      const totalSec = Math.max(0.2, actionDurationMs / 1000);
      const jumpPlan = findDoubleJumpPlan(totalSec);
      const firstVelocity = jumpPlan.firstVelocity;
      const secondVelocity = jumpPlan.secondVelocity;
      const secondStartSec = jumpPlan.secondStartSec;
      const first = createJumpImpulseClip(definition, startMs, -firstVelocity);
      const second = createJumpImpulseClip(
        definition,
        startMs + secondStartSec * 1000,
        -secondVelocity
      );
      clips.push(first, second);
      return;
    }
    case "stop":
      clips.push({
        id: `${definition.id}-${startMs}`,
        target: "player",
        startMs,
        durationMs: actionDurationMs,
        priority: definition.priority,
        effects: [
          {
            property: "vx",
            keyframes: [
              { time: 0, value: 0 },
              { time: 1, value: 0 }
            ]
          }
        ]
      });
      return;
    case "reverse":
      clips.push({
        id: `${definition.id}-${startMs}`,
        target: "player",
        startMs,
        durationMs: IMPULSE_DURATION_MS,
        priority: definition.priority,
        effects: [
          {
            property: "dir",
            keyframes: [
              { time: 0, value: -1 },
              { time: 1, value: -1 }
            ]
          }
        ]
      });
      return;
    case "crouch":
      clips.push({
        id: `${definition.id}-${startMs}`,
        target: "player",
        startMs,
        durationMs: actionDurationMs,
        priority: definition.priority,
        effects: [
          {
            property: "height",
            keyframes: [
              { time: 0, value: 18 },
              { time: 1, value: 18 }
            ]
          }
        ]
      });
      return;
    case "grow-shrink":
      clips.push({
        id: `${definition.id}-${startMs}`,
        target: "player",
        startMs,
        durationMs: actionDurationMs,
        priority: definition.priority,
        visuals: [
          {
            property: "scale",
            keyframes: [
              { time: 0, value: 1 },
              { time: 0.5, value: 1.25 },
              { time: 1, value: 1 }
            ]
          }
        ]
      });
  }
};

const createJumpImpulseClip = (
  definition: AnimationDefinition,
  startMs: number,
  jumpVelocityOverride?: number
): AnimationClip => {
  const power =
    definition.effect.type === "jump" || definition.effect.type === "double-jump"
      ? definition.effect.power
      : 1;
  const jumpDurationSec = Math.max(0.1, definition.durationSec);
  const jumpVelocity =
    jumpVelocityOverride ?? -GRAVITY * (jumpDurationSec / 2) * power;
  return {
    id: `${definition.id}-${startMs}`,
    target: "player",
    startMs,
    durationMs: IMPULSE_DURATION_MS,
    priority: definition.priority,
    effects: [
      {
        property: "vy",
        keyframes: [
          { time: 0, value: jumpVelocity },
          { time: 1, value: jumpVelocity }
        ]
      }
    ]
  };
};

const findDoubleJumpPlan = (totalSec: number) => {
  let bestPlan: {
    secondStartSec: number;
    firstVelocity: number;
    secondVelocity: number;
  } | null = null;

  for (
    let ratio = DOUBLE_JUMP_SECOND_START_MIN;
    ratio <= DOUBLE_JUMP_SECOND_START_MAX + 0.0001;
    ratio += DOUBLE_JUMP_SECOND_START_STEP
  ) {
    const secondStartSec = totalSec * ratio;
    const apexTime = Math.max(
      0.05,
      Math.max(secondStartSec * 0.5 + 0.02, secondStartSec * DOUBLE_JUMP_APEX_RATIO)
    );
    if (secondStartSec >= 2 * apexTime) {
      continue;
    }
    const firstVelocity = GRAVITY * apexTime;
    const heightAtSecond =
      firstVelocity * secondStartSec -
      0.5 * GRAVITY * secondStartSec * secondStartSec;
    const remaining = Math.max(0.05, totalSec - secondStartSec);
    const secondVelocity =
      (0.5 * GRAVITY * remaining * remaining - heightAtSecond) / remaining;
    if (secondVelocity <= 0) {
      continue;
    }
    const firstApex = (firstVelocity * firstVelocity) / (2 * GRAVITY);
    const secondApex =
      heightAtSecond + (secondVelocity * secondVelocity) / (2 * GRAVITY);
    if (secondApex > firstApex * 1.2 && heightAtSecond >= firstApex * DOUBLE_JUMP_SECOND_HEIGHT_RATIO) {
      bestPlan = { secondStartSec, firstVelocity, secondVelocity };
    }
  }

  if (bestPlan) return bestPlan;

  const fallbackSecondStart = totalSec * 0.5;
  const fallbackApex = Math.max(0.05, fallbackSecondStart * 0.6);
  const fallbackVelocity = GRAVITY * fallbackApex;
  const fallbackHeight =
    fallbackVelocity * fallbackSecondStart -
    0.5 * GRAVITY * fallbackSecondStart * fallbackSecondStart;
  const fallbackRemaining = Math.max(0.05, totalSec - fallbackSecondStart);
  const fallbackSecondVelocity =
    (0.5 * GRAVITY * fallbackRemaining * fallbackRemaining - fallbackHeight) /
    fallbackRemaining;
  return {
    secondStartSec: fallbackSecondStart,
    firstVelocity: fallbackVelocity,
    secondVelocity: Math.max(0, fallbackSecondVelocity)
  };
};
