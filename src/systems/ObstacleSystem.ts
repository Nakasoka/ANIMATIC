import { ObstacleState, StageData } from "../core/types.js";
import { Player } from "../entities/Player.js";

export class ObstacleSystem {
  private obstacles: ObstacleState[] = [];

  constructor(stage: StageData) {
    this.reset(stage);
  }

  reset(stage: StageData) {
    this.obstacles = stage.obstacles.map((obstacle) => ({
      ...obstacle,
      state: "idle"
    }));
  }

  update(dt: number, player: Player, stage: StageData): boolean {
    for (const obstacle of this.obstacles) {
      if (obstacle.state === "gone") continue;
      if (obstacle.state === "idle") {
        if (intersects(player, obstacle.trigger)) {
          obstacle.state = "falling";
        } else {
          continue;
        }
      }

      if (obstacle.state === "falling") {
        obstacle.y += obstacle.fallSpeed * dt;
        if (intersects(player, obstacle)) {
          return true;
        }
        if (this.hitPlatform(obstacle, stage)) {
          obstacle.state = "gone";
          continue;
        }
        const floor = stage.groundY - obstacle.height;
        if (obstacle.y >= floor) {
          obstacle.state = "gone";
        }
      }
    }
    return false;
  }

  getObstacles() {
    return this.obstacles;
  }

  private hitPlatform(
    obstacle: { x: number; y: number; width: number; height: number },
    stage: StageData
  ) {
    const obstacleBottom = obstacle.y + obstacle.height;
    for (const platform of stage.platforms) {
      const withinX =
        obstacle.x + obstacle.width > platform.x &&
        obstacle.x < platform.x + platform.width;
      if (!withinX) continue;
      if (obstacleBottom >= platform.y && obstacle.y <= platform.y) {
        return true;
      }
    }
    return false;
  }
}

const intersects = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
