// TODO - isolate each path separately and put them in order.

const canvas = document.getElementsByTagName("canvas").item(0);
const context = canvas.getContext("2d")!;

context.translate(0.5, 0.5);

class Line {
  private _x1: number;
  private _x2: number;
  private _y1: number;
  private _y2: number;

  public get x1(): number { return this._x1; }
  public get x2(): number { return this._x2; }
  public get y1(): number { return this._y1; }
  public get y2(): number { return this._y2; }

  constructor(props: { x1: number, x2: number, y1: number, y2: number }) {
    this._x1 = Math.min(props.x1, props.x2);
    this._x2 = Math.max(props.x1, props.x2);
    this._y1 = Math.min(props.y1, props.y2);
    this._y2 = Math.max(props.y1, props.y2);
  }

  public get length(): number {
    return Math.sqrt(
      (this.x2 - this.x1) * (this.x2 - this.x1) +
      (this.y2 - this.y1) * (this.y2 - this.y1)
    );
  }

  public get isDegenerate(): boolean {
    return this.length === 0;
  }

  sharesAVertexWith(other: Line): boolean {
    return (
      (this.x1 === other.x1 && this.y1 === other.y1) ||
      (this.x1 === other.x2 && this.y1 === other.y2) ||
      (this.x2 === other.x1 && this.y2 === other.y1) ||
      (this.x2 === other.x2 && this.y2 === other.y2)
    );
  }

  serialize(): string {
    return `${ this.x1 }|${ this.x2 }|${ this.y1 }|${ this.y2 }`;
  }

  deserializeLine(s: string): Line {
    const [ x1, x2, y1, y2 ] = s.split("|").map(x => Number(x));

    return new Line({ x1, x2, y1, y2 });
  }

  // Must be horizontally/vertically oriented lines
  // Does not consider intersection, only overlap
  getOverlap(other: Line): Line | undefined {
    const orientedByX = (
      this.x1 === this.x2 &&
      this.x1 === other.x1 &&
      this.x1 === other.x2
    );

    const orientedByY = (
      this.y1 === this.y2 &&
      this.y1 === other.y1 &&
      this.y1 === other.y2
    );

    if (!orientedByX && !orientedByY) { return undefined; }

    const summedLength  = this.length + other.length;
    const overallLength = new Line({
      x1: Math.min(this.x1, other.x1),
      y1: Math.min(this.y1, other.y1),
      x2: Math.max(this.x2, other.x2),
      y2: Math.max(this.y2, other.y2),
    }).length;

    if (overallLength >= summedLength) {
      // These lines do not overlap.

      return undefined;
    }

    if (orientedByX) {
      return new Line({
        x1: this.x1,
        x2: this.x2,
        y1: Math.max(this.y1, other.y1),
        y2: Math.min(this.y2, other.y2),
      });
    } else /* if (orientedByY) */ {
      return new Line({
        y1: this.y1,
        y2: this.y2,
        x1: Math.max(this.x1, other.x1),
        x2: Math.min(this.x2, other.x2),
      });
    }
  }

  // A----B----C----D
  // AD - BC returns AB and CD.
  getNonOverlappingSections(other: Line): Line[] | undefined {
    const orientedByX = (
      this.x1 === this.x2 &&
      this.x1 === other.x1 &&
      this.x1 === other.x2
    );

    const orientedByY = (
      this.y1 === this.y2 &&
      this.y1 === other.y1 &&
      this.y1 === other.y2
    );

    if (!orientedByX && !orientedByY) { return undefined; }

    const summedLength  = new Line(this).length + new Line(other).length;
    const overallLength = new Line({
      x1: Math.min(this.x1, other.x1),
      y1: Math.min(this.y1, other.y1),
      x2: Math.max(this.x1, other.x1),
      y2: Math.max(this.y1, other.y1),
    }).length;

    if (overallLength >= summedLength) {
      // These lines do not overlap.

      return undefined;
    }

    if (orientedByX) {
      return [
        new Line({ x1: this.x1, x2: this.x2, y1: Math.min(this.y1, other.y1), y2: Math.max(this.y1, other.y1), }),
        new Line({ x1: this.x1, x2: this.x2, y1: Math.min(this.y2, other.y2), y2: Math.max(this.y2, other.y2), }),
      ].filter(l => !l.isDegenerate);
    } else /* if (orientedByY) */ {
      return [
        new Line({ y1: this.y1, y2: this.y2, x1: Math.min(this.x1, other.x1), x2: Math.max(this.x1, other.x1), }),
        new Line({ y1: this.y1, y2: this.y2, x1: Math.min(this.x2, other.x2), x2: Math.max(this.x2, other.x2), }),
      ].filter(l => !l.isDegenerate);
    }
  }
}

class Rect {
  private _x: number;
  private _y: number;
  private _w: number;
  private _h: number;

  public get x(): number { return this._x; }
  public get y(): number { return this._y; }
  public get w(): number { return this._w; }
  public get h(): number { return this._h; }

  constructor(props: { x: number, y: number, w: number, h: number }) {
    this._x = props.x;
    this._y = props.y;
    this._w = props.w;
    this._h = props.h;
  }

  static DeserializeRect(s: string): Rect {
    const [ x, y, w, h ] = s.split("|").map(x => Number(x));

    return new Rect({ x, y, w, h });
  }

  getLinesFromRect(): Line[] {
    return [
      new Line({ x1: this.x         , y1: this.y         , x2: this.x + this.w, y2: this.y          }),
      new Line({ x1: this.x         , y1: this.y         , x2: this.x         , y2: this.y + this.h }),
      new Line({ x1: this.x + this.w, y1: this.y + this.h, x2: this.x + this.w, y2: this.y          }),
      new Line({ x1: this.x + this.w, y1: this.y + this.h, x2: this.x         , y2: this.y + this.h }),
    ];
  }

  serialize(): string {
    return `${ this.x }|${ this.y }|${ this.w }|${ this.h }`;
  }

  // consider overlapping edges as intersection, but not overlapping corners.
  intersects(other: Rect, props: { edgesOnlyIsAnIntersection: boolean }): boolean {
    const intersection = getIntersection(this, other, true);

    if (props.edgesOnlyIsAnIntersection) {
      return !!intersection && (
              intersection.w > 0 ||
              intersection.h > 0 );
    } else {
      return !!intersection && (intersection.w * intersection.h > 0);
    }
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
      return new Rect({
        x: xmin,
        y: ymin,
        w: xmax - xmin,
        h: ymax - ymin,
      });
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
    const subsumingRects = this.cover.filter(r => completelyContains(r, rectToAdd));
    const intersectingRects = this.cover.filter(r => r.intersects(rectToAdd, { edgesOnlyIsAnIntersection: false }));

    if (subsumingRects.length > 0) {
      return;
    }

    for (const rect of intersectingRects) {
      this.subtractRect(getIntersection(rect, rectToAdd)!);
    }

    this.cover.push(rectToAdd);
  }

  subtractRect(rectToSubtract: Rect): void {
    const intersectingRects = this.cover.filter(r => r.intersects(rectToSubtract, { edgesOnlyIsAnIntersection: false }));

    for (const rect of intersectingRects) {
      // rectToSubtract completely contains rect

      if (completelyContains(rectToSubtract, rect)) {
        continue;
      }

      // rectToSubtract partially contains rect

      const subrectToRemove = getIntersection(rectToSubtract, rect)!;

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
        { x: rect.x                               , y: rect.y                               , w: rect.w                                                   , h: subrectToRemove.y - rect.y }, // A
        { x: rect.x                               , y: subrectToRemove.y                    , w: subrectToRemove.x - rect.x                               , h: subrectToRemove.h }, // B
        { x: subrectToRemove.x + subrectToRemove.w, y: subrectToRemove.y                    , w: rect.x + rect.w - (subrectToRemove.w + subrectToRemove.x), h: subrectToRemove.h }, // C
        { x: rect.x                               , y: subrectToRemove.y + subrectToRemove.h, w: rect.w                                                   , h: rect.y + rect.h - (subrectToRemove.y + subrectToRemove.h) }, // D
      ].filter(r => r.w > 0 && r.h > 0)
       .map(r => new Rect(r));

      this.cover = this.cover.concat(newRects);
    }

    for (const rect of intersectingRects) {
      this.cover.splice(this.cover.indexOf(rect), 1);
    }
  }

  // O(n^2) scc algorithm until someone convinces me I need a faster one
  getConnectedComponents(): Rect[][] {
    const components: Rect[][] = [];
    const seenRects: { [key: string]: boolean } = {}

    for (const rect of this.cover) {
      if (seenRects[rect.serialize()]) { continue; }

      const component = this.getConnectedComponentFrom(rect);

      components.push(component);

      for (const seen of component) {
        seenRects[seen.serialize()] = true;
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
        if (component[rect.serialize()]) { continue; }

        const intersectingRects = this.cover.filter(r => r.intersects(rect, { edgesOnlyIsAnIntersection: true }));

        component[rect.serialize()] = true;
        newEdge = newEdge.concat(intersectingRects);
      }

      edge = newEdge;
    }

    return Object.keys(component).map(r => Rect.DeserializeRect(r));
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
      const components = this.getComponentsOfOutline(outline);

      for (const cc of components) {
        context.strokeStyle = getRandomColor();

        for (const l of cc) {
          this.drawLine(l);
        }
      }
    }

    return [];
  }

  private getOutlineFor(comp: Rect[]): Line[] {
    let allLines: (Line | undefined)[] = [];
    let linesOnOutline: Line[] = [];

    for (const rect of comp) {
      allLines = allLines.concat(rect.getLinesFromRect());
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

        const intersection = line1.getOverlap(line2);

        if (intersection) {
          allLines[i] = undefined;
          allLines[j] = undefined;

          const newLines = line1.getNonOverlappingSections(line2);

          allLines = allLines.concat(newLines);

          break;
        }
      }
    }

    return allLines.filter(l => l !== undefined) as Line[];
  }

  private getComponentsOfOutline(outline: Line[]): Line[][] {
    let result: Line[][] = [];
    let visited: { [key: string]: boolean } = {};

    for (const line of outline) {
      if (visited[line.serialize()]) { continue; }
      visited[line.serialize()] = true;

      const sequence = [line];

      while (true) {
        const current = sequence[sequence.length - 1];
        const next = outline.filter(l => l !== current && !visited[l.serialize()] && l.sharesAVertexWith(current))[0];

        if (!next) { break; }

        visited[next.serialize()] = true;
        sequence.push(next);
      }

      result.push(sequence);
    }

    return result;
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

  return new Rect({
    x: Math.min(start.x, e.clientX),
    y: Math.min(start.y, e.clientY),
    w: Math.abs(e.clientX - start.x),
    h: Math.abs(e.clientY - start.y),
  });
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

  // sel.render();
  sel.getOutlines();

  start = undefined;
});