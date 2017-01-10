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
                var newRects = [
                    { x: rect.x, y: rect.y, w: rect.w, h: subtractedRect.y - rect.y },
                    { x: rect.x, y: subtractedRect.y + subtractedRect.h, w: rect.w, h: rect.y + rect.h - (subtractedRect.y + subtractedRect.h) },
                ];
                this.cover = this.cover.concat(newRects);
            }
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
var sel = new ArbitrarySelection();
sel.addRect({ x: 0, y: 0, w: 200, h: 200 });
sel.subtractRect({ x: 50, y: 50, w: 100, h: 100 });
sel.render();
