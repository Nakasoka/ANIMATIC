import { ObstacleState, StageData, VisualState } from "./types.js";
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
    obstacles: ObstacleState[]
  ) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderStageBase(ctx, obstacles);

    const scale = visuals.scale ?? 1;
    const drawWidth = player.width * scale;
    const drawHeight = player.height * scale;
    const drawX = player.x - (drawWidth - player.width) / 2;
    const drawY = player.y - (drawHeight - player.height) / 2;
    const outlineColor = visuals.color ?? player.baseColor;

    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);

    ctx.fillStyle = outlineColor;
    const gaze = Math.max(-1, Math.min(1, player.vx / 120));
    const eyeRadiusX = Math.max(2, drawWidth * 0.05);
    const eyeRadiusY = Math.max(3, drawHeight * 0.08);
    const eyeY = drawY + drawHeight * 0.32;
    const eyeBaseOffsetX = drawWidth * 0.26;
    const eyeShift = gaze * drawWidth * 0.06;
    ctx.beginPath();
    ctx.ellipse(
      drawX + eyeBaseOffsetX + eyeShift,
      eyeY,
      eyeRadiusX,
      eyeRadiusY,
      0,
      0,
      Math.PI * 2
    );
    ctx.ellipse(
      drawX + drawWidth - eyeBaseOffsetX + eyeShift,
      eyeY,
      eyeRadiusX,
      eyeRadiusY,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

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
    this.renderStageBase(ctx, previewObstacles);
  }

  private renderStageBase(ctx: CanvasRenderingContext2D, obstacles: ObstacleState[]) {
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

    ctx.fillStyle = "#1a1a22";
    for (const platform of this.stage.platforms) {
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
}
