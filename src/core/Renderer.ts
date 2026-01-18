import { ObstacleState, PlatformDefinition, StageData, VisualState } from "./types.js";
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
    this.canvas.width = stage.size.width;
    this.canvas.height = stage.size.height;
  }

  render(
    player: Player,
    visuals: VisualState,
    timeMs: number,
    obstacles: ObstacleState[],
    platforms?: PlatformDefinition[]
  ) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderStageBase(ctx, obstacles, platforms ?? this.stage.platforms);
    this.renderPlayer(ctx, player, visuals);

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "14px system-ui";
    ctx.fillText(`Stage: ${this.stage.name}`, 20, 24);
    ctx.fillText("Click Pause for menu", 20, 44);
    ctx.fillText(`Time: ${(timeMs / 1000).toFixed(2)}s`, 20, 64);
  }

  renderStagePreview(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const previewObstacles: ObstacleState[] = this.stage.obstacles.map(
      (obstacle) => ({
        ...obstacle,
        state: "idle"
      })
    );
    this.renderStageBase(ctx, previewObstacles, this.stage.platforms);
    const previewPlayer = new Player(
      this.stage.playerStart.x,
      this.stage.playerStart.y
    );
    this.renderPlayer(ctx, previewPlayer, {
      color: previewPlayer.baseColor,
      scale: 1
    });
  }

  private renderStageBase(
    ctx: CanvasRenderingContext2D,
    obstacles: ObstacleState[],
    platforms: PlatformDefinition[]
  ) {
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.stage.groundY);
    ctx.lineTo(this.canvas.width, this.stage.groundY);
    ctx.stroke();

    ctx.fillStyle = "#0b0b10";
    for (const hole of this.stage.holes) {
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
  }

  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    visuals: VisualState
  ) {
    const scaleY = visuals.scale ?? 1;
    const drawWidth = player.width;
    const drawHeight = player.height * scaleY;
    const drawX = player.x;
    const drawY = player.y + player.height - drawHeight;
    const outlineColor = visuals.color ?? player.baseColor;

    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    const dashDir = player.vx < 0 ? -1 : 1;
    if (player.dashShape) {
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
    } else {
      ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
    }

    ctx.fillStyle = outlineColor;
    const gaze = Math.max(-1, Math.min(1, player.vx / 120));
    const eyeRadiusX = Math.max(2, drawWidth * 0.05);
    const eyeRadiusY = Math.max(2, player.baseHeight * 0.08);
    const eyeY = drawY + drawHeight * 0.38;
    const eyeBaseOffsetX = drawWidth * 0.26;
    const eyeShift =
      gaze * drawWidth * 0.06 + (player.dashShape && dashDir < 0 ? 15 : 0);
    const skewX = player.dashShape
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
    } else if (player.dashShape) {
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
}
