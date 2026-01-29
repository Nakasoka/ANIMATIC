import { BulletState, EnemyDefinition, StageData } from "../core/types.js";
import { Player } from "../entities/Player.js";

export class BulletSystem {
    private bullets: BulletState[] = [];
    private bulletCount = 0;

    reset() {
        this.bullets = [];
        this.bulletCount = 0;
    }

    spawnBullet(enemy: EnemyDefinition) {
        const vx = enemy.facing === "left" ? -enemy.bulletSpeed : enemy.bulletSpeed;
        const bullet: BulletState = {
            id: `bullet-${this.bulletCount++}`,
            x: enemy.facing === "left" ? enemy.x : enemy.x + enemy.width,
            y: enemy.y + enemy.height / 2 - 4, // 中央付近から発射
            width: 8,
            height: 8,
            vx,
            vy: 0
        };
        this.bullets.push(bullet);
    }

    update(dt: number, player: Player, stage: StageData): boolean {
        let hit = false;
        const nextBullets: BulletState[] = [];

        for (const bullet of this.bullets) {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;

            // プレイヤーとの衝突判定
            if (
                bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y
            ) {
                if (!player.isDefending) {
                    hit = true;
                }
                // 当たったら（守っていてもいなくても）弾は消える
                // isDefendingなら hit=false のままなのでゲームオーバーにならない
            } else if (
                // 画面外判定（ステージサイズ基準）
                bullet.x + bullet.width < 0 ||
                bullet.x > stage.size.width ||
                bullet.y + bullet.height < 0 ||
                bullet.y > stage.size.height
            ) {
                // 画面外も消える
            } else {
                nextBullets.push(bullet);
            }
        }

        this.bullets = nextBullets;
        return hit;
    }

    getBullets(): BulletState[] {
        return this.bullets;
    }
}
