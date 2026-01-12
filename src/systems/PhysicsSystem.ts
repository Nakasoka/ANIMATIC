import { EffectState, StageData } from "../core/types.js";
import { Player } from "../entities/Player.js";

export class PhysicsSystem {
  private gravity = 900;

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

    player.vy += this.gravity * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    const floor = stage.groundY - player.height;
    if (player.y > floor) {
      player.y = floor;
      if (player.vy > 0) player.vy = 0;
    }
  }
}
