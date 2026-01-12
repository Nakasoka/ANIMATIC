export class Loop {
  private lastTime = 0;

  constructor(
    private update: (dt: number) => void,
    private render: () => void
  ) {}

  start() {
    requestAnimationFrame(this.tick);
  }

  private tick = (time: number) => {
    if (this.lastTime === 0) this.lastTime = time;
    const deltaMs = time - this.lastTime;
    this.lastTime = time;

    this.update(deltaMs / 1000);
    this.render();

    requestAnimationFrame(this.tick);
  };
}
