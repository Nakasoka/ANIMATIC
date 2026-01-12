import { StageData } from "../core/types.js";

export const stages: StageData[] = [
  {
    id: "tutorial",
    name: "Tutorial",
    size: { width: 800, height: 450 },
    groundY: 400,
    holes: [
      { x: 300, width: 80 },
      { x: 520, width: 70 }
    ],
    maxSelectionCount: 3,
    playerStart: { x: 80, y: 360 },
    goalX: 700,
    animationIds: [
      "tutorial-move",
      "tutorial-hop",
      "tutorial-color",
      "tutorial-scale"
    ]
  }
];
