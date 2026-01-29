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
import { PlatformSystem } from "../systems/PlatformSystem.js";
import { EnemySystem } from "../systems/EnemySystem.js";
import { BulletSystem } from "../systems/BulletSystem.js";
import { CameraState, StageData, VisualState } from "./types.js";
import { UiController } from "../ui/UiController.js";

type GameState =
  | "stage_select"
  | "selecting"
  | "playing"
  | "crush_pending"
  | "hit_pending"
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
  private platformSystem: PlatformSystem;
  private enemySystem: EnemySystem;
  private bulletSystem: BulletSystem;
  private renderer: Renderer;
  private timeMs = 0;
  private visuals: VisualState = { color: "#f5f5f5", scale: 1 };
  private state: GameState = "stage_select";
  private ui: UiController;
  private baseMoveSpeed = 110;
  private moveDirection = 1;
  private lastReverseMs = -Infinity;
  private crushElapsedMs = 0;
  private selectedStageId = "tutorial";
  private clearedStages = new Set<string>();
  private camera: CameraState = { x: 0, y: 0, scale: 1 };
  private isDragging = false;
  private lastDrag = { x: 0, y: 0 };
  private minZoom = 1;
  private maxZoom = 1.2;

  constructor(canvas: HTMLCanvasElement, ui: UiController) {
    this.canvas = canvas;
    this.stage = stages[0];
    const animations = buildAnimationClips(["jump"]);
    this.player = new Player(this.stage.playerStart.x, this.stage.playerStart.y);
    this.animationSystem = new AnimationSystem(animations);
    this.physicsSystem = new PhysicsSystem();
    this.obstacleSystem = new ObstacleSystem(this.stage);
    this.platformSystem = new PlatformSystem(this.stage);
    this.enemySystem = new EnemySystem(this.stage);
    this.bulletSystem = new BulletSystem();
    this.renderer = new Renderer(canvas, this.stage);
    this.loop = new Loop(this.update, this.render);
    this.ui = ui;

    this.applySelectionOptions(this.stage);
    this.ui.onPause = this.pause;
    this.ui.onContinue = this.resume;
    this.ui.onRetry = this.retry;
    this.ui.onPlayAgain = this.playAgain;
    this.ui.onGameOverToStageSelect = this.backToStageSelectFromGameOver;
    this.ui.onClearToStageSelect = this.backToStageSelectFromClear;
    this.ui.onStartSelection = this.startFromSelection;
    this.ui.onPreviewStage = this.previewStage;
    this.ui.onBackToSelection = this.backToSelection;
    this.ui.onStageSelected = this.selectStage;
    this.ui.onBackToStageSelect = this.backToStageSelect;
    this.ui.setStageProgress(this.clearedStages);
    this.ui.showStageSelect();

    this.canvas.addEventListener("mousedown", this.handleDragStart);
    window.addEventListener("mousemove", this.handleDragMove);
    window.addEventListener("mouseup", this.handleDragEnd);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  start() {
    this.loop.start();
  }

  private update = (dt: number) => {
    // しゃがみ解除時の挟まりは猶予を入れてからゲームオーバー。
    if (this.state === "crush_pending" || this.state === "hit_pending") {
      this.crushElapsedMs += dt * 1000;
      if (this.crushElapsedMs >= 1000) {
        this.state = "gameover";
        this.ui.showGameOver();
      }
      return;
    }
    if (this.state !== "playing") return;
    this.timeMs += dt * 1000;
    const { visuals, effects } = this.animationSystem.sample(this.timeMs);
    this.visuals = {
      color: this.player.baseColor,
      scale: 1,
      ...visuals
    };
    this.player.dashShape = Boolean(effects.dashShape);
    this.player.isDefending = Boolean(effects.isDefending);
    if (!effects.velocityOverride) effects.velocityOverride = {};
    const reverseTriggered = effects.directionFlip !== undefined;
    if (reverseTriggered && this.timeMs - this.lastReverseMs > 50) {
      // 反転は短時間に連続発火しないように制御。
      this.moveDirection *= -1;
      this.lastReverseMs = this.timeMs;
      if (this.player.vy < 0) this.player.vy = Math.abs(this.player.vy);
      effects.velocityOverride.x = this.baseMoveSpeed * this.moveDirection;
    }
    if (
      !reverseTriggered &&
      effects.velocityOverride.x !== undefined &&
      effects.velocityOverride.x !== 0
    ) {
      effects.velocityOverride.x =
        Math.abs(effects.velocityOverride.x) * this.moveDirection;
    }
    if (effects.velocityOverride.x === undefined) {
      effects.velocityOverride.x = this.baseMoveSpeed * this.moveDirection;
    }
    const activePlatforms = this.platformSystem.getActivePlatforms();
    const crushed = this.physicsSystem.update(
      dt,
      this.player,
      effects,
      this.stage,
      activePlatforms
    );
    if (crushed) {
      this.state = "crush_pending";
      this.crushElapsedMs = 0;
      this.player.deadEyes = true;
      return;
    }
    this.platformSystem.update(dt, this.player);
    const hitGoal =
      this.player.x <= this.stage.goal.x &&
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

    // 敵と弾の更新
    this.enemySystem.update(dt, this.stage, this.player, (enemy) => {
      this.bulletSystem.spawnBullet(enemy);
    });
    const hitBullet = this.bulletSystem.update(dt, this.player, this.stage);
    if (hitBullet) {
      this.state = "hit_pending";
      this.crushElapsedMs = 0;
      this.player.deadEyes = true;
      return;
    }
    if (this.player.x > this.stage.size.width + this.player.width) {
      this.state = "gameover";
      this.ui.showGameOver();
    }
    if (this.player.x + this.player.width < 0) {
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
      this.obstacleSystem.getObstacles(),
      this.bulletSystem.getBullets(),
      this.platformSystem.getActivePlatforms(),
      this.camera
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
    this.ui.showSelection(true);
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

  private backToStageSelectFromGameOver = () => {
    if (this.state !== "gameover") return;
    this.reset();
    this.state = "stage_select";
    this.ui.showStageSelect();
  };

  private previewStage = () => {
    if (this.state !== "selecting") return;
    this.state = "paused";
    this.ui.showStagePreview();
    this.ui.renderStagePreview((ctx, camera) =>
      this.renderer.renderStagePreview(ctx, camera)
    );
  };

  private backToSelection = () => {
    if (this.state !== "paused") return;
    this.state = "selecting";
    this.ui.showSelection(true);
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
    this.renderer = new Renderer(this.canvas, this.stage);
    this.platformSystem = new PlatformSystem(this.stage);
    this.enemySystem = new EnemySystem(this.stage);
    this.reset();
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
    this.moveDirection = 1;
    this.lastReverseMs = -Infinity;
    this.crushElapsedMs = 0;
    this.player.reset(this.stage.playerStart.x, this.stage.playerStart.y);
    this.obstacleSystem.reset(this.stage);
    this.platformSystem.reset(this.stage);
    this.enemySystem.reset(this.stage);
    this.bulletSystem.reset();
    this.resetCamera();
  }

  private applySelectionOptions(stage: StageData) {
    const options =
      stage.animationChoices.length > 0
        ? getAnimationDefinitionsById(stage.animationChoices)
        : animationDefinitions;
    this.ui.setAnimationOptions(options, stage.newAnimationIds ?? []);
    this.ui.setMaxSelectionCount(stage.maxSelectionCount);
    this.ui.setStagePreviewStage(stage);
  }

  private resetCamera() {
    const viewWidth = this.canvas.width / this.camera.scale;
    const viewHeight = this.canvas.height / this.camera.scale;
    const targetX = this.player.x + this.player.width / 2 - viewWidth / 2;
    const targetY = this.player.y + this.player.height / 2 - viewHeight / 2;
    this.camera.x = targetX;
    this.camera.y = targetY;
    this.clampCamera();
  }

  private clampCamera() {
    const viewWidth = this.canvas.width / this.camera.scale;
    const viewHeight = this.canvas.height / this.camera.scale;
    const maxX = Math.max(0, this.stage.size.width - viewWidth);
    const maxY = Math.max(0, this.stage.size.height - viewHeight);
    this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
    this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
  }

  private handleDragStart = (event: MouseEvent) => {
    if (this.state !== "playing" && this.state !== "paused") return;
    this.isDragging = true;
    this.lastDrag = { x: event.clientX, y: event.clientY };
  };

  private handleDragMove = (event: MouseEvent) => {
    if (!this.isDragging) return;
    if (this.state !== "playing" && this.state !== "paused") return;
    const dx = (event.clientX - this.lastDrag.x) / this.camera.scale;
    const dy = (event.clientY - this.lastDrag.y) / this.camera.scale;
    this.camera.x -= dx;
    this.camera.y -= dy;
    this.lastDrag = { x: event.clientX, y: event.clientY };
    this.clampCamera();
  };

  private handleDragEnd = () => {
    this.isDragging = false;
  };

  private handleWheel = (event: WheelEvent) => {
    if (this.state !== "playing" && this.state !== "paused") return;
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = mouseX / this.camera.scale + this.camera.x;
    const worldY = mouseY / this.camera.scale + this.camera.y;
    const zoomFactor = Math.exp(-event.deltaY * 0.001);
    this.camera.scale = Math.min(
      this.maxZoom,
      Math.max(this.minZoom, this.camera.scale * zoomFactor)
    );
    this.camera.x = worldX - mouseX / this.camera.scale;
    this.camera.y = worldY - mouseY / this.camera.scale;
    this.clampCamera();
  };
}
