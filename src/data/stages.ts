import { StageData } from "../core/types.js";

export const stages: StageData[] = [
  {
    id: "tutorial",
    name: "Tutorial",
    size: { width: 800, height: 450 },
    groundY: 400,
    playerStart: { x: 80, y: 200 },
    goalX: 700,
    animationIds: [
      "tutorial-move",
      "tutorial-hop",
      "tutorial-color",
      "tutorial-scale"
    ]
  }
];
