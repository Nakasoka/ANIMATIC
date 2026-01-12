import { EffectState, StageData } from "../core/types.js";
import { GRAVITY } from "../core/constants.js";
import { Player } from "../entities/Player.js";

export class PhysicsSystem {
  update(
    dt: number,
    player: Player,
    effects: EffectState,
    stage: StageData
  ) {
    if (effects.positionOverride?.x !== undefined) {
      player.x = effects.positionOverride.x;
    }
    if (effects.positionOverride?.y !== undefined) {
      player.y = effects.positionOverride.y;
    }
    if (effects.velocityOverride?.x !== undefined) {
      player.vx = effects.velocityOverride.x;
    }
    if (effects.velocityOverride?.y !== undefined) {
      player.vy = effects.velocityOverride.y;
    }

    player.vy += GRAVITY * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    const floor = stage.groundY - player.height;
    const centerX = player.x + player.width / 2;
    const overHole = stage.holes.some(
      (hole) => centerX >= hole.x && centerX <= hole.x + hole.width
    );

    if (!overHole && player.y > floor) {
      player.y = floor;
      if (player.vy > 0) player.vy = 0;
    }
  }
}
