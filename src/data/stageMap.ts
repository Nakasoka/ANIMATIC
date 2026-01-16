export type LinkStyle = "solid" | "dotted";

export interface StageNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface StageLink {
  from: string;
  to: string;
  style: LinkStyle;
}

const DEV_UNLOCK_ALL_STAGES = true;
const GRID_X = 140;
const GRID_Y = 110;
const ORIGIN_X = 220;
const ORIGIN_Y = 260;

const makeId = (col: number, row: number) => `${col}-${row}`;

const nodes: StageNode[] = [];

nodes.push({
  id: "tutorial",
  label: "Tutorial",
  x: ORIGIN_X - GRID_X,
  y: ORIGIN_Y,
});

const columnDirections: Record<number, "up" | "down"> = {
  1: "up",
  2: "down",
  3: "up",
  4: "down",
  5: "up"
};

for (let col = 1; col <= 5; col += 1) {
  const direction = columnDirections[col];
  for (let row = 1; row <= 5; row += 1) {
    const step = direction === "up" ? -(row - 1) : row - 1;
    nodes.push({
      id: makeId(col, row),
      label: `${col}-${row}`,
      x: ORIGIN_X + GRID_X * (col - 1),
      y: ORIGIN_Y + GRID_Y * step
    });
  }
}

const links: StageLink[] = [];

links.push({ from: "tutorial", to: "1-1", style: "solid" });

for (let row = 1; row < 5; row += 1) {
  const style: LinkStyle = "solid";
  links.push({ from: makeId(1, row), to: makeId(1, row + 1), style });
}

links.push({ from: "1-1", to: "2-1", style: "solid" });

for (let col = 2; col < 5; col += 1) {
  links.push({
    from: makeId(col, 1),
    to: makeId(col + 1, 1),
    style: "dotted"
  });
}

for (let col = 2; col <= 5; col += 1) {
  for (let row = 1; row < 5; row += 1) {
    links.push({
      from: makeId(col, row),
      to: makeId(col, row + 1),
      style: "dotted"
    });
  }
}

// 開発中は全ステージを選択可能にする。戻すときは false にする。
export const stageNodes = nodes;
export const stageLinks = links;

const parseStageId = (id: string) => {
  const parts = id.split("-");
  if (parts.length !== 2) return null;
  const col = Number(parts[0]);
  const row = Number(parts[1]);
  if (!Number.isFinite(col) || !Number.isFinite(row)) return null;
  return { col, row };
};

export const isStageEnabled = (id: string, cleared: Set<string>) => {
  if (DEV_UNLOCK_ALL_STAGES) return true;
  if (id === "tutorial") return true;
  const parsed = parseStageId(id);
  if (!parsed) return false;
  const { col, row } = parsed;
  if (col === 1 && row === 1) return true;
  if (row === 1) {
    return cleared.has(`${col - 1}-5`);
  }
  return cleared.has(`${col}-${row - 1}`);
};

export const getLinkStyleForProgress = (
  link: StageLink,
  cleared: Set<string>
): LinkStyle => {
  if (link.from === "tutorial") {
    return cleared.has("tutorial") ? "solid" : "dotted";
  }
  const fromParsed = parseStageId(link.from);
  const toParsed = parseStageId(link.to);
  if (!fromParsed || !toParsed) return "dotted";
  if (fromParsed.col !== toParsed.col && fromParsed.row === 1 && toParsed.row === 1) {
    return cleared.has(`${fromParsed.col}-5`) ? "solid" : "dotted";
  }
  return cleared.has(link.from) ? "solid" : "dotted";
};

