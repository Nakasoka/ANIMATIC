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
    playerStart: { x: 90, y: 360 },
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
    maxSelectionCount: 4,
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
  },
  {
    id: "1-2",
    name: "1-2",
    size: { width: 800, height: 450 },
    groundY: 400,
    holes: [],
    maxSelectionCount: 5,
    animationChoices: ["jump", "stop", "move", "reverse"],
    playerStart: { x: 140, y: 360 },
    goal: { x: 170, y: 125, height: 90 },
    platforms: [
      { x: 110, y: 215, width: 160, height: 20 },
      { x: 290, y: 300, width: 145, height: 20 }
    ],
    obstacles: [],
    animationIds: []
  },
  {
    id: "1-3",
    name: "1-3",
    size: { width: 800, height: 450 },
    groundY: 400,
    holes: [
      { x: 430, width: 60 },
    ],
    maxSelectionCount: 5,
    animationChoices: ["jump", "double-jump", "reverse", "crouch"],
    playerStart: { x: 80, y: 360 },
    goal: { x: 520, y: 320, height: 80 },
    platforms: [
      { x: 200, y: 320, width: 220, height: 20 },
      { x: 260, y: 200, width: 20, height: 100 },
      { x: 280, y: 280, width: 60, height: 20 },
      { x: 440, y: 240, width: 260, height: 20 },
      { x: 520, y: 200, width: 180, height: 20 },
      { x: 640, y: 160, width: 160, height: 20 }
    ],
    obstacles: [],
    animationIds: []
  }
];
