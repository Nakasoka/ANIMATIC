import { EffectState, PlatformDefinition, StageData } from "../core/types.js";
import { GRAVITY } from "../core/constants.js";
import { Player } from "../entities/Player.js";

export class PhysicsSystem {
  update(
    dt: number,
    player: Player,
    effects: EffectState,
    stage: StageData,
    platforms?: PlatformDefinition[]
  ): boolean {
    const desiredHeight =
      effects.heightOverride !== undefined
        ? effects.heightOverride
        : player.baseHeight;
    let crushed = false;
    if (desiredHeight > player.height) {
      const gap = this.getVerticalGap(player, stage, platforms ?? stage.platforms);
      if (gap < 21 || gap < desiredHeight) {
        crushed = true;
      }
    }
    if (desiredHeight !== player.height) {
      player.y += player.height - desiredHeight;
      player.height = desiredHeight;
    }
    const previousX = player.x;
    const previousY = player.y;

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

    const gravityScale = effects.gravityScale ?? 1;
    player.vy += GRAVITY * gravityScale * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    const activePlatforms = platforms ?? stage.platforms;
    this.resolvePlatforms(previousX, previousY, player, activePlatforms);
    this.resolveGround(previousY, player, stage);
    return crushed;
  }

  private resolvePlatforms(
    previousX: number,
    previousY: number,
    player: Player,
    platforms: PlatformDefinition[]
  ) {
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    const previousLeft = previousX;
    const previousRight = previousX + player.width;
    const previousTop = previousY;
    const previousBottom = previousY + player.height;

    for (const platform of platforms) {
      const intersects =
        playerRight > platform.x &&
        playerLeft < platform.x + platform.width &&
        playerBottom > platform.y &&
        playerTop < platform.y + platform.height;
      if (!intersects) continue;

      const overlapLeft = playerRight - platform.x;
      const overlapRight = platform.x + platform.width - playerLeft;
      const overlapTop = playerBottom - platform.y;
      const overlapBottom = platform.y + platform.height - playerTop;

      const minX = Math.min(overlapLeft, overlapRight);
      const minY = Math.min(overlapTop, overlapBottom);

      if (minY <= minX) {
        if (previousBottom <= platform.y) {
          player.y = platform.y - player.height;
          player.vy = 0;
        } else if (previousTop >= platform.y + platform.height) {
          player.y = platform.y + platform.height;
          if (player.vy < 0) player.vy = 0;
        }
      } else {
        if (previousRight <= platform.x) {
          player.x = platform.x - player.width;
          if (player.vx > 0) player.vx = 0;
        } else if (previousLeft >= platform.x + platform.width) {
          player.x = platform.x + platform.width;
          if (player.vx < 0) player.vx = 0;
        }
      }
    }
  }

  private resolveGround(previousY: number, player: Player, stage: StageData) {
    const floor = stage.groundY - player.height;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const overHole = stage.holes.some(
      (hole) => playerLeft >= hole.x && playerRight <= hole.x + hole.width
    );

    if (!overHole && player.y > floor && previousY <= floor) {
      player.y = floor;
      if (player.vy > 0) player.vy = 0;
    }
  }

  private getVerticalGap(player: Player, stage: StageData, platforms: PlatformDefinition[]) {
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    let floorY = stage.groundY;
    let ceilingY = 0;

    for (const platform of platforms) {
      const overlapsX =
        playerRight > platform.x && playerLeft < platform.x + platform.width;
      if (!overlapsX) continue;
      if (platform.y >= playerBottom) {
        floorY = Math.min(floorY, platform.y);
      }
      const platformBottom = platform.y + platform.height;
      if (platformBottom <= playerTop) {
        ceilingY = Math.max(ceilingY, platformBottom);
      }
    }

    return floorY - ceilingY;
  }
}
