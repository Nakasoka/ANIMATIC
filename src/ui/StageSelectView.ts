import {
  StageLink,
  StageNode,
  getLinkStyleForProgress,
  isStageEnabled
} from "../data/stageMap.js";

export class StageSelectView {
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private minScale = 0.5;
  private maxScale = 1.25;
  private offsetX = 0;
  private offsetY = 0;
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
  private nodeSize = 60;
  private padding = 60;
  private clearedStages = new Set<string>();
  private onSelect: ((id: string) => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private nodes: StageNode[],
    private links: StageLink[]
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    this.ctx = ctx;
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("mousedown", this.handlePanStart);
    window.addEventListener("mouseup", this.handlePanEnd);
    window.addEventListener("mousemove", this.handlePanMove);
  }

  setScale(scale: number) {
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    this.clampOffsets();
    this.render();
  }

  setScaleLimits(min: number, max: number) {
    this.minScale = min;
    this.maxScale = max;
  }

  setOnSelect(handler: (id: string) => void) {
    this.onSelect = handler;
  }

  setClearedStages(cleared: Set<string>) {
    this.clearedStages = new Set(cleared);
    this.render();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    for (const link of this.links) {
      const from = this.nodes.find((node) => node.id === link.from);
      const to = this.nodes.find((node) => node.id === link.to);
      if (!from || !to) continue;
      const style = getLinkStyleForProgress(link, this.clearedStages);
      ctx.strokeStyle = "#4b4b5a";
      ctx.lineWidth = 2;
      if (style === "dotted") {
        ctx.setLineDash([6, 6]);
      } else {
        ctx.setLineDash([]);
      }
      const size = this.nodeSize;
      const offset = size / 2 + 6;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length;
      const uy = dy / length;
      ctx.beginPath();
      ctx.moveTo(from.x + ux * offset, from.y + uy * offset);
      ctx.lineTo(to.x - ux * offset, to.y - uy * offset);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    for (const node of this.nodes) {
      const size = this.nodeSize;
      const enabled = isStageEnabled(node.id, this.clearedStages);
      ctx.strokeStyle = enabled ? "#f5f5f5" : "#4b4b5a";
      ctx.lineWidth = 2;
      ctx.strokeRect(node.x - size / 2, node.y - size / 2, size, size);

      ctx.fillStyle = enabled ? "#e6e6e6" : "#77778a";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x, node.y);
    }

    ctx.restore();
  }

  private handleClick = (event: MouseEvent) => {
    if (!this.onSelect) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x =
      ((event.clientX - rect.left) * scaleX - this.offsetX) / this.scale;
    const y =
      ((event.clientY - rect.top) * scaleY - this.offsetY) / this.scale;
    const hit = this.nodes.find((node) => {
      const size = this.nodeSize;
      return (
        x >= node.x - size / 2 &&
        x <= node.x + size / 2 &&
        y >= node.y - size / 2 &&
        y <= node.y + size / 2
      );
    });
    if (hit && isStageEnabled(hit.id, this.clearedStages)) {
      this.onSelect(hit.id);
    }
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextScale = this.scale + direction * 0.08;
    this.setScale(nextScale);
  };

  private handlePanStart = (event: MouseEvent) => {
    this.isPanning = true;
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
  };

  private handlePanEnd = () => {
    this.isPanning = false;
  };

  private handlePanMove = (event: MouseEvent) => {
    if (!this.isPanning) return;
    const dx = event.clientX - this.lastPanX;
    const dy = event.clientY - this.lastPanY;
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
    this.offsetX += dx;
    this.offsetY += dy;
    this.clampOffsets();
    this.render();
  };

  private clampOffsets() {
    const bounds = this.getContentBounds();
    const minOffsetX = this.canvas.width - bounds.maxX * this.scale;
    const maxOffsetX = -bounds.minX * this.scale;
    const minOffsetY = this.canvas.height - bounds.maxY * this.scale;
    const maxOffsetY = -bounds.minY * this.scale;

    if (minOffsetX > maxOffsetX) {
      this.offsetX = (minOffsetX + maxOffsetX) / 2;
    } else {
      this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.offsetX));
    }

    if (minOffsetY > maxOffsetY) {
      this.offsetY = (minOffsetY + maxOffsetY) / 2;
    } else {
      this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.offsetY));
    }
  }

  private getContentBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of this.nodes) {
      minX = Math.min(minX, node.x - this.nodeSize / 2);
      maxX = Math.max(maxX, node.x + this.nodeSize / 2);
      minY = Math.min(minY, node.y - this.nodeSize / 2);
      maxY = Math.max(maxY, node.y + this.nodeSize / 2);
    }

    return {
      minX: minX - this.padding,
      maxX: maxX + this.padding,
      minY: minY - this.padding,
      maxY: maxY + this.padding
    };
  }
}
