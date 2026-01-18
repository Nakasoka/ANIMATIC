import { PlatformDefinition, StageData } from "../core/types.js";
import { Player } from "../entities/Player.js";

type PlatformState = {
  key: string;
  def: PlatformDefinition;
  active: boolean;
  remainingMs: number;
  triggered: boolean;
};

export class PlatformSystem {
  private states: PlatformState[] = [];

  constructor(stage: StageData) {
    this.reset(stage);
  }

  reset(stage: StageData) {
    this.states = stage.platforms.map((def, index) => ({
      key: def.id ?? `${stage.id}-platform-${index}`,
      def,
      active: true,
      remainingMs: def.vanishOnStandMs ?? 0,
      triggered: false
    }));
  }

  update(dt: number, player: Player) {
    const dtMs = dt * 1000;
    for (const state of this.states) {
      if (!state.active) continue;
      if (state.def.vanishOnStandMs === undefined) continue;
      if (!state.triggered && this.isStanding(player, state.def)) {
        state.triggered = true;
        state.remainingMs = state.def.vanishOnStandMs;
      }
      if (state.triggered) {
        state.remainingMs -= dtMs;
        if (state.remainingMs <= 0) {
          state.active = false;
        }
      }
    }
  }

  getActivePlatforms(): PlatformDefinition[] {
    return this.states.filter((state) => state.active).map((state) => state.def);
  }

  private isStanding(player: Player, platform: PlatformDefinition) {
    const playerBottom = player.y + player.height;
    const onTop = Math.abs(playerBottom - platform.y) <= 0.5 && player.vy >= 0;
    const overlapsX =
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width;
    return onTop && overlapsX;
  }
}
