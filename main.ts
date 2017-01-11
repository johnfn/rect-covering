const canvas = document.getElementsByTagName("canvas").item(0);
const context = canvas.getContext("2d")!;

context.translate(0.5, 0.5);

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Line {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

function sortPointsOnLine(l: Line): Line {
  const { x1, x2, y1, y2 } = l;

  return {
    x1: Math.min(x1, x2),
    x2: Math.max(x1, x2),
    y1: Math.min(y1, y2),
    y2: Math.max(y1, y2),
  };
}

function lineLength(l: Line): number {
  return Math.sqrt(
    (l.x2 - l.x1) * (l.x2 - l.x1) +
    (l.y2 - l.y1) * (l.y2 - l.y1)
  );
}

function getLinesFromRect(r: Rect): Line[] {
  return [
    { x1: r.x      , y1: r.y      , x2: r.x + r.w, y2: r.y       },
    { x1: r.x      , y1: r.y      , x2: r.x      , y2: r.y + r.h },
    { x1: r.x + r.w, y1: r.y + r.h, x2: r.x + r.w, y2: r.y       },
    { x1: r.x + r.w, y1: r.y + r.h, x2: r.x      , y2: r.y + r.h },
  ].map(l => sortPointsOnLine(l));
}

function serializeRect(r: Rect): string {
  return `${ r.x }|${ r.y }|${ r.w }|${ r.h }`;
}

function isDegenerateLine(l: Line): boolean {
  return lineLength(l) === 0;
}

function deserializeRect(s: string): Rect {
  const [ x, y, w, h ] = s.split("|").map(x => Number(x));

  return { x, y, w, h };
}

function within(val: number, start: number, end: number): boolean {
  const low = Math.min(start, end);
  const high = Math.max(start, end);

  return val >= low && val <= high;
}

// Must be horizontally/vertically oriented lines
// Does not consider intersection, only overlap
function getLineOverlap(one: Line, two: Line): Line | undefined {
  one = sortPointsOnLine(one);
  two = sortPointsOnLine(two);

  const orientedByX = (
    one.x1 === one.x2 &&
    one.x1 === two.x1 &&
    one.x1 === two.x2
  );

  const orientedByY = (
    one.y1 === one.y2 &&
    one.y1 === two.y1 &&
    one.y1 === two.y2
  );

  if (!orientedByX && !orientedByY) { return undefined; }

  const summedLength  = lineLength(one) + lineLength(two);
  const overallLength = lineLength({
    x1: Math.min(one.x1, two.x1),
    y1: Math.min(one.y1, two.y1),
    x2: Math.max(one.x2, two.x2),
    y2: Math.max(one.y2, two.y2),
  });

  if (overallLength >= summedLength) {
    // These lines do not overlap.

    return undefined;
  }

  if (orientedByX) {
    return {
      x1: one.x1,
      x2: one.x2,
      y1: Math.max(one.y1, two.y1),
      y2: Math.min(one.y2, two.y2),
    };
  } else /* if (orientedByY) */ {
    return {
      y1: one.y1,
      y2: one.y2,
      x1: Math.max(one.x1, two.x1),
      x2: Math.min(one.x2, two.x2),
    };
  }
}

// A----B----C----D
// AD - BC returns AB and CD.
function getNonOverlap(one: Line, two: Line): Line[] | undefined {
  one = sortPointsOnLine(one);
  two = sortPointsOnLine(two);

  const orientedByX = (
    one.x1 === one.x2 &&
    one.x1 === two.x1 &&
    one.x1 === two.x2
  );

  const orientedByY = (
    one.y1 === one.y2 &&
    one.y1 === two.y1 &&
    one.y1 === two.y2
  );

  if (!orientedByX && !orientedByY) { return undefined; }

  const summedLength  = lineLength(one) + lineLength(two);
  const overallLength = lineLength({
    x1: Math.min(one.x1, two.x1),
    y1: Math.min(one.y1, two.y1),
    x2: Math.max(one.x1, two.x1),
    y2: Math.max(one.y1, two.y1),
  });

  if (overallLength >= summedLength) {
    // These lines do not overlap.

    return undefined;
  }

  if (orientedByX) {
    return [
      { x1: one.x1, x2: one.x2, y1: Math.min(one.y1, two.y1), y2: Math.max(one.y1, two.y1), },
      { x1: one.x1, x2: one.x2, y1: Math.min(one.y2, two.y2), y2: Math.max(one.y2, two.y2), },
    ].filter(l => !isDegenerateLine(l));
  } else /* if (orientedByY) */ {
    return [
      { y1: one.y1, y2: one.y2, x1: Math.min(one.x1, two.x1), x2: Math.max(one.x1, two.x1), },
      { y1: one.y1, y2: one.y2, x1: Math.min(one.x2, two.x2), x2: Math.max(one.x2, two.x2), },
    ].filter(l => !isDegenerateLine(l));
  }
}

// consider overlapping edges as intersection, but not overlapping corners.
function doRectsIntersect(r1: Rect, r2: Rect, props: { edgesOnlyIsAnIntersection: boolean }): boolean {
  const intersection = getIntersection(r1, r2, true);

  if (props.edgesOnlyIsAnIntersection) {
    return !!intersection && (
            intersection.w > 0 ||
            intersection.h > 0 );
  } else {
    return !!intersection && (intersection.w * intersection.h > 0);
  }
}

function completelyContains(larger: Rect, smaller: Rect): boolean {
  return larger.x            <= smaller.x             &&
         larger.x + larger.w >= smaller.x + smaller.w &&
         larger.y            <= smaller.y             &&
         larger.y + larger.h >= smaller.y + smaller.h ;
}

function getIntersection(r1: Rect, r2: Rect, edgesOnlyIsAnIntersection = false): Rect | undefined {
  const xmin = Math.max(r1.x, r2.x);
  const xmax1 = r1.x + r1.w;
  const xmax2 = r2.x + r2.w;
  const xmax = Math.min(xmax1, xmax2);

  if (xmax > xmin || (edgesOnlyIsAnIntersection && xmax >= xmin)) {
    const ymin = Math.max(r1.y, r2.y);
    const ymax1 = r1.y + r1.h;
    const ymax2 = r2.y + r2.h;
    const ymax = Math.min(ymax1, ymax2);

    if (ymax >= ymin || (edgesOnlyIsAnIntersection && ymax >= ymin)) {
      return {
        x: xmin,
        y: ymin,
        w: xmax - xmin,
        h: ymax - ymin,
      };
    }
  }

  return undefined;
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 12)];
  }

  return color;
}

class ArbitrarySelection {
  cover: Rect[] = [];

  constructor() {

  }

  addRect(rectToAdd: Rect): void {
    const intersectingRects = this.cover.filter(r => doRectsIntersect(r, rectToAdd, { edgesOnlyIsAnIntersection: false }));

    for (const rect of intersectingRects) {
      this.subtractRect(getIntersection(rect, rectToAdd)!);
    }

    this.cover.push(rectToAdd);
  }

  subtractRect(subtractedRect: Rect): void {
    const intersectingRects = this.cover.filter(r => doRectsIntersect(r, subtractedRect, { edgesOnlyIsAnIntersection: false }));

    console.log("count of intersections:", intersectingRects.length);

    for (const rect of intersectingRects) {
      this.cover.splice(this.cover.indexOf(rect), 1);

      // subtractedRect completely contains rect

      if (completelyContains(subtractedRect, rect)) {
        continue;
      }

      // subtractedRect partially contains rect

      subtractedRect = getIntersection(subtractedRect, rect)!;

      // rect completely contains subtractedRect

      // -------------------------
      // |          A            |
      // |                       |
      // |-----------------------|
      // |  B  |   hole    |  C  |
      // |-----------------------|
      // |                       |
      // |          D            |
      // -------------------------

      const newRects = [
        { x: rect.x                             , y: rect.y                             , w: rect.w                                                 , h: subtractedRect.y - rect.y }, // A
        { x: rect.x                             , y: subtractedRect.y                   , w: subtractedRect.x - rect.x                              , h: subtractedRect.h }, // B
        { x: subtractedRect.x + subtractedRect.w, y: subtractedRect.y                   , w: rect.x + rect.w - (subtractedRect.w + subtractedRect.x), h: subtractedRect.h }, // C
        { x: rect.x                             , y: subtractedRect.y + subtractedRect.h, w: rect.w                                                 , h: rect.y + rect.h - (subtractedRect.y + subtractedRect.h) }, // D
      ].filter(r => r.w > 0 && r.h > 0);

      this.cover = this.cover.concat(newRects);
    }
  }

  // O(n^2) scc algorithm until someone convinces me I need a faster one
  getConnectedComponents(): Rect[][] {
    const components: Rect[][] = [];
    const seenRects: { [key: string]: boolean } = {}

    for (const rect of this.cover) {
      if (seenRects[serializeRect(rect)]) { continue; }

      const component = this.getConnectedComponentFrom(rect);

      components.push(component);

      for (const seen of component) {
        seenRects[serializeRect(seen)] = true;
      }
    }

    return components;
  }

  private getConnectedComponentFrom(start: Rect): Rect[] {
    const component: { [key: string]: boolean } = { };
    let edge = [start];

    while (edge.length > 0) {
      let newEdge: Rect[] = [];

      for (const rect of edge) {
        if (component[serializeRect(rect)]) { continue; }

        const intersectingRects = this.cover.filter(r => doRectsIntersect(r, rect, { edgesOnlyIsAnIntersection: true }));

        component[serializeRect(rect)] = true;
        newEdge = newEdge.concat(intersectingRects);
      }

      edge = newEdge;
    }

    return Object.keys(component).map(r => deserializeRect(r));
  }

  drawLine(l: Line): void {
    context.beginPath();
    context.moveTo(l.x1, l.y1);
    context.lineTo(l.x2, l.y2);
    context.stroke();
  }

  getOutlines(): Line[][] {
    const components = this.getConnectedComponents();

    context.clearRect(0, 0, 800, 800);

    for (const c of components) {
      const outline = this.getOutlineFor(c);

      for (const l of outline) {
        this.drawLine(l);
      }
    }

    return [];
  }

  private getOutlineFor(comp: Rect[]): Line[] {
    let allLines: (Line | undefined)[] = [];
    let linesOnOutline: Line[] = [];

    for (const rect of comp) {
      allLines = allLines.concat(getLinesFromRect(rect));
    }

    context.strokeStyle = "#000";

    // Alternate solution if this proves too hard:
    // Subdivide all lines on intersection points, then remove all
    // duplicates.

    // Actually that might even be better heh

    // The strategy here is to basically remove all overlapping segments. it's
    // hard because a single line could be overlapping with multiple other
    // lines.

    for (let i = 0; i < allLines.length; i++) {
      const line1 = allLines[i];
      if (!line1) { continue; }

      for (let j = 0; j < allLines.length; j++) {
        const line2 = allLines[j];
        if (!line2) { continue; }
        if (line1 === line2) { continue; }

        const intersection = getLineOverlap(line1, line2);

        if (intersection) {
          allLines[i] = undefined;
          allLines[j] = undefined;

          const newLines = getNonOverlap(line1, line2)!;

          allLines = allLines.concat(newLines);

          break;
        }
      }
    }

    return allLines.filter(l => l !== undefined) as Line[];
  }

  render(): void {
    context.clearRect(0, 0, 800, 800);

    for (const rect of this.cover) {
      context.strokeStyle = getRandomColor();

      context.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  }
}

/**
 * Usage example
 *
 * Click+Drag to add rectangle
 * Shift+Click+Drag to remove rectangle
 */

const sel = new ArbitrarySelection();

let start: { x: number, y: number } | undefined = undefined;

function getMousedRect(e: MouseEvent): Rect | undefined {
  if (!start) { return undefined; }

  return {
    x: Math.min(start.x, e.clientX),
    y: Math.min(start.y, e.clientY),
    w: Math.abs(e.clientX - start.x),
    h: Math.abs(e.clientY - start.y),
  };
}

canvas.addEventListener("mousedown", e => {
  start = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mousemove", e => {
  const r = getMousedRect(e);

  if (!r) { return; }

  sel.render();

  context.strokeRect(
    r.x,
    r.y,
    r.w,
    r.h
  );
});

canvas.addEventListener("mouseup", e => {
  const r = getMousedRect(e);

  if (!r) { return; }

  if (e.shiftKey) {
    sel.subtractRect(r);
  } else {
    sel.addRect(r);
  }

  sel.render();
  // sel.getOutlines();

  start = undefined;
});