import { AnimationDefinition, buildAnimationClips } from "../data/animations.js";
import { AnimationSystem } from "../systems/AnimationSystem.js";
import { PhysicsSystem } from "../systems/PhysicsSystem.js";
import { Player } from "../entities/Player.js";
import { CameraState, EffectState, StageData } from "../core/types.js";
import { stageLinks, stageNodes } from "../data/stageMap.js";
import { StageSelectView } from "./StageSelectView.js";


export class UiController {
  onPause: (() => void) | null = null;
  onContinue: (() => void) | null = null;
  onRetry: (() => void) | null = null;
  onGameOverToStageSelect: (() => void) | null = null;
  onPlayAgain: (() => void) | null = null;
  onClearToStageSelect: (() => void) | null = null;
  onPreviewStage: (() => void) | null = null;
  onBackToSelection: (() => void) | null = null;
  onStartSelection: ((ids: string[]) => void) | null = null;
  onStageSelected: ((id: string) => void) | null = null;
  onBackToStageSelect: (() => void) | null = null;

  private pauseButton: HTMLButtonElement;
  private selectionModal: HTMLDivElement;
  private stageSelectModal: HTMLDivElement;
  private selectionList: HTMLDivElement;
  private selectionCountHint: HTMLParagraphElement;
  private startButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private undoButton: HTMLButtonElement;
  private previewStageButton: HTMLButtonElement;
  private backToSelectionButton: HTMLButtonElement;
  private backToStageSelectButton: HTMLButtonElement;
  private statusModal: HTMLDivElement;
  private stageModal: HTMLDivElement;
  private stagePreviewCanvas: HTMLCanvasElement;
  private stageSelectCanvas: HTMLCanvasElement;
  private stageSelectView: StageSelectView;
  private stageSelectZoomedOut = false;
  private stagePreviewStage: StageData | null = null;
  private stagePreviewCamera = { x: 0, y: 0, scale: 1 };
  private stagePreviewDragging = false;
  private stagePreviewLast = { x: 0, y: 0 };
  private stagePreviewMinZoom = 1;
  private stagePreviewMaxZoom = 1.2;
  private clearedStages = new Set<string>();
  private statusTitle: HTMLHeadingElement;
  private statusButtons: HTMLDivElement;
  private selectedIds: string[] = [];
  private maxSelectionCount = 3;
  private cardMap = new Map<
    string,
    { orderRow: HTMLDivElement; preview: PreviewRunner }
  >();

  constructor(root: HTMLElement) {
    const pauseButton = root.querySelector("#pauseButton");
    const selectionModal = root.querySelector("#selectionModal");
    const stageSelectModal = root.querySelector("#stageSelectModal");
    const selectionList = root.querySelector("#selectionList");
    const selectionCountHint = root.querySelector("#selectionCountHint");
    const startButton = root.querySelector("#startButton");
    const resetButton = root.querySelector("#resetButton");
    const undoButton = root.querySelector("#undoButton");
    const previewStageButton = root.querySelector("#previewStageButton");
    const backToStageSelectButton = root.querySelector("#backToStageSelectButton");
    const statusModal = root.querySelector("#statusModal");
    const stageModal = root.querySelector("#stageModal");
    const backToSelectionButton = root.querySelector("#backToSelectionButton");
    const stagePreviewCanvas = root.querySelector("#stagePreviewCanvas");
    const stageSelectCanvas = root.querySelector("#stageSelectCanvas");
    const statusTitle = root.querySelector("#statusTitle");
    const statusButtons = root.querySelector("#statusButtons");

    if (
      !(pauseButton instanceof HTMLButtonElement) ||
      !(stageSelectModal instanceof HTMLDivElement) ||
      !(selectionModal instanceof HTMLDivElement) ||
      !(selectionList instanceof HTMLDivElement) ||
      !(selectionCountHint instanceof HTMLParagraphElement) ||
      !(startButton instanceof HTMLButtonElement) ||
      !(resetButton instanceof HTMLButtonElement) ||
      !(undoButton instanceof HTMLButtonElement) ||
      !(previewStageButton instanceof HTMLButtonElement) ||
      !(backToStageSelectButton instanceof HTMLButtonElement) ||
      !(statusModal instanceof HTMLDivElement) ||
      !(stageModal instanceof HTMLDivElement) ||
      !(backToSelectionButton instanceof HTMLButtonElement) ||
      !(stagePreviewCanvas instanceof HTMLCanvasElement) ||
      !(stageSelectCanvas instanceof HTMLCanvasElement) ||
      !(statusTitle instanceof HTMLHeadingElement) ||
      !(statusButtons instanceof HTMLDivElement)
    ) {
      throw new Error("UI elements not found");
    }

    this.pauseButton = pauseButton;
    this.stageSelectModal = stageSelectModal;
    this.selectionModal = selectionModal;
    this.selectionList = selectionList;
    this.selectionCountHint = selectionCountHint;
    this.startButton = startButton;
    this.resetButton = resetButton;
    this.undoButton = undoButton;
    this.previewStageButton = previewStageButton;
    this.backToStageSelectButton = backToStageSelectButton;
    this.statusModal = statusModal;
    this.stageModal = stageModal;
    this.backToSelectionButton = backToSelectionButton;
    this.stagePreviewCanvas = stagePreviewCanvas;
    this.stageSelectCanvas = stageSelectCanvas;
    this.stageSelectView = new StageSelectView(
      this.stageSelectCanvas,
      stageNodes,
      stageLinks
    );
    this.stageSelectView.setScaleLimits(0.7, 1.35);
    this.stageSelectView.setClearedStages(this.clearedStages);
    this.statusTitle = statusTitle;
    this.statusButtons = statusButtons;

    this.pauseButton.addEventListener("click", () => this.onPause?.());
    this.startButton.addEventListener("click", () => {
      if (this.selectedIds.length !== this.maxSelectionCount) return;
      this.onStartSelection?.([...this.selectedIds]);
    });
    this.resetButton.addEventListener("click", () => this.resetSelection());
    this.undoButton.addEventListener("click", () => this.undoSelection());
    this.previewStageButton.addEventListener("click", () =>
      this.onPreviewStage?.()
    );
    this.backToSelectionButton.addEventListener("click", () =>
      this.onBackToSelection?.()
    );
    this.backToStageSelectButton.addEventListener("click", () =>
      this.onBackToStageSelect?.()
    );
    this.stageSelectView.setOnSelect((id) => this.onStageSelected?.(id));

    this.stagePreviewCanvas.addEventListener("pointerdown", (event) => {
      if (!this.stagePreviewStage) return;
      event.preventDefault();
      this.stagePreviewDragging = true;
      this.stagePreviewLast = { x: event.clientX, y: event.clientY };
      this.stagePreviewCanvas.setPointerCapture(event.pointerId);
    });
    this.stagePreviewCanvas.addEventListener("pointermove", (event) => {
      if (!this.stagePreviewDragging || !this.stagePreviewStage) return;
      const dx = (event.clientX - this.stagePreviewLast.x) / this.stagePreviewCamera.scale;
      const dy = (event.clientY - this.stagePreviewLast.y) / this.stagePreviewCamera.scale;
      this.stagePreviewCamera.x -= dx;
      this.stagePreviewCamera.y -= dy;
      this.stagePreviewLast = { x: event.clientX, y: event.clientY };
      this.clampStagePreviewCamera();
      const ctx = this.stagePreviewCanvas.getContext("2d");
      if (!ctx) return;
      this.previewStageRenderer?.(ctx, this.stagePreviewCamera);
    });
    const endPreviewDrag = (event: PointerEvent) => {
      if (!this.stagePreviewDragging) return;
      this.stagePreviewDragging = false;
      this.stagePreviewCanvas.releasePointerCapture(event.pointerId);
    };
    this.stagePreviewCanvas.addEventListener("pointerup", endPreviewDrag);
    this.stagePreviewCanvas.addEventListener("pointercancel", endPreviewDrag);
    this.stagePreviewCanvas.addEventListener("wheel", (event) => {
      if (!this.stagePreviewStage) return;
      event.preventDefault();
      const rect = this.stagePreviewCanvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const worldX = mouseX / this.stagePreviewCamera.scale + this.stagePreviewCamera.x;
      const worldY = mouseY / this.stagePreviewCamera.scale + this.stagePreviewCamera.y;
      const zoomFactor = Math.exp(-event.deltaY * 0.001);
      this.stagePreviewCamera.scale = Math.min(
        this.stagePreviewMaxZoom,
        Math.max(this.stagePreviewMinZoom, this.stagePreviewCamera.scale * zoomFactor)
      );
      this.stagePreviewCamera.x = worldX - mouseX / this.stagePreviewCamera.scale;
      this.stagePreviewCamera.y = worldY - mouseY / this.stagePreviewCamera.scale;
      this.clampStagePreviewCamera();
      const ctx = this.stagePreviewCanvas.getContext("2d");
      if (!ctx) return;
      this.previewStageRenderer?.(ctx, this.stagePreviewCamera);
    }, { passive: false });
  }

  setAnimationOptions(options: AnimationDefinition[]) {
    this.selectionList.innerHTML = "";
    this.cardMap.clear();
    for (const option of options) {
      const card = document.createElement("div");
      card.className = "ui-option-card";

      const previewWrap = document.createElement("div");
      previewWrap.className = "ui-preview";

      const previewLabel = document.createElement("div");
      previewLabel.className = "ui-preview-label";
      previewLabel.textContent = option.name;
      previewWrap.appendChild(previewLabel);

      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 120;
      previewWrap.appendChild(canvas);

      const orderRow = document.createElement("div");
      orderRow.className = "ui-order";

      const preview = new PreviewRunner(canvas, option);
      card.addEventListener("mouseenter", () => preview.start());
      card.addEventListener("mouseleave", () => preview.stop());

      card.addEventListener("click", () => {
        if (this.selectedIds.length >= this.maxSelectionCount) return;
        this.selectedIds.push(option.id);
        this.renderOrder();
      });

      card.appendChild(previewWrap);
      card.appendChild(orderRow);
      this.selectionList.appendChild(card);
      this.cardMap.set(option.id, { orderRow, preview });
    }
    this.resetSelection();
  }

  showSelection(keepSelection = false) {
    this.pauseButton.classList.add("is-hidden");
    this.statusModal.classList.add("is-hidden");
    this.stageModal.classList.add("is-hidden");
    this.stageSelectModal.classList.add("is-hidden");
    if (!keepSelection) {
      this.resetSelection();
    } else {
      this.renderOrder();
    }
    this.selectionModal.classList.remove("is-hidden");
  }

  showPlaying() {
    this.selectionModal.classList.add("is-hidden");
    this.statusModal.classList.add("is-hidden");
    this.stageModal.classList.add("is-hidden");
    this.stageSelectModal.classList.add("is-hidden");
    this.pauseButton.classList.remove("is-hidden");
  }

  showPause() {
    this.pauseButton.classList.add("is-hidden");
    this.selectionModal.classList.add("is-hidden");
    this.stageModal.classList.add("is-hidden");
    this.stageSelectModal.classList.add("is-hidden");
    this.statusTitle.textContent = "Pause";
    this.statusButtons.innerHTML = "";

    this.statusButtons.appendChild(
      this.createStatusButton("Continue（続行）", () => this.onContinue?.())
    );
    this.statusButtons.appendChild(
      this.createStatusButton("Retry（リトライ）", () => this.onRetry?.())
    );
    this.statusModal.classList.remove("is-hidden");
  }

  showClear() {
    this.pauseButton.classList.add("is-hidden");
    this.selectionModal.classList.add("is-hidden");
    this.stageModal.classList.add("is-hidden");
    this.stageSelectModal.classList.add("is-hidden");
    this.statusTitle.textContent = "Stage Clear";
    this.statusButtons.innerHTML = "";
    this.statusButtons.appendChild(
      this.createStatusButton("Play Again（もう一度プレイする）", () =>
        this.onPlayAgain?.()
      )
    );
    this.statusButtons.appendChild(
      this.createStatusButton("ステージ選択に戻る", () =>
        this.onClearToStageSelect?.()
      )
    );
    this.statusModal.classList.remove("is-hidden");
  }

  showGameOver() {
    this.pauseButton.classList.add("is-hidden");
    this.selectionModal.classList.add("is-hidden");
    this.stageModal.classList.add("is-hidden");
    this.stageSelectModal.classList.add("is-hidden");
    this.statusTitle.textContent = "Game Over";
    this.statusButtons.innerHTML = "";
    this.statusButtons.appendChild(
      this.createStatusButton("Retry（リトライ）", () => this.onRetry?.())
    );
    this.statusButtons.appendChild(
      this.createStatusButton("ステージ選択に戻る", () =>
        this.onGameOverToStageSelect?.()
      )
    );
    this.statusModal.classList.remove("is-hidden");
  }

  getSelectedIds() {
    return [...this.selectedIds];
  }

  showStagePreview() {
    this.selectionModal.classList.add("is-hidden");
    this.statusModal.classList.add("is-hidden");
    this.pauseButton.classList.add("is-hidden");
    this.stageSelectModal.classList.add("is-hidden");
    this.stageModal.classList.remove("is-hidden");
    this.resetStagePreviewCamera();
  }

  showStageSelect() {
    this.pauseButton.classList.add("is-hidden");
    this.selectionModal.classList.add("is-hidden");
    this.statusModal.classList.add("is-hidden");
    this.stageModal.classList.add("is-hidden");
    this.stageSelectModal.classList.remove("is-hidden");
    this.stageSelectView.render();
  }

  setStageProgress(cleared: Set<string>) {
    this.clearedStages = new Set(cleared);
    this.stageSelectView.setClearedStages(this.clearedStages);
  }

  private previewStageRenderer: ((ctx: CanvasRenderingContext2D, camera: CameraState) => void) | null = null;

  renderStagePreview(renderer: (ctx: CanvasRenderingContext2D, camera: CameraState) => void) {
    const ctx = this.stagePreviewCanvas.getContext("2d");
    if (!ctx) return;
    this.previewStageRenderer = renderer;
    renderer(ctx, this.stagePreviewCamera);
  }

  setStagePreviewStage(stage: StageData) {
    this.stagePreviewStage = stage;
    this.resetStagePreviewCamera();
  }

  private resetStagePreviewCamera() {
    if (!this.stagePreviewStage) return;
    this.stagePreviewCamera.scale = 1;
    const viewWidth = this.stagePreviewCanvas.width / this.stagePreviewCamera.scale;
    const viewHeight = this.stagePreviewCanvas.height / this.stagePreviewCamera.scale;
    const targetX =
      this.stagePreviewStage.playerStart.x -
      viewWidth / 2 +
      40;
    const targetY =
      this.stagePreviewStage.playerStart.y -
      viewHeight / 2 +
      40;
    this.stagePreviewCamera.x = targetX;
    this.stagePreviewCamera.y = targetY;
    this.clampStagePreviewCamera();
  }

  private clampStagePreviewCamera() {
    if (!this.stagePreviewStage) return;
    const viewWidth = this.stagePreviewCanvas.width / this.stagePreviewCamera.scale;
    const viewHeight = this.stagePreviewCanvas.height / this.stagePreviewCamera.scale;
    const maxX = Math.max(0, this.stagePreviewStage.size.width - viewWidth);
    const maxY = Math.max(0, this.stagePreviewStage.size.height - viewHeight);
    this.stagePreviewCamera.x = Math.max(0, Math.min(this.stagePreviewCamera.x, maxX));
    this.stagePreviewCamera.y = Math.max(0, Math.min(this.stagePreviewCamera.y, maxY));
  }


  setMaxSelectionCount(count: number) {
    this.maxSelectionCount = Math.max(1, count);
    if (this.selectedIds.length > this.maxSelectionCount) {
      this.selectedIds = this.selectedIds.slice(0, this.maxSelectionCount);
    }
    this.renderOrder();
  }

  private resetSelection() {
    this.selectedIds = [];
    this.renderOrder();
  }

  private undoSelection() {
    if (this.selectedIds.length === 0) return;
    this.selectedIds = this.selectedIds.slice(0, -1);
    this.renderOrder();
  }

  private renderOrder() {
    for (const entry of this.cardMap.values()) {
      entry.orderRow.innerHTML = "";
    }
    const perRowCount = new Map<string, number>();
    this.selectedIds.forEach((id, index) => {
      const entry = this.cardMap.get(id);
      if (!entry) return;
      const current = (perRowCount.get(id) ?? 0) + 1;
      perRowCount.set(id, current);
      if (current === 11) {
        const breakSpan = document.createElement("span");
        breakSpan.className = "ui-order-break";
        entry.orderRow.appendChild(breakSpan);
      }
      const badge = document.createElement("span");
      badge.className = "ui-badge";
      if (current >= 11) {
        badge.classList.add("ui-badge--small");
      }
      badge.textContent = String(index + 1);
      entry.orderRow.appendChild(badge);
    });
    const count = this.selectedIds.length;
    this.selectionCountHint.textContent = `選択数: ${count} / ${this.maxSelectionCount}`;
    this.startButton.disabled = count !== this.maxSelectionCount;
  }

  private createStatusButton(label: string, onClick: () => void) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ui-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }
}

class PreviewRunner {
  private ctx: CanvasRenderingContext2D;
  private rafId = 0;
  private lastTime = 0;
  private elapsedMs = 0;
  private groundY = 80;
  private doubleJumpGroundY = 90;
  private previewScale = 1;
  private loopDurationMs = 0;
  private preActionDelay = 0.5;
  private postActionDelay = 0.5;
  private baseMoveSpeed = 110;
  private moveDirection = 1;
  private lastReverseMs = -Infinity;
  private physicsSystem = new PhysicsSystem();
  private animationSystem: AnimationSystem;
  private player: Player;
  private stage: StageData;

  constructor(
    private canvas: HTMLCanvasElement,
    private definition: AnimationDefinition
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    this.ctx = ctx;
    this.player = new Player(20, 0);
    this.stage = this.createStage();
    this.animationSystem = new AnimationSystem(buildAnimationClips([definition.id], { startDelayOverrideSec: 0 }));
    this.reset();
  }

  start() {
    if (this.rafId) return;
    this.lastTime = 0;
    this.elapsedMs = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.rafId) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.clear();
    this.reset();
  }

  private reset() {
    this.previewScale = this.definition.effect.type === "double-jump" ? 0.45 : 0.65;
    this.stage = this.createStage();
    this.player.reset(20, this.stage.groundY - this.player.baseHeight);
    this.moveDirection = 1;
    this.lastReverseMs = -Infinity;
    this.elapsedMs = 0;
    this.animationSystem = new AnimationSystem(
      buildAnimationClips([this.definition.id], { startDelayOverrideSec: 0 })
    );
    this.loopDurationMs =
      Math.max(
        0.8,
        this.definition.durationSec + this.preActionDelay + this.postActionDelay
      ) * 1000;
  }

  private tick = (time: number) => {
    if (!this.lastTime) this.lastTime = time;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.elapsedMs += dt * 1000;
    if (this.elapsedMs >= this.loopDurationMs) {
      this.reset();
      this.draw();
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const actionTimeMs = this.elapsedMs - this.preActionDelay * 1000;
    let effects: EffectState = {};
    const actionEndMs = this.definition.durationSec * 1000;
    if (actionTimeMs >= 0 && actionTimeMs <= actionEndMs) {
      effects = this.animationSystem.sample(actionTimeMs).effects;
    }
    this.player.dashShape = Boolean(effects.dashShape);
    if (!effects.velocityOverride) effects.velocityOverride = {};
    const reverseTriggered = effects.directionFlip !== undefined;
    if (reverseTriggered && this.elapsedMs - this.lastReverseMs > 50) {
      this.moveDirection *= -1;
      this.lastReverseMs = this.elapsedMs;
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
    const crushed = this.physicsSystem.update(
      dt,
      this.player,
      effects,
      this.stage,
      this.stage.platforms
    );
    if (crushed) {
      this.reset();
      this.draw();
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    if (this.player.x > this.stage.size.width + 10) {
      this.player.x = this.stage.size.width + 10;
    }

    this.draw();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#0c0c12";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    const groundY =
      this.definition.effect.type === "double-jump"
        ? this.doubleJumpGroundY
        : this.groundY;
    const targetScreenY = this.canvas.height * 0.86;
    const translateY = targetScreenY - groundY * this.previewScale;
    ctx.translate(0, translateY);
    ctx.scale(this.previewScale, this.previewScale);
    ctx.strokeStyle = "#2f2f3d";
    ctx.beginPath();
    ctx.moveTo(0, this.stage.groundY);
    ctx.lineTo(this.stage.size.width, this.stage.groundY);
    ctx.stroke();

    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 2;
    const drawX = this.player.x;
    const drawY = this.player.y;
    const drawWidth = this.player.width;
    const drawHeight = this.player.height;
    const dashDir = this.player.vx < 0 ? -1 : 1;
    const skewX = this.player.dashShape
      ? Math.min(drawWidth * 0.5, drawHeight * 0.8) * dashDir
      : 0;
    if (this.player.dashShape) {
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

    ctx.fillStyle = "#f5f5f5";
    const eyeRadiusX = Math.max(2, drawWidth * 0.05);
    const eyeRadiusY = Math.max(2, this.player.baseHeight * 0.08);
    const eyeY = drawY + drawHeight * 0.38;
    const eyeBaseOffsetX = drawWidth * 0.26;
    const gaze = Math.max(-1, Math.min(1, this.player.vx / 120));
    const eyeShift =
      gaze * drawWidth * 0.06 + (this.player.dashShape && dashDir < 0 ? 15 : 0);
    const skewAtEye =
      skewX !== 0 ? ((drawHeight - (eyeY - drawY)) / drawHeight) * skewX : 0;
    if (this.player.dashShape) {
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
    ctx.restore();
  }

  private createStage(): StageData {
    const groundY =
      this.definition.effect.type === "double-jump"
        ? this.doubleJumpGroundY
        : this.groundY;
    const baseHeight = this.player.baseHeight;
    return {
      id: "preview",
      name: "Preview",
      size: {
        width: this.canvas.width / this.previewScale,
        height: this.canvas.height / this.previewScale
      },
      groundY,
      holes: [],
      maxSelectionCount: 1,
      animationChoices: [],
      playerStart: { x: 20, y: groundY - baseHeight },
      goal: { x: 9999, y: 0, height: 0 },
      platforms: [],
      obstacles: [],
      animationIds: []
    };
  }
}






