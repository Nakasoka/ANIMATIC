import { StageData, VisualState } from "./types.js";
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

  render(player: Player, visuals: VisualState, timeMs: number) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.stage.groundY);
    ctx.lineTo(this.canvas.width, this.stage.groundY);
    ctx.stroke();

    ctx.fillStyle = "#3a3a48";
    ctx.fillRect(this.stage.goalX - 4, this.stage.groundY - 60, 8, 60);

    const scale = visuals.scale ?? 1;
    const drawWidth = player.width * scale;
    const drawHeight = player.height * scale;
    ctx.fillStyle = visuals.color ?? player.baseColor;
    ctx.fillRect(
      player.x - (drawWidth - player.width) / 2,
      player.y - (drawHeight - player.height) / 2,
      drawWidth,
      drawHeight
    );

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "14px system-ui";
    ctx.fillText(`Stage: ${this.stage.name}`, 20, 24);
    ctx.fillText("Press R to retry instantly", 20, 44);
    ctx.fillText(`Time: ${(timeMs / 1000).toFixed(2)}s`, 20, 64);
  }
}
