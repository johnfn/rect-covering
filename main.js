var canvas = document.getElementsByTagName("canvas").item(0);
var context = canvas.getContext("2d");
context.translate(0.5, 0.5);
function sortPointsOnLine(l) {
    var x1 = l.x1, x2 = l.x2, y1 = l.y1, y2 = l.y2;
    return {
        x1: Math.min(x1, x2),
        x2: Math.max(x1, x2),
        y1: Math.min(y1, y2),
        y2: Math.max(y1, y2),
    };
}
function lineLength(l) {
    return Math.sqrt((l.x2 - l.x1) * (l.x2 - l.x1) +
        (l.y2 - l.y1) * (l.y2 - l.y1));
}
function getLinesFromRect(r) {
    return [
        { x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y },
        { x1: r.x, y1: r.y, x2: r.x, y2: r.y + r.h },
        { x1: r.x + r.w, y1: r.y + r.h, x2: r.x + r.w, y2: r.y },
        { x1: r.x + r.w, y1: r.y + r.h, x2: r.x, y2: r.y + r.h },
    ].map(function (l) { return sortPointsOnLine(l); });
}
function serializeRect(r) {
    return r.x + "|" + r.y + "|" + r.w + "|" + r.h;
}
function isDegenerateLine(l) {
    return lineLength(l) === 0;
}
function deserializeRect(s) {
    var _a = s.split("|").map(function (x) { return Number(x); }), x = _a[0], y = _a[1], w = _a[2], h = _a[3];
    return { x: x, y: y, w: w, h: h };
}
function within(val, start, end) {
    var low = Math.min(start, end);
    var high = Math.max(start, end);
    return val >= low && val <= high;
}
// Must be horizontally/vertically oriented lines
// Does not consider intersection, only overlap
function getLineOverlap(one, two) {
    one = sortPointsOnLine(one);
    two = sortPointsOnLine(two);
    var orientedByX = (one.x1 === one.x2 &&
        one.x1 === two.x1 &&
        one.x1 === two.x2);
    var orientedByY = (one.y1 === one.y2 &&
        one.y1 === two.y1 &&
        one.y1 === two.y2);
    if (!orientedByX && !orientedByY) {
        return undefined;
    }
    var summedLength = lineLength(one) + lineLength(two);
    var overallLength = lineLength({
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
    }
    else {
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
function getNonOverlap(one, two) {
    one = sortPointsOnLine(one);
    two = sortPointsOnLine(two);
    var orientedByX = (one.x1 === one.x2 &&
        one.x1 === two.x1 &&
        one.x1 === two.x2);
    var orientedByY = (one.y1 === one.y2 &&
        one.y1 === two.y1 &&
        one.y1 === two.y2);
    if (!orientedByX && !orientedByY) {
        return undefined;
    }
    var summedLength = lineLength(one) + lineLength(two);
    var overallLength = lineLength({
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
        ].filter(function (l) { return !isDegenerateLine(l); });
    }
    else {
        return [
            { y1: one.y1, y2: one.y2, x1: Math.min(one.x1, two.x1), x2: Math.max(one.x1, two.x1), },
            { y1: one.y1, y2: one.y2, x1: Math.min(one.x2, two.x2), x2: Math.max(one.x2, two.x2), },
        ].filter(function (l) { return !isDegenerateLine(l); });
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
        var intersectingRects = this.cover.filter(function (r) { return doRectsIntersect(r, rectToAdd, { edgesOnlyIsAnIntersection: false }); });
        for (var _i = 0, intersectingRects_1 = intersectingRects; _i < intersectingRects_1.length; _i++) {
            var rect = intersectingRects_1[_i];
            this.subtractRect(getIntersection(rect, rectToAdd));
        }
        this.cover.push(rectToAdd);
    };
    ArbitrarySelection.prototype.subtractRect = function (subtractedRect) {
        var intersectingRects = this.cover.filter(function (r) { return doRectsIntersect(r, subtractedRect, { edgesOnlyIsAnIntersection: false }); });
        console.log("count of intersections:", intersectingRects.length);
        for (var _i = 0, intersectingRects_2 = intersectingRects; _i < intersectingRects_2.length; _i++) {
            var rect = intersectingRects_2[_i];
            this.cover.splice(this.cover.indexOf(rect), 1);
            // subtractedRect completely contains rect
            if (completelyContains(subtractedRect, rect)) {
                continue;
            }
            // subtractedRect partially contains rect
            subtractedRect = getIntersection(subtractedRect, rect);
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
                { x: rect.x, y: rect.y, w: rect.w, h: subtractedRect.y - rect.y },
                { x: rect.x, y: subtractedRect.y, w: subtractedRect.x - rect.x, h: subtractedRect.h },
                { x: subtractedRect.x + subtractedRect.w, y: subtractedRect.y, w: rect.x + rect.w - (subtractedRect.w + subtractedRect.x), h: subtractedRect.h },
                { x: rect.x, y: subtractedRect.y + subtractedRect.h, w: rect.w, h: rect.y + rect.h - (subtractedRect.y + subtractedRect.h) },
            ].filter(function (r) { return r.w > 0 && r.h > 0; });
            this.cover = this.cover.concat(newRects);
        }
    };
    // O(n^2) scc algorithm until someone convinces me I need a faster one
    ArbitrarySelection.prototype.getConnectedComponents = function () {
        var components = [];
        var seenRects = {};
        for (var _i = 0, _a = this.cover; _i < _a.length; _i++) {
            var rect = _a[_i];
            if (seenRects[serializeRect(rect)]) {
                continue;
            }
            var component = this.getConnectedComponentFrom(rect);
            components.push(component);
            for (var _b = 0, component_1 = component; _b < component_1.length; _b++) {
                var seen = component_1[_b];
                seenRects[serializeRect(seen)] = true;
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
                if (component[serializeRect(rect)]) {
                    return "continue";
                }
                var intersectingRects = this_1.cover.filter(function (r) { return doRectsIntersect(r, rect, { edgesOnlyIsAnIntersection: true }); });
                component[serializeRect(rect)] = true;
                newEdge = newEdge.concat(intersectingRects);
            };
            var this_1 = this;
            for (var _i = 0, edge_1 = edge; _i < edge_1.length; _i++) {
                var rect = edge_1[_i];
                _loop_1(rect);
            }
            edge = newEdge;
        }
        return Object.keys(component).map(function (r) { return deserializeRect(r); });
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
            for (var _a = 0, outline_1 = outline; _a < outline_1.length; _a++) {
                var l = outline_1[_a];
                this.drawLine(l);
            }
        }
        return [];
    };
    ArbitrarySelection.prototype.getOutlineFor = function (comp) {
        var allLines = [];
        var linesOnOutline = [];
        for (var _i = 0, comp_1 = comp; _i < comp_1.length; _i++) {
            var rect = comp_1[_i];
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
canvas.addEventListener("mousedown", function (e) {
    start = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("mousemove", function (e) {
    if (!start) {
        return;
    }
    sel.render();
    context.strokeRect(start.x, start.y, e.clientX - start.x, e.clientY - start.y);
});
canvas.addEventListener("mouseup", function (e) {
    if (!start) {
        return;
    }
    if (e.shiftKey) {
        sel.subtractRect({
            x: start.x,
            y: start.y,
            w: e.clientX - start.x,
            h: e.clientY - start.y,
        });
    }
    else {
        sel.addRect({
            x: start.x,
            y: start.y,
            w: e.clientX - start.x,
            h: e.clientY - start.y,
        });
    }
    sel.render();
    // sel.getOutlines();
    start = undefined;
});
