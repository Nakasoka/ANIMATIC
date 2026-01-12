import { Loop } from "./Loop.js";
import { Renderer } from "./Renderer.js";
import { stages } from "../data/stages.js";
import { getAnimationsById } from "../data/animations.js";
import { Player } from "../entities/Player.js";
import { AnimationSystem } from "../systems/AnimationSystem.js";
import { PhysicsSystem } from "../systems/PhysicsSystem.js";
import { StageData, VisualState } from "./types.js";

export class Game {
  private loop: Loop;
  private stage: StageData;
  private player: Player;
  private animationSystem: AnimationSystem;
  private physicsSystem: PhysicsSystem;
  private renderer: Renderer;
  private timeMs = 0;
  private visuals: VisualState = { color: "#f5f5f5", scale: 1 };

  constructor(canvas: HTMLCanvasElement) {
    this.stage = stages[0];
    const animations = getAnimationsById(this.stage.animationIds);
    this.player = new Player(this.stage.playerStart.x, this.stage.playerStart.y);
    this.animationSystem = new AnimationSystem(animations);
    this.physicsSystem = new PhysicsSystem();
    this.renderer = new Renderer(canvas, this.stage);
    this.loop = new Loop(this.update, this.render);

    window.addEventListener("keydown", this.onKeyDown);
  }

  start() {
    this.loop.start();
  }

  private update = (dt: number) => {
    this.timeMs += dt * 1000;
    const { visuals, effects } = this.animationSystem.sample(this.timeMs);
    this.visuals = {
      color: this.player.baseColor,
      scale: 1,
      ...visuals
    };
    this.physicsSystem.update(dt, this.player, effects, this.stage);
  };

  private render = () => {
    this.renderer.render(this.player, this.visuals, this.timeMs);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "r") {
      this.reset();
    }
  };

  private reset() {
    this.timeMs = 0;
    this.player.reset(this.stage.playerStart.x, this.stage.playerStart.y);
  }
}
