// TODO - isolate each path separately and put them in order.
var canvas = document.getElementsByTagName("canvas").item(0);
var context = canvas.getContext("2d");
context.translate(0.5, 0.5);
var Line = (function () {
    function Line(props) {
        this._x1 = Math.min(props.x1, props.x2);
        this._x2 = Math.max(props.x1, props.x2);
        this._y1 = Math.min(props.y1, props.y2);
        this._y2 = Math.max(props.y1, props.y2);
    }
    Object.defineProperty(Line.prototype, "x1", {
        get: function () { return this._x1; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "x2", {
        get: function () { return this._x2; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "y1", {
        get: function () { return this._y1; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "y2", {
        get: function () { return this._y2; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "length", {
        get: function () {
            return Math.sqrt((this.x2 - this.x1) * (this.x2 - this.x1) +
                (this.y2 - this.y1) * (this.y2 - this.y1));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "isDegenerate", {
        get: function () {
            return this.length === 0;
        },
        enumerable: true,
        configurable: true
    });
    Line.prototype.sharesAVertexWith = function (other) {
        return ((this.x1 === other.x1 && this.y1 === other.y1) ||
            (this.x1 === other.x2 && this.y1 === other.y2) ||
            (this.x2 === other.x1 && this.y2 === other.y1) ||
            (this.x2 === other.x2 && this.y2 === other.y2));
    };
    Line.prototype.serialize = function () {
        return this.x1 + "|" + this.x2 + "|" + this.y1 + "|" + this.y2;
    };
    Line.prototype.deserializeLine = function (s) {
        var _a = s.split("|").map(function (x) { return Number(x); }), x1 = _a[0], x2 = _a[1], y1 = _a[2], y2 = _a[3];
        return new Line({ x1: x1, x2: x2, y1: y1, y2: y2 });
    };
    return Line;
}());
var Rect = (function () {
    function Rect(props) {
        this._x = props.x;
        this._y = props.y;
        this._w = props.w;
        this._h = props.h;
    }
    Object.defineProperty(Rect.prototype, "x", {
        get: function () { return this._x; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "y", {
        get: function () { return this._y; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "w", {
        get: function () { return this._w; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "h", {
        get: function () { return this._h; },
        enumerable: true,
        configurable: true
    });
    Rect.prototype.getLinesFromRect = function () {
        return [
            new Line({ x1: this.x, y1: this.y, x2: this.x + this.w, y2: this.y }),
            new Line({ x1: this.x, y1: this.y, x2: this.x, y2: this.y + this.h }),
            new Line({ x1: this.x + this.w, y1: this.y + this.h, x2: this.x + this.w, y2: this.y }),
            new Line({ x1: this.x + this.w, y1: this.y + this.h, x2: this.x, y2: this.y + this.h }),
        ];
    };
    Rect.prototype.serialize = function () {
        return this.x + "|" + this.y + "|" + this.w + "|" + this.h;
    };
    Rect.DeserializeRect = function (s) {
        var _a = s.split("|").map(function (x) { return Number(x); }), x = _a[0], y = _a[1], w = _a[2], h = _a[3];
        return new Rect({ x: x, y: y, w: w, h: h });
    };
    return Rect;
}());
function within(val, start, end) {
    var low = Math.min(start, end);
    var high = Math.max(start, end);
    return val >= low && val <= high;
}
// Must be horizontally/vertically oriented lines
// Does not consider intersection, only overlap
function getLineOverlap(one, two) {
    var orientedByX = (one.x1 === one.x2 &&
        one.x1 === two.x1 &&
        one.x1 === two.x2);
    var orientedByY = (one.y1 === one.y2 &&
        one.y1 === two.y1 &&
        one.y1 === two.y2);
    if (!orientedByX && !orientedByY) {
        return undefined;
    }
    var summedLength = one.length + two.length;
    var overallLength = new Line({
        x1: Math.min(one.x1, two.x1),
        y1: Math.min(one.y1, two.y1),
        x2: Math.max(one.x2, two.x2),
        y2: Math.max(one.y2, two.y2),
    }).length;
    if (overallLength >= summedLength) {
        // These lines do not overlap.
        return undefined;
    }
    if (orientedByX) {
        return new Line({
            x1: one.x1,
            x2: one.x2,
            y1: Math.max(one.y1, two.y1),
            y2: Math.min(one.y2, two.y2),
        });
    }
    else {
        return new Line({
            y1: one.y1,
            y2: one.y2,
            x1: Math.max(one.x1, two.x1),
            x2: Math.min(one.x2, two.x2),
        });
    }
}
// A----B----C----D
// AD - BC returns AB and CD.
function getNonOverlap(one, two) {
    var orientedByX = (one.x1 === one.x2 &&
        one.x1 === two.x1 &&
        one.x1 === two.x2);
    var orientedByY = (one.y1 === one.y2 &&
        one.y1 === two.y1 &&
        one.y1 === two.y2);
    if (!orientedByX && !orientedByY) {
        return undefined;
    }
    var summedLength = new Line(one).length + new Line(two).length;
    var overallLength = new Line({
        x1: Math.min(one.x1, two.x1),
        y1: Math.min(one.y1, two.y1),
        x2: Math.max(one.x1, two.x1),
        y2: Math.max(one.y1, two.y1),
    }).length;
    if (overallLength >= summedLength) {
        // These lines do not overlap.
        return undefined;
    }
    if (orientedByX) {
        return [
            new Line({ x1: one.x1, x2: one.x2, y1: Math.min(one.y1, two.y1), y2: Math.max(one.y1, two.y1), }),
            new Line({ x1: one.x1, x2: one.x2, y1: Math.min(one.y2, two.y2), y2: Math.max(one.y2, two.y2), }),
        ].filter(function (l) { return !l.isDegenerate; });
    }
    else {
        return [
            new Line({ y1: one.y1, y2: one.y2, x1: Math.min(one.x1, two.x1), x2: Math.max(one.x1, two.x1), }),
            new Line({ y1: one.y1, y2: one.y2, x1: Math.min(one.x2, two.x2), x2: Math.max(one.x2, two.x2), }),
        ].filter(function (l) { return !l.isDegenerate; });
    }
}
// consider overlapping edges as intersection, but not overlapping corners.
function doRectsIntersect(r1, r2, props) {
    var intersection = getIntersection(r1, r2, true);
    if (props.edgesOnlyIsAnIntersection) {
        return !!intersection && (intersection.w > 0 ||
            intersection.h > 0);
    }
    else {
        return !!intersection && (intersection.w * intersection.h > 0);
    }
}
function completelyContains(larger, smaller) {
    return larger.x <= smaller.x &&
        larger.x + larger.w >= smaller.x + smaller.w &&
        larger.y <= smaller.y &&
        larger.y + larger.h >= smaller.y + smaller.h;
}
function getIntersection(r1, r2, edgesOnlyIsAnIntersection) {
    if (edgesOnlyIsAnIntersection === void 0) { edgesOnlyIsAnIntersection = false; }
    var xmin = Math.max(r1.x, r2.x);
    var xmax1 = r1.x + r1.w;
    var xmax2 = r2.x + r2.w;
    var xmax = Math.min(xmax1, xmax2);
    if (xmax > xmin || (edgesOnlyIsAnIntersection && xmax >= xmin)) {
        var ymin = Math.max(r1.y, r2.y);
        var ymax1 = r1.y + r1.h;
        var ymax2 = r2.y + r2.h;
        var ymax = Math.min(ymax1, ymax2);
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
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 12)];
    }
    return color;
}
var ArbitrarySelection = (function () {
    function ArbitrarySelection() {
        this.cover = [];
    }
    ArbitrarySelection.prototype.addRect = function (rectToAdd) {
        var subsumingRects = this.cover.filter(function (r) { return completelyContains(r, rectToAdd); });
        var intersectingRects = this.cover.filter(function (r) { return doRectsIntersect(r, rectToAdd, { edgesOnlyIsAnIntersection: false }); });
        if (subsumingRects.length > 0) {
            return;
        }
        for (var _i = 0, intersectingRects_1 = intersectingRects; _i < intersectingRects_1.length; _i++) {
            var rect = intersectingRects_1[_i];
            this.subtractRect(getIntersection(rect, rectToAdd));
        }
        this.cover.push(rectToAdd);
    };
    ArbitrarySelection.prototype.subtractRect = function (subtractedRect) {
        var intersectingRects = this.cover.filter(function (r) { return doRectsIntersect(r, subtractedRect, { edgesOnlyIsAnIntersection: false }); });
        for (var _i = 0, intersectingRects_2 = intersectingRects; _i < intersectingRects_2.length; _i++) {
            var rect = intersectingRects_2[_i];
            // subtractedRect completely contains rect
            if (completelyContains(subtractedRect, rect)) {
                continue;
            }
            // subtractedRect partially contains rect
            var subrectToRemove = getIntersection(subtractedRect, rect);
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
            var newRects = [
                { x: rect.x, y: rect.y, w: rect.w, h: subrectToRemove.y - rect.y },
                { x: rect.x, y: subrectToRemove.y, w: subrectToRemove.x - rect.x, h: subrectToRemove.h },
                { x: subrectToRemove.x + subrectToRemove.w, y: subrectToRemove.y, w: rect.x + rect.w - (subrectToRemove.w + subrectToRemove.x), h: subrectToRemove.h },
                { x: rect.x, y: subrectToRemove.y + subrectToRemove.h, w: rect.w, h: rect.y + rect.h - (subrectToRemove.y + subrectToRemove.h) },
            ].filter(function (r) { return r.w > 0 && r.h > 0; })
                .map(function (r) { return new Rect(r); });
            this.cover = this.cover.concat(newRects);
        }
        for (var _a = 0, intersectingRects_3 = intersectingRects; _a < intersectingRects_3.length; _a++) {
            var rect = intersectingRects_3[_a];
            this.cover.splice(this.cover.indexOf(rect), 1);
        }
    };
    // O(n^2) scc algorithm until someone convinces me I need a faster one
    ArbitrarySelection.prototype.getConnectedComponents = function () {
        var components = [];
        var seenRects = {};
        for (var _i = 0, _a = this.cover; _i < _a.length; _i++) {
            var rect = _a[_i];
            if (seenRects[rect.serialize()]) {
                continue;
            }
            var component = this.getConnectedComponentFrom(rect);
            components.push(component);
            for (var _b = 0, component_1 = component; _b < component_1.length; _b++) {
                var seen = component_1[_b];
                seenRects[seen.serialize()] = true;
            }
        }
        return components;
    };
    ArbitrarySelection.prototype.getConnectedComponentFrom = function (start) {
        var component = {};
        var edge = [start];
        while (edge.length > 0) {
            var newEdge = [];
            var _loop_1 = function (rect) {
                if (component[rect.serialize()]) {
                    return "continue";
                }
                var intersectingRects = this_1.cover.filter(function (r) { return doRectsIntersect(r, rect, { edgesOnlyIsAnIntersection: true }); });
                component[rect.serialize()] = true;
                newEdge = newEdge.concat(intersectingRects);
            };
            var this_1 = this;
            for (var _i = 0, edge_1 = edge; _i < edge_1.length; _i++) {
                var rect = edge_1[_i];
                _loop_1(rect);
            }
            edge = newEdge;
        }
        return Object.keys(component).map(function (r) { return Rect.DeserializeRect(r); });
    };
    ArbitrarySelection.prototype.drawLine = function (l) {
        context.beginPath();
        context.moveTo(l.x1, l.y1);
        context.lineTo(l.x2, l.y2);
        context.stroke();
    };
    ArbitrarySelection.prototype.getOutlines = function () {
        var components = this.getConnectedComponents();
        context.clearRect(0, 0, 800, 800);
        for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
            var c = components_1[_i];
            var outline = this.getOutlineFor(c);
            var components_2 = this.getComponentsOfOutline(outline);
            for (var _a = 0, components_3 = components_2; _a < components_3.length; _a++) {
                var cc = components_3[_a];
                context.strokeStyle = getRandomColor();
                for (var _b = 0, cc_1 = cc; _b < cc_1.length; _b++) {
                    var l = cc_1[_b];
                    this.drawLine(l);
                }
            }
        }
        return [];
    };
    ArbitrarySelection.prototype.getOutlineFor = function (comp) {
        var allLines = [];
        var linesOnOutline = [];
        for (var _i = 0, comp_1 = comp; _i < comp_1.length; _i++) {
            var rect = comp_1[_i];
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
        for (var i = 0; i < allLines.length; i++) {
            var line1 = allLines[i];
            if (!line1) {
                continue;
            }
            for (var j = 0; j < allLines.length; j++) {
                var line2 = allLines[j];
                if (!line2) {
                    continue;
                }
                if (line1 === line2) {
                    continue;
                }
                var intersection = getLineOverlap(line1, line2);
                if (intersection) {
                    allLines[i] = undefined;
                    allLines[j] = undefined;
                    var newLines = getNonOverlap(line1, line2);
                    allLines = allLines.concat(newLines);
                    break;
                }
            }
        }
        return allLines.filter(function (l) { return l !== undefined; });
    };
    ArbitrarySelection.prototype.getComponentsOfOutline = function (outline) {
        var result = [];
        var visited = {};
        for (var _i = 0, outline_1 = outline; _i < outline_1.length; _i++) {
            var line = outline_1[_i];
            if (visited[line.serialize()]) {
                continue;
            }
            visited[line.serialize()] = true;
            var sequence = [line];
            var _loop_2 = function () {
                var current = sequence[sequence.length - 1];
                var next = outline.filter(function (l) { return l !== current && !visited[l.serialize()] && l.sharesAVertexWith(current); })[0];
                if (!next) {
                    return "break";
                }
                visited[next.serialize()] = true;
                sequence.push(next);
            };
            while (true) {
                var state_1 = _loop_2();
                if (state_1 === "break")
                    break;
            }
            result.push(sequence);
        }
        return result;
    };
    ArbitrarySelection.prototype.render = function () {
        context.clearRect(0, 0, 800, 800);
        for (var _i = 0, _a = this.cover; _i < _a.length; _i++) {
            var rect = _a[_i];
            context.strokeStyle = getRandomColor();
            context.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
    };
    return ArbitrarySelection;
}());
/**
 * Usage example
 *
 * Click+Drag to add rectangle
 * Shift+Click+Drag to remove rectangle
 */
var sel = new ArbitrarySelection();
var start = undefined;
function getMousedRect(e) {
    if (!start) {
        return undefined;
    }
    return new Rect({
        x: Math.min(start.x, e.clientX),
        y: Math.min(start.y, e.clientY),
        w: Math.abs(e.clientX - start.x),
        h: Math.abs(e.clientY - start.y),
    });
}
canvas.addEventListener("mousedown", function (e) {
    start = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("mousemove", function (e) {
    var r = getMousedRect(e);
    if (!r) {
        return;
    }
    sel.render();
    context.strokeRect(r.x, r.y, r.w, r.h);
});
canvas.addEventListener("mouseup", function (e) {
    var r = getMousedRect(e);
    if (!r) {
        return;
    }
    if (e.shiftKey) {
        sel.subtractRect(r);
    }
    else {
        sel.addRect(r);
    }
    // sel.render();
    sel.getOutlines();
    start = undefined;
});
