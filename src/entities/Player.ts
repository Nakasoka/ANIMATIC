export class Player {
  // 位置はワールド座標（px）。
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  width = 28;
  baseHeight = 40;
  height = 40;
  baseColor = "#f5f5f5";
  deadEyes = false;
  dashShape = false;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  reset(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.height = this.baseHeight;
    this.deadEyes = false;
    this.dashShape = false;
  }
}
