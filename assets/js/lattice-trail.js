// Edges that form between lattice points as the mouse passes over them, then fade. They run along the basis vectors
// b1 and b2, so the trail draws the lattice's fundamental parallelograms. While no mouse is over the lattice (and on
// touch screens), a slow wandering path draws them instead. The lines are managed directly in the DOM, every frame.
//
// Each <g data-lattice-trail> is rendered by layouts/_partials/lattice.html with the lattice's parameters.

// A point is touched when the cursor comes within TOUCH·g of it. That is just over the lattice's covering radius
// (0.58·g), so wherever the cursor is, it touches at least one point.
const TOUCH = 0.6;
const GROW_MS = 400; // an edge grows from the touched point to its neighbour
const HOLD_MS = 800; // and stays this long after the last touch
const FADE_MS = 1200; // before fading out
const IDLE_MS = 2000; // the wandering path takes over this long after the mouse was last over the lattice
const WANDER_SPEED = 200; // px/s, roughly
const WANDER_REACH = 0.6; // share of the fade radius the path keeps to, where the lattice is clearly visible
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SVG_NS = "http://www.w3.org/2000/svg";

function trail(group) {
    // The outer <svg> spans the box; the lattice is drawn in a nested <svg> whose origin is the corner
    const box = group.ownerSVGElement?.ownerSVGElement;
    if (!box) return;

    const g = parseFloat(group.dataset.spacing);
    const right = group.dataset.right === "true";
    const bottom = group.dataset.bottom === "true";
    const clearTop = parseFloat(group.dataset.clearTop) || 0;
    const share = parseFloat(group.dataset.radius) / 100;

    const h = 0.86 * g;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const edges = new Map();
    // Each lattice wanders its own path, different on every visit
    const phases = Array.from({ length: 4 }, () => Math.random() * 2 * Math.PI);
    let reach = 0;
    let zone = null; // distances from the corner (along each side) the wandering path stays within
    let visible = false;
    let wander = 0;
    let mouseAt = performance.now(); // also holds the first wander back while the hero plays in
    let last = null;
    let frame = 0;
    let previous = 0;

    const at = (i, j) => ({ x: 0.69 * g + i * g + 0.38 * j * g, y: 0.43 * g + j * h });
    const wanders = () => visible && zone !== null && !reduceMotion.matches;

    function measure() {
        const { width, height } = box.getBoundingClientRect();
        reach = (share * Math.hypot(width, height)) / Math.SQRT2;
        const x = g / 2;
        const y = bottom ? g / 2 : Math.max(g / 2, clearTop);
        const farX = Math.min(WANDER_REACH * reach, width - g / 2);
        const farY = Math.min(WANDER_REACH * reach, height - (bottom ? Math.max(g / 2, clearTop) : g / 2));
        zone = farX - x > g && farY - y > g ? { x, y, width: farX - x, height: farY - y } : null;
    }

    // A Lissajous-like curve: smooth, never quite repeating, and it can't leave the zone
    function wanderAt(s, { x, y, width, height }) {
        const u = 0.6 * Math.sin(s + phases[0]) + 0.4 * Math.sin(1.618 * s + phases[1]);
        const v = 0.6 * Math.sin(1.303 * s + phases[2]) + 0.4 * Math.sin(0.707 * s + phases[3]);
        const dx = x + ((u + 1) / 2) * width;
        const dy = y + ((v + 1) / 2) * height;
        return { x: right ? -dx : dx, y: bottom ? -dy : dy };
    }

    function connect(i, j, di, dj, now) {
        // One key per edge, whichever end touched it first
        const key = di + dj < 0 ? `${i + di},${j + dj},${di ? 1 : 2}` : `${i},${j},${di ? 1 : 2}`;
        const edge = edges.get(key);
        if (edge) {
            edge.touched = now;
            return;
        }

        const { x, y } = at(i, j);
        const line = document.createElementNS(SVG_NS, "line");
        for (const [name, value] of [["x1", x], ["y1", y], ["x2", x], ["y2", y]]) {
            line.setAttribute(name, String(value));
        }
        group.append(line);
        edges.set(key, {
            line,
            x,
            y,
            dx: di * g + dj * 0.38 * g,
            dy: dj * h,
            grow: 0,
            opacity: reduceMotion.matches ? 0 : 1,
            touched: now,
            // Last values written to the DOM, so settled edges cost nothing
            length: 0,
            shown: ""
        });
    }

    function touch(x, y, now) {
        const fj = (y - 0.43 * g) / h;
        const fi = (x - 0.69 * g - 0.38 * fj * g) / g;
        for (let j = Math.floor(fj) - 1; j <= Math.ceil(fj) + 1; j++) {
            for (let i = Math.floor(fi) - 1; i <= Math.ceil(fi) + 1; i++) {
                const p = at(i, j);
                if (Math.hypot(p.x - x, p.y - y) > TOUCH * g || Math.hypot(p.x, p.y) >= reach) continue;
                for (const [di, dj] of NEIGHBOURS) connect(i, j, di, dj, now);
            }
        }
    }

    function draw(now) {
        const dt = previous ? Math.min(now - previous, 50) : 0;
        previous = now;

        if (wanders() && now - mouseAt > IDLE_MS) {
            // Advance along the curve at about WANDER_SPEED, whatever the zone's size
            wander += ((dt / 1000) * WANDER_SPEED * 4) / (zone.width + zone.height);
            const { x, y } = wanderAt(wander, zone);
            touch(x, y, now);
        }

        for (const [key, edge] of edges) {
            edge.grow = Math.min(1, edge.grow + dt / GROW_MS);
            if (now - edge.touched < HOLD_MS) {
                edge.opacity = Math.min(1, edge.opacity + dt / GROW_MS);
            } else if ((edge.opacity -= dt / FADE_MS) <= 0) {
                edge.line.remove();
                edges.delete(key);
                continue;
            }

            // With reduced motion the edge appears whole and only its opacity changes
            const length = reduceMotion.matches ? 1 : 1 - (1 - edge.grow) ** 3;
            if (length !== edge.length) {
                edge.length = length;
                edge.line.setAttribute("x2", String(edge.x + length * edge.dx));
                edge.line.setAttribute("y2", String(edge.y + length * edge.dy));
            }
            const shown = edge.opacity.toFixed(3);
            if (shown !== edge.shown) {
                edge.shown = shown;
                edge.line.setAttribute("opacity", shown);
            }
        }

        frame = edges.size || wanders() ? requestAnimationFrame(draw) : 0;
        if (!frame) previous = 0;
    }

    function start() {
        if (!frame) frame = requestAnimationFrame(draw);
    }

    function onPointerMove(event) {
        // Hover only: touch and pen drags scroll the page
        if (event.pointerType !== "mouse") return;

        const rect = box.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
            last = null;
            return;
        }

        const x = event.clientX - rect.left - (right ? rect.width : 0);
        const y = event.clientY - rect.top - (bottom ? rect.height : 0);
        const now = performance.now();
        if (Math.hypot(x, y) < reach) mouseAt = now;

        // Fill in between coalesced events, so a fast stroke leaves no gaps
        const from = last && Math.hypot(x - last.x, y - last.y) < 8 * g ? last : { x, y };
        const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (0.3 * g)));
        for (let s = 1; s <= steps; s++) {
            touch(from.x + ((x - from.x) * s) / steps, from.y + ((y - from.y) * s) / steps, now);
        }
        last = { x, y };

        if (edges.size) start();
    }

    // The box is absolutely positioned in its parent, so it resizes with it
    new ResizeObserver(measure).observe(box.parentElement ?? box);
    // Off screen, or hidden at this screen size (the hero has a lattice per layout): nothing wanders
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        measure();
        if (visible) start();
    }).observe(box);
    reduceMotion.addEventListener("change", start);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
}

export function initLatticeTrails() {
    document.querySelectorAll("[data-lattice-trail]").forEach(trail);
}
