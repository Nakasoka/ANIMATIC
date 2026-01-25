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
      { x: 430, width: 80 }
    ],
    maxSelectionCount: 5,
    animationChoices: ["jump", "double-jump", "reverse", "crouch"],
    playerStart: { x: 80, y: 360 },
    goal: { x: 540, y: 320, height: 80 },
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
  },
  {
    id: "1-4",
    name: "1-4",
    size: { width: 800, height: 450 },
    groundY: 400,
    holes: [
      { x: 0, width: 800 }
    ],
    maxSelectionCount: 5,
    animationChoices: ["double-jump", "reverse", "move", "dash"],
    playerStart: { x: 40, y: 260 },
    goal: { x: 60, y: 140, height: 80 },
    platforms: [
      { x: 0, y: 120, width: 360, height: 20 },
      { x: 360, y: 0, width: 20, height: 140 },
      { x: 0, y: 220, width: 140, height: 20 },
      {
        id: "1-4-yellow-1",
        x: 140,
        y: 220,
        width: 120,
        height: 20,
        vanishOnStandMs: 500,
        color: "#d6a33b"
      },
      { x: 260, y: 220, width: 100, height: 20 },
      { x: 460, y: 220, width: 180, height: 20 },
      { x: 0, y: 300, width: 180, height: 20 },
      {
        id: "1-4-yellow-2",
        x: 180,
        y: 300,
        width: 120,
        height: 20,
        vanishOnStandMs: 500,
        color: "#d6a33b"
      },
      { x: 300, y: 300, width: 160, height: 20 }
    ],
    obstacles: [],
    animationIds: []
  },
  {
    id: "1-5",
    name: "1-5",
    size: { width: 800, height: 900 },
    groundY: 880,
    holes: [
      { x: 420, width: 100 }
    ],
    maxSelectionCount: 15,
    animationChoices: [
      "jump",
      "double-jump",
      "stop",
      "move",
      "reverse",
      "crouch",
      "dash"
    ],
    playerStart: { x: 120, y: 840 },
    goal: { x: 740, y: 160, height: 80 },
    platforms: [
      { x: 580, y: 840, width: 100, height: 20 },
      { x: 0, y: 800, width: 160, height: 20 },
      { x: 280, y: 800, width: 180, height: 20 },
      { x: 640, y: 780, width: 180, height: 20 },
      { x: 0, y: 740, width: 80, height: 20 },
      { x: 460, y: 700, width: 220, height: 20 },
      { x: 540, y: 660, width: 80, height: 20 },

      { x: 120, y: 640, width: 80, height: 20 },
      {
        id: "1-5-yellow-1",
        x: 200,
        y: 640,
        width: 80,
        height: 20,
        vanishOnStandMs: 500,
        color: "#d6a33b"
      },
      { x: 280, y: 640, width: 80, height: 20 },

      { x: 540, y: 600, width: 20, height: 60 },

      { x: 200, y: 580, width: 80, height: 20 },

      { x: 420, y: 540, width: 120, height: 20 },
      { x: 600, y: 540, width: 220, height: 20 },

      { x: 260, y: 480, width: 20, height: 100 },
      { x: 280, y: 480, width: 60, height: 20 },

      { x: 600, y: 480, width: 80, height: 20 },
      { x: 600, y: 400, width: 20, height: 80 },
      { x: 440, y: 400, width: 100, height: 20 },

      { x: 0, y: 400, width: 80, height: 20 },
      {
        id: "1-5-yellow-2",
        x: 80,
        y: 400,
        width: 80,
        height: 20,
        vanishOnStandMs: 500,
        color: "#d6a33b"
      },
      { x: 160, y: 400, width: 80, height: 20 },

      { x: 720, y: 360, width: 80, height: 20 },

      { x: 240, y: 300, width: 400, height: 20 },

      { x: 300, y: 260, width: 80, height: 20 },
      { x: 460, y: 260, width: 120, height: 20 },

      { x: 80, y: 240, width: 20, height: 100 },
      { x: 100, y: 240, width: 60, height: 20 },

      { x: 680, y: 240, width: 120, height: 20 },

      { x: 500, y: 220, width: 80, height: 20 },

      { x: 500, y: 140, width: 20, height: 80 },
      { x: 300, y: 140, width: 200, height: 20 }
    ],
    obstacles: [
      {
        id: "1-5-spike-top",
        type: "falling_spike",
        x: 340,
        y: 160,
        width: 30,
        height: 30,
        trigger: { x: 320, y: 220, width: 80, height: 180 },
        fallSpeed: 320
      },
      {
        id: "1-5-spike-mid",
        type: "falling_spike",
        x: 700,
        y: 560,
        width: 30,
        height: 30,
        trigger: { x: 680, y: 680, width: 80, height: 160 },
        fallSpeed: 320
      },
      {
        id: "1-5-spike-low",
        type: "falling_spike",
        x: 380,
        y: 660,
        width: 30,
        height: 30,
        trigger: { x: 360, y: 720, width: 80, height: 160 },
        fallSpeed: 320
      }
    ],
    animationIds: []
  }
];
