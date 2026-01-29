import { BulletState, EnemyDefinition, StageData } from "../core/types.js";
import { Player } from "../entities/Player.js";

export class EnemySystem {
    private shootTimers: Map<string, number> = new Map();

    constructor(stage: StageData) {
        this.reset(stage);
    }

    reset(stage: StageData) {
        this.shootTimers.clear();
        if (stage.enemies) {
            for (const enemy of stage.enemies) {
                // 開始直後に発射されるよう、タイマーをインターバル値で初期化
                this.shootTimers.set(enemy.id, enemy.shootIntervalMs);
            }
        }
    }

    update(dt: number, stage: StageData, player: Player, onShoot: (enemy: EnemyDefinition) => void) {
        if (!stage.enemies) return;

        const dtMs = dt * 1000;
        for (const enemy of stage.enemies) {
            // プレイヤーの方を向く
            if (player.x < enemy.x) {
                enemy.facing = "left";
            } else {
                enemy.facing = "right";
            }

            let timer = this.shootTimers.get(enemy.id) ?? 0;
            timer += dtMs;

            if (timer >= enemy.shootIntervalMs) {
                onShoot(enemy);
                timer -= enemy.shootIntervalMs;
            }

            this.shootTimers.set(enemy.id, timer);
        }
    }
}
