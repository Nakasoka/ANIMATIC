import { Loop } from "./Loop.js";
import { Renderer } from "./Renderer.js";
import { stages } from "../data/stages.js";
import {
  animationDefinitions,
  buildAnimationClips,
  getAnimationDefinitionsById
} from "../data/animations.js";
import { Player } from "../entities/Player.js";
import { AnimationSystem } from "../systems/AnimationSystem.js";
import { PhysicsSystem } from "../systems/PhysicsSystem.js";
import { ObstacleSystem } from "../systems/ObstacleSystem.js";
import { StageData, VisualState } from "./types.js";
import { UiController } from "../ui/UiController.js";

type GameState =
  | "stage_select"
  | "selecting"
  | "playing"
  | "paused"
  | "cleared"
  | "gameover";

export class Game {
  private canvas: HTMLCanvasElement;
  private loop: Loop;
  private stage: StageData;
  private player: Player;
  private animationSystem: AnimationSystem;
  private physicsSystem: PhysicsSystem;
  private obstacleSystem: ObstacleSystem;
  private renderer: Renderer;
  private timeMs = 0;
  private visuals: VisualState = { color: "#f5f5f5", scale: 1 };
  private state: GameState = "stage_select";
  private ui: UiController;
  private baseMoveSpeed = 110;
  private selectedStageId = "tutorial";
  private clearedStages = new Set<string>();

  constructor(canvas: HTMLCanvasElement, ui: UiController) {
    this.canvas = canvas;
    this.stage = stages[0];
    const animations = buildAnimationClips(["jump"]);
    this.player = new Player(this.stage.playerStart.x, this.stage.playerStart.y);
    this.animationSystem = new AnimationSystem(animations);
    this.physicsSystem = new PhysicsSystem();
    this.obstacleSystem = new ObstacleSystem(this.stage);
    this.renderer = new Renderer(canvas, this.stage);
    this.loop = new Loop(this.update, this.render);
    this.ui = ui;

    this.applySelectionOptions(this.stage);
    this.ui.onPause = this.pause;
    this.ui.onContinue = this.resume;
    this.ui.onRetry = this.retry;
    this.ui.onPlayAgain = this.playAgain;
    this.ui.onClearToStageSelect = this.backToStageSelectFromClear;
    this.ui.onStartSelection = this.startFromSelection;
    this.ui.onPreviewStage = this.previewStage;
    this.ui.onBackToSelection = this.backToSelection;
    this.ui.onStageSelected = this.selectStage;
    this.ui.onBackToStageSelect = this.backToStageSelect;
    this.ui.setStageProgress(this.clearedStages);
    this.ui.showStageSelect();
  }

  start() {
    this.loop.start();
  }

  private update = (dt: number) => {
    if (this.state !== "playing") return;
    this.timeMs += dt * 1000;
    const { visuals, effects } = this.animationSystem.sample(this.timeMs);
    this.visuals = {
      color: this.player.baseColor,
      scale: 1,
      ...visuals
    };
    if (!effects.velocityOverride) effects.velocityOverride = {};
    if (effects.velocityOverride.x === undefined) {
      effects.velocityOverride.x = this.baseMoveSpeed;
    }
    this.physicsSystem.update(dt, this.player, effects, this.stage);
    const hitGoal =
      this.player.x + this.player.width >= this.stage.goal.x &&
      this.player.y + this.player.height >= this.stage.goal.y &&
      this.player.y <= this.stage.goal.y + this.stage.goal.height;
    if (hitGoal) {
      this.state = "cleared";
      this.clearedStages.add(this.selectedStageId);
      this.ui.setStageProgress(this.clearedStages);
      this.ui.showClear();
    }
    const hitHazard = this.obstacleSystem.update(
      dt,
      this.player,
      this.stage
    );
    if (hitHazard) {
      this.state = "gameover";
      this.ui.showGameOver();
    }
    if (this.player.x > this.stage.size.width) {
      this.state = "gameover";
      this.ui.showGameOver();
    }
    if (this.player.y > this.stage.size.height + 60) {
      this.state = "gameover";
      this.ui.showGameOver();
    }
  };

  private render = () => {
    this.renderer.render(
      this.player,
      this.visuals,
      this.timeMs,
      this.obstacleSystem.getObstacles()
    );
  };

  private pause = () => {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.ui.showPause();
  };

  private resume = () => {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.ui.showPlaying();
  };

  private retry = () => {
    this.reset();
    this.state = "selecting";
    this.ui.showSelection();
  };

  private playAgain = () => {
    this.reset();
    this.state = "selecting";
    this.ui.showSelection();
  };

  private backToStageSelectFromClear = () => {
    if (this.state !== "cleared") return;
    this.reset();
    this.state = "stage_select";
    this.ui.showStageSelect();
  };

  private previewStage = () => {
    if (this.state !== "selecting") return;
    this.state = "paused";
    this.ui.showStagePreview();
    this.ui.renderStagePreview((ctx) => this.renderer.renderStagePreview(ctx));
  };

  private backToSelection = () => {
    if (this.state !== "paused") return;
    this.state = "selecting";
    this.ui.showSelection();
  };

  private backToStageSelect = () => {
    if (this.state !== "selecting") return;
    this.state = "stage_select";
    this.ui.showStageSelect();
  };

  private selectStage = (stageId: string) => {
    if (this.state !== "stage_select") return;
    this.selectedStageId = stageId;
    this.setStage(stageId);
    this.state = "selecting";
    this.ui.showSelection();
  };

  private setStage(stageId: string) {
    const nextStage = stages.find((stage) => stage.id === stageId) ?? stages[0];
    this.stage = nextStage;
    this.applySelectionOptions(this.stage);
    this.player.reset(this.stage.playerStart.x, this.stage.playerStart.y);
    this.obstacleSystem.reset(this.stage);
    this.renderer = new Renderer(this.canvas, this.stage);
  }

  private startFromSelection = (optionIds: string[]) => {
    if (optionIds.length !== this.stage.maxSelectionCount) return;
    const ids = optionIds.length > 0 ? optionIds : ["jump"];
    this.animationSystem = new AnimationSystem(buildAnimationClips(ids));
    this.reset();
    this.state = "playing";
    this.ui.showPlaying();
  };

  private reset() {
    this.timeMs = 0;
    this.player.reset(this.stage.playerStart.x, this.stage.playerStart.y);
    this.obstacleSystem.reset(this.stage);
  }

  private applySelectionOptions(stage: StageData) {
    const options =
      stage.animationChoices.length > 0
        ? getAnimationDefinitionsById(stage.animationChoices)
        : animationDefinitions;
    this.ui.setAnimationOptions(options);
    this.ui.setMaxSelectionCount(stage.maxSelectionCount);
  }
}
