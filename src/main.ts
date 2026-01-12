import { Game } from "./core/Game.js";

const canvas = document.getElementById("gameCanvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #gameCanvas element");
}

const game = new Game(canvas);
game.start();
