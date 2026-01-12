import { Game } from "./core/Game.js";
import { UiController } from "./ui/UiController.js";

const canvas = document.getElementById("gameCanvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #gameCanvas element");
}

const uiRoot = document.getElementById("ui");
if (!(uiRoot instanceof HTMLElement)) {
  throw new Error("Missing #ui element");
}

const ui = new UiController(uiRoot);
const game = new Game(canvas, ui);
game.start();
