import {
  BulletState,
  CameraState,
  ObstacleState,
  PlatformDefinition,
  VisualState,
  EnemyDefinition,
  StageData
} from "./types.js";
import { Player } from "../entities/Player.js";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private stage: StageData;

  constructor(canvas: HTMLCanvasElement, stage: StageData) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    this.ctx = ctx;
    this.canvas = canvas;
    this.stage = stage;
  }

  render(
    player: Player,
    visuals: VisualState,
    timeMs: number,
    obstacles: ObstacleState[],
    bullets: BulletState[],
    platforms?: PlatformDefinition[],
    camera: CameraState = { x: 0, y: 0, scale: 1 }
  ) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderStageBase(ctx, obstacles, bullets, platforms ?? this.stage.platforms, camera, player);
    this.renderPlayer(ctx, player, visuals, camera);

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "14px system-ui";
    ctx.fillText(`Stage: ${this.stage.name} `, 20, 24);
    ctx.fillText("Click Pause for menu", 20, 44);
  }

  renderStagePreview(ctx: CanvasRenderingContext2D, camera: CameraState) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const previewPlayer = new Player(
      this.stage.playerStart.x,
      this.stage.playerStart.y
    );
    const previewObstacles: ObstacleState[] = this.stage.obstacles.map(
      (obstacle) => ({
        ...obstacle,
        state: "idle"
      })
    );
    this.renderStageBase(ctx, previewObstacles, [], this.stage.platforms, camera, previewPlayer);
    this.renderPlayer(ctx, previewPlayer, {
      color: previewPlayer.baseColor,
      scale: 1
    }, camera);
  }

  private renderStageBase(
    ctx: CanvasRenderingContext2D,
    obstacles: ObstacleState[],
    bullets: BulletState[],
    platforms: PlatformDefinition[],
    camera: CameraState,
    targetPlayer?: Player
  ) {
    ctx.save();
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    const viewWidth = ctx.canvas.width / camera.scale;
    const viewHeight = ctx.canvas.height / camera.scale;

    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(camera.x, camera.y, viewWidth, viewHeight);

    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.stage.groundY);
    ctx.lineTo(this.stage.size.width, this.stage.groundY);
    ctx.stroke();

    ctx.fillStyle = "#0b0b10";
    for (const hole of this.stage.holes) {
      // 穴は地面の下に抜ける黒帯として描画。
      ctx.fillRect(hole.x, this.stage.groundY, hole.width, 50);
    }

    for (const platform of platforms) {
      const platformColor =
        platform.color ??
        (platform.vanishOnStandMs ? "#d6a33b" : "#1a1a22");
      ctx.fillStyle = platformColor;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    ctx.strokeStyle = "#e23b3b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.stage.goal.x, this.stage.goal.y);
    ctx.lineTo(this.stage.goal.x, this.stage.goal.y + this.stage.goal.height);
    ctx.stroke();

    for (const obstacle of obstacles) {
      if (obstacle.state === "gone") continue;
      ctx.fillStyle = "#3b6ee2";
      ctx.beginPath();
      ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height);
      ctx.lineTo(obstacle.x, obstacle.y);
      ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
      ctx.closePath();
      ctx.fill();
    }

    // 敵キャラの描画
    if (this.stage.enemies) {
      for (const enemy of this.stage.enemies) {
        // プレイヤーがいる場合はその位置に基づいて向きを決定
        const facing = targetPlayer
          ? (targetPlayer.x < enemy.x ? "left" : "right")
          : enemy.facing;

        ctx.strokeStyle = "#f5f5f5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.width / 2,
          enemy.height / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        // 目（横並び）
        ctx.fillStyle = "#f5f5f5";
        const eyeY = enemy.y + enemy.height * 0.4;
        const eyeWidth = 6;
        const eyeSpacing = 5;
        const totalEyeWidth = eyeWidth * 2 + eyeSpacing;
        const centerX = enemy.x + enemy.width / 2;
        // 向きに応じて中心から左右にずらす
        const offset = facing === "left" ? -3 : 3;
        const eyeBaseX = centerX + offset - totalEyeWidth / 2;

        ctx.fillRect(eyeBaseX, eyeY, eyeWidth, 2); // 左目
        ctx.fillRect(eyeBaseX + eyeWidth + eyeSpacing, eyeY, eyeWidth, 2); // 右目
      }
    }

    // 弾の描画
    ctx.fillStyle = "#ffd166";
    for (const bullet of bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    visuals: VisualState,
    camera: CameraState
  ) {
    ctx.save();
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    const scaleY = visuals.scale ?? 1;
    const drawWidth = player.width;
    const drawHeight = player.height * scaleY;
    const drawX = player.x;
    const drawY = player.y + player.height - drawHeight;
    const outlineColor = visuals.color ?? player.baseColor;

    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    const isDashVisual = player.dashShape && Math.abs(player.vx) > 0.1;
    const dashDir = player.vx < 0 ? -1 : 1;
    if (isDashVisual) {
      const skewX = Math.min(drawWidth * 0.5, drawHeight * 0.8) * dashDir;
      ctx.beginPath();
      if (skewX > 0) {
        ctx.moveTo(drawX + skewX, drawY);
        ctx.lineTo(drawX + drawWidth + skewX, drawY);
        ctx.lineTo(drawX + drawWidth, drawY + drawHeight);
        ctx.lineTo(drawX, drawY + drawHeight);
      } else {
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX + drawWidth, drawY);
        ctx.lineTo(drawX + drawWidth - skewX, drawY + drawHeight);
        ctx.lineTo(drawX - skewX, drawY + drawHeight);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (player.isDefending) {
      // 守るアクションのビジュアル: 正六角形、40x40、中央配置
      const defWidth = 40;
      const defHeight = 40;

      // プレイヤーに対して左右中央揃え
      const defX = drawX + drawWidth / 2 - defWidth / 2;
      // プレイヤーの下端に合わせる
      const defY = drawY + drawHeight - defHeight;

      const cx = defX + defWidth / 2;
      const cy = defY + defHeight / 2;
      const r = defWidth / 2;

      // 形状: 六角形 (上下が平ら)
      // 頂点は 0, 60, 120, 180, 240, 300 度。
      // 0度は右、60度は右上のため、辺は垂直・斜めになるが、
      // ユーザー要望の画像に合わせて形状を調整（正六角形）
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // 閉じた目: 2本の水平線
      const eyeY = defY + defHeight * 0.35; // 高さ40pxに合わせて調整
      const eyeW = 6; // 幅を少し短く（8 -> 6）
      const eyeOffset = 3; // 中央に寄せる（5 -> 3）

      ctx.lineWidth = 2; // 線を細く（3 -> 2）
      ctx.beginPath();
      // 左目
      ctx.moveTo(cx - eyeOffset - eyeW, eyeY);
      ctx.lineTo(cx - eyeOffset, eyeY);
      // 右目
      ctx.moveTo(cx + eyeOffset, eyeY);
      ctx.lineTo(cx + eyeOffset + eyeW, eyeY);
      ctx.stroke();
    } else {
      ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
    }



    if (!player.isDefending) {
      ctx.fillStyle = outlineColor;
      const gaze = Math.max(-1, Math.min(1, player.vx / 120));
      const eyeRadiusX = Math.max(2, drawWidth * 0.05);
      const eyeRadiusY = Math.max(2, player.baseHeight * 0.08);
      const eyeY = drawY + drawHeight * 0.38;
      const eyeBaseOffsetX = drawWidth * 0.26;
      const eyeShift =
        gaze * drawWidth * 0.06 + (isDashVisual && dashDir < 0 ? 15 : 0);
      const skewX = isDashVisual
        ? Math.min(drawWidth * 0.5, drawHeight * 0.8) * dashDir
        : 0;
      const skewAtEye =
        skewX !== 0 ? ((drawHeight - (eyeY - drawY)) / drawHeight) * skewX : 0;
      if (player.deadEyes) {
        const leftX = drawX + eyeBaseOffsetX + eyeShift + skewAtEye;
        const rightX = drawX + drawWidth - eyeBaseOffsetX + eyeShift + skewAtEye;
        const size = Math.max(4, eyeRadiusY * 1.2);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX - size, eyeY - size);
        ctx.lineTo(leftX + size, eyeY + size);
        ctx.moveTo(leftX - size, eyeY + size);
        ctx.lineTo(leftX + size, eyeY - size);
        ctx.moveTo(rightX - size, eyeY - size);
        ctx.lineTo(rightX + size, eyeY + size);
        ctx.moveTo(rightX - size, eyeY + size);
        ctx.lineTo(rightX + size, eyeY - size);
        ctx.stroke();
      } else if (isDashVisual) {
        const leftX = drawX + eyeBaseOffsetX + eyeShift + skewAtEye;
        const rightX = drawX + drawWidth - eyeBaseOffsetX + eyeShift + skewAtEye;
        const slant = eyeRadiusY * 0.9;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX - eyeRadiusX, eyeY - slant);
        ctx.lineTo(leftX + eyeRadiusX, eyeY + slant);
        ctx.moveTo(rightX - eyeRadiusX, eyeY + slant);
        ctx.lineTo(rightX + eyeRadiusX, eyeY - slant);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(
          drawX + eyeBaseOffsetX + eyeShift + skewAtEye,
          eyeY,
          eyeRadiusX,
          eyeRadiusY,
          0,
          0,
          Math.PI * 2
        );
        ctx.ellipse(
          drawX + drawWidth - eyeBaseOffsetX + eyeShift + skewAtEye,
          eyeY,
          eyeRadiusX,
          eyeRadiusY,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
