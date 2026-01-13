import { StageData } from "../core/types.js";

export const stages: StageData[] = [
  {
    id: "tutorial",
    name: "Tutorial",
    size: { width: 800, height: 450 },
    groundY: 400,
    holes: [
      { x: 180, width: 75 }
    ],
    maxSelectionCount: 3,
    animationChoices: ["jump", "double-jump", "stop"],
    playerStart: { x: 80, y: 360 },
    goal: { x: 590, y: 200, height: 100 },
    platforms: [
      { x: 520, y: 300, width: 160, height: 20 }
    ],
    obstacles: [
      {
        id: "spike-1",
        type: "falling_spike",
        x: 350,
        y: 140,
        width: 30,
        height: 30,
        trigger: { x: 310, y: 240, width: 50, height: 160 },
        fallSpeed: 320
      }
    ],
    animationIds: [
      "tutorial-move",
      "tutorial-hop",
      "tutorial-color",
      "tutorial-scale"
    ]
  },
  {
    id: "1-1",
    name: "1-1",
    size: { width: 800, height: 450 },
    groundY: 400,
    holes: [
      { x: 270, width: 65 }
    ],
    maxSelectionCount: 5,
    animationChoices: ["jump", "double-jump", "stop", "move"],
    playerStart: { x: 80, y: 360 },
    goal: { x: 780, y: 150, height: 90 },
    platforms: [
      { x: 230, y: 330, width: 120, height: 20 },
      { x: 550, y: 330, width: 120, height: 20 },
      { x: 360, y: 250, width: 140, height: 20 },
      { x: 720, y: 240, width: 170, height: 20 }
    ],
    obstacles: [
      {
        id: "spike-1-1",
        type: "falling_spike",
        x: 430,
        y: 120,
        width: 30,
        height: 30,
        trigger: { x: 420, y: 180, width: 36, height: 160 },
        fallSpeed: 320
      }
    ],
    animationIds: []
  }
];
