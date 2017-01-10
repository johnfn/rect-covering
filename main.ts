const canvas = document.getElementsByTagName("canvas").item(0);
const context = canvas.getContext("2d");

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function intersectRect(r1: Rect, r2: Rect): boolean {
  return !(r2.x         > (r1.x + r1.w) ||
          (r2.x + r2.w) < r1.x          ||
           r2.y         > (r1.y + r1.h) ||
          (r2.y + r2.h) < r1.y);
}

function completelyContains(larger: Rect, smaller: Rect): boolean {
  return larger.x            <= smaller.x             &&
         larger.x + larger.w >= smaller.x + smaller.w &&
         larger.y            <= smaller.y             &&
         larger.y + larger.h >= smaller.y + smaller.h ;
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

  addRect(rect: Rect): void {
    this.cover.push(rect);
  }

  subtractRect(subtractedRect: Rect): void {
    const intersectingRects = this.cover.filter(r => intersectRect(r, subtractedRect));

    for (const rect of intersectingRects) {
      this.cover.splice(this.cover.indexOf(rect), 1);

      // subtractedRect completely contains rect

      if (completelyContains(subtractedRect, rect)) {
        continue;
      }

      // rect completely contains subtractedRect

      if (completelyContains(rect, subtractedRect)) {
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
          { x: rect.x, y: rect.y, w: rect.w, h: subtractedRect.y - rect.y }, // A
          { x: rect.x, y: subtractedRect.y, w: subtractedRect.x - rect.x, h: subtractedRect.h }, // B
          { x: subtractedRect.x + subtractedRect.w, y: subtractedRect.y, w: rect.w - (subtractedRect.w + subtractedRect.x), h: subtractedRect.h }, // C
          { x: rect.x, y: subtractedRect.y + subtractedRect.h, w: rect.w, h: rect.y + rect.h - (subtractedRect.y + subtractedRect.h) }, // D
        ];

        this.cover = this.cover.concat(newRects);
      }

      // subtractedRect partially contains rect
    }
  }

  render(): void {
    context.clearRect(0, 0, 800, 800);

    for (const rect of this.cover) {
      context.strokeStyle = getRandomColor();

      context.strokeRect(rect.x, rect.y, rect.w, rect.h)
    }
  }
}

/**
 * Usage example
 */

const sel = new ArbitrarySelection();

sel.addRect({ x: 0, y: 0, w: 200, h: 200 })
sel.subtractRect({ x: 50, y: 50, w: 100, h: 100 })

sel.render();