var canvas = document.getElementsByTagName("canvas").item(0);
var context = canvas.getContext("2d");
function intersectRect(r1, r2) {
    return !(r2.x > (r1.x + r1.w) ||
        (r2.x + r2.w) < r1.x ||
        r2.y > (r1.y + r1.h) ||
        (r2.y + r2.h) < r1.y);
}
function completelyContains(larger, smaller) {
    return larger.x <= smaller.x &&
        larger.x + larger.w >= smaller.x + smaller.w &&
        larger.y <= smaller.y &&
        larger.y + larger.h >= smaller.y + smaller.h;
}
function getIntersection(r1, r2) {
    var xmin = Math.max(r1.x, r2.x);
    var xmax1 = r1.x + r1.w;
    var xmax2 = r2.x + r2.w;
    var xmax = Math.min(xmax1, xmax2);
    if (xmax > xmin) {
        var ymin = Math.max(r1.y, r2.y);
        var ymax1 = r1.y + r1.h;
        var ymax2 = r2.y + r2.h;
        var ymax = Math.min(ymax1, ymax2);
        if (ymax > ymin) {
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
        var intersectingRects = this.cover.filter(function (r) { return intersectRect(r, subtractedRect); });
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
