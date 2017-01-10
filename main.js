var canvas = document.getElementsByTagName("canvas").item(0);
var context = canvas.getContext("2d");
function serializeRect(r) {
    return r.x + "|" + r.y + "|" + r.w + "|" + r.h;
}
function deserializeRect(s) {
    var _a = s.split("|").map(function (x) { return Number(x); }), x = _a[0], y = _a[1], w = _a[2], h = _a[3];
    return { x: x, y: y, w: w, h: h };
}
// consider overlapping edges as intersection, but not overlapping corners.
function doRectsIntersect(r1, r2) {
    var intersection = getIntersection(r1, r2, true);
    return intersection && (intersection.w > 0 ||
        intersection.h > 0);
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
    ArbitrarySelection.prototype.addRect = function (rect) {
        this.cover.push(rect);
    };
    ArbitrarySelection.prototype.subtractRect = function (subtractedRect) {
        var intersectingRects = this.cover.filter(function (r) { return doRectsIntersect(r, subtractedRect); });
        for (var _i = 0, intersectingRects_1 = intersectingRects; _i < intersectingRects_1.length; _i++) {
            var rect = intersectingRects_1[_i];
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
                var intersectingRects = this_1.cover.filter(function (r) { return doRectsIntersect(r, rect); });
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
    ArbitrarySelection.prototype.getOutlines = function () {
        return [];
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
 */
var sel = new ArbitrarySelection();
sel.addRect({ x: 0, y: 0, w: 200, h: 200 });
sel.subtractRect({ x: 50, y: 50, w: 100, h: 100 });
sel.addRect({ x: 200, y: 200, w: 200, h: 200 });
sel.subtractRect({ x: 250, y: 250, w: 100, h: 100 });
sel.render();
var comps = sel.getConnectedComponents();
for (var _i = 0, comps_1 = comps; _i < comps_1.length; _i++) {
    var comp = comps_1[_i];
    context.strokeStyle = getRandomColor();
    for (var _a = 0, comp_1 = comp; _a < comp_1.length; _a++) {
        var rr = comp_1[_a];
        context.strokeRect(rr.x, rr.y, rr.w, rr.h);
    }
}
