export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  width = 28;
  height = 40;
  baseColor = "#f5f5f5";

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  reset(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
  }
}
