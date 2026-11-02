(() => {
  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/blobs.js
  var EASINGS = ["ease-in-out", "ease-in", "ease-out", "linear", "cubic-bezier(0.42, 0, 0.58, 1)", "cubic-bezier(0.4, 0, 0.2, 1)"];
  var random = (from, to) => from + Math.random() * (to - from);
  function initBlobs() {
    const container = document.querySelector("[data-blobs]");
    if (!container) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.querySelectorAll("[data-blob]").forEach((blob) => {
      const column = Number(blob.dataset.blobColumn);
      const columns = Number(blob.dataset.blobColumns);
      Object.assign(blob.style, {
        top: `${random(0, 100)}%`,
        left: `${(column + random(0, 0.7)) / columns * 100}%`,
        width: `${random(20, 60)}vh`,
        height: `${random(20, 60)}vh`,
        opacity: String(random(0.15, 0.35))
      });
      if (still) return;
      const step = () => `${random(-50, 50)}px ${random(-50, 50)}px`;
      blob.animate(
        [
          { translate: "0 0", scale: "1" },
          { translate: step(), scale: String(random(0.8, 1.2)) },
          { translate: step(), scale: String(random(0.8, 1.2)) },
          { translate: "0 0", scale: "1" }
        ],
        {
          duration: random(15, 30) * 1e3,
          iterations: Infinity,
          direction: "alternate",
          easing: EASINGS[Math.floor(Math.random() * EASINGS.length)]
        }
      );
    });
    container.hidden = false;
  }

  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/casino.js
  function initCasino() {
    document.querySelectorAll("[data-casino]").forEach((text) => {
      const delay = parseFloat(text.dataset.casino);
      const duration = parseFloat(text.dataset.casinoDuration);
      text.querySelectorAll(".casino-char").forEach((char, index) => {
        char.style.transitionDelay = `${index * delay}s`;
        if (duration) char.style.transitionDuration = `${duration}s`;
      });
    });
  }

  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/copy-email.js
  var CONFIRM_MS = 2e3;
  function initCopyEmail() {
    if (!navigator.clipboard) return;
    const status = document.querySelector("[data-copy-status]");
    document.querySelectorAll("[data-copy]").forEach((button) => {
      let timer = 0;
      button.hidden = false;
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
        } catch {
          return;
        }
        button.dataset.copied = "";
        if (status) status.textContent = "Email address copied";
        clearTimeout(timer);
        timer = setTimeout(() => {
          delete button.dataset.copied;
          if (status) status.textContent = "";
        }, CONFIRM_MS);
      });
    });
  }

  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/header.js
  var DESKTOP = "(min-width: 64rem)";
  function initHeader() {
    const header = document.getElementById("site-header");
    const button = document.getElementById("menu-button");
    const menu = document.getElementById("site-menu");
    if (!header || !button || !menu) return;
    let open = false;
    let previous = window.scrollY;
    function update() {
      const latest = window.scrollY;
      header.toggleAttribute("data-scrolled", latest > 24 && !open);
      header.toggleAttribute("data-hidden", latest > previous && latest > 150 && !open);
      previous = latest;
    }
    function setOpen(value) {
      open = value;
      button.setAttribute("aria-expanded", String(open));
      button.querySelector("[data-menu-label='closed']")?.setAttribute("aria-hidden", String(open));
      button.querySelector("[data-menu-label='open']")?.setAttribute("aria-hidden", String(!open));
      menu.toggleAttribute("data-open", open);
      menu.inert = !open;
      document.body.style.overflow = open ? "hidden" : "";
      update();
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    button.addEventListener("click", () => setOpen(!open));
    menu.querySelectorAll("[data-menu-link]").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    header.querySelector("a")?.addEventListener("click", () => setOpen(false));
    window.addEventListener("keydown", (event) => {
      if (open && event.key === "Escape") {
        setOpen(false);
        button.focus();
      }
    });
    window.matchMedia(DESKTOP).addEventListener("change", (event) => {
      if (event.matches && open) setOpen(false);
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && open) setOpen(false);
    });
  }

  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/lattice-trail.js
  var TOUCH = 0.6;
  var GROW_MS = 400;
  var HOLD_MS = 800;
  var FADE_MS = 1200;
  var IDLE_MS = 2e3;
  var WANDER_SPEED = 200;
  var WANDER_REACH = 0.6;
  var NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var SVG_NS = "http://www.w3.org/2000/svg";
  function trail(group) {
    const box = group.ownerSVGElement?.ownerSVGElement;
    if (!box) return;
    const g = parseFloat(group.dataset.spacing);
    const right = group.dataset.right === "true";
    const bottom = group.dataset.bottom === "true";
    const clearTop = parseFloat(group.dataset.clearTop) || 0;
    const share = parseFloat(group.dataset.radius) / 100;
    const h = 0.86 * g;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const edges = /* @__PURE__ */ new Map();
    const phases = Array.from({ length: 4 }, () => Math.random() * 2 * Math.PI);
    let reach = 0;
    let zone = null;
    let visible = false;
    let wander = 0;
    let mouseAt = performance.now();
    let last = null;
    let frame = 0;
    let previous = 0;
    const at = (i, j) => ({ x: 0.69 * g + i * g + 0.38 * j * g, y: 0.43 * g + j * h });
    const wanders = () => visible && zone !== null && !reduceMotion.matches;
    function measure() {
      const { width, height } = box.getBoundingClientRect();
      reach = share * Math.hypot(width, height) / Math.SQRT2;
      const x = g / 2;
      const y = bottom ? g / 2 : Math.max(g / 2, clearTop);
      const farX = Math.min(WANDER_REACH * reach, width - g / 2);
      const farY = Math.min(WANDER_REACH * reach, height - (bottom ? Math.max(g / 2, clearTop) : g / 2));
      zone = farX - x > g && farY - y > g ? { x, y, width: farX - x, height: farY - y } : null;
    }
    function wanderAt(s, { x, y, width, height }) {
      const u = 0.6 * Math.sin(s + phases[0]) + 0.4 * Math.sin(1.618 * s + phases[1]);
      const v = 0.6 * Math.sin(1.303 * s + phases[2]) + 0.4 * Math.sin(0.707 * s + phases[3]);
      const dx = x + (u + 1) / 2 * width;
      const dy = y + (v + 1) / 2 * height;
      return { x: right ? -dx : dx, y: bottom ? -dy : dy };
    }
    function connect(i, j, di, dj, now) {
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
        wander += dt / 1e3 * WANDER_SPEED * 4 / (zone.width + zone.height);
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
      const from = last && Math.hypot(x - last.x, y - last.y) < 8 * g ? last : { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (0.3 * g)));
      for (let s = 1; s <= steps; s++) {
        touch(from.x + (x - from.x) * s / steps, from.y + (y - from.y) * s / steps, now);
      }
      last = { x, y };
      if (edges.size) start();
    }
    new ResizeObserver(measure).observe(box.parentElement ?? box);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      measure();
      if (visible) start();
    }).observe(box);
    reduceMotion.addEventListener("change", start);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }
  function initLatticeTrails() {
    document.querySelectorAll("[data-lattice-trail]").forEach(trail);
  }

  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/reveal.js
  function observe(selector, rootMargin, onReveal) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        onReveal(entry.target);
        entry.target.dataset.revealed = "";
      }
    }, { rootMargin });
    elements.forEach((element) => observer.observe(element));
  }
  function initReveal() {
    observe("[data-reveal]", "0px 0px -10% 0px", (element) => {
      const delay = parseFloat(element.dataset.revealDelay);
      if (delay) element.style.transitionDelay = `${delay}s`;
    });
    observe("[data-words]", "0px 0px -15% 0px", (element) => {
      element.querySelectorAll("[data-word]").forEach((word, index) => {
        word.style.transitionDelay = `${index * 0.02}s`;
      });
    });
  }

  // ns-hugo-imp:/home/lucacampa/Mamoru Lab/website-code/converted-to-hugo/assets/js/services.js
  var EXPANDABLE = "(min-width: 64rem)";
  var DURATION = 700;
  var EASING = "cubic-bezier(0.19, 1, 0.22, 1)";
  function initServices() {
    const grid = document.querySelector("[data-services]");
    if (!grid) return;
    const cards = [...grid.querySelectorAll("[data-card]")];
    const expandable = window.matchMedia(EXPANDABLE);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let openCard = null;
    let placeholder = null;
    let animation = null;
    let pending = null;
    function box(element) {
      const outer = grid.getBoundingClientRect();
      const inner = element.getBoundingClientRect();
      return { top: inner.top - outer.top, left: inner.left - outer.left, width: inner.width, height: inner.height };
    }
    function settle() {
      animation?.cancel();
      animation = null;
      const done = pending;
      pending = null;
      done?.();
    }
    function move(card, from, to, done = null) {
      pending = done;
      if (reduceMotion.matches) return settle();
      const frame = ({ top, left, width, height }) => ({
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`
      });
      animation = card.animate([frame(from), frame(to)], { duration: DURATION, easing: EASING });
      animation.onfinish = settle;
    }
    function open(card) {
      const from = box(card);
      settle();
      placeholder = document.createElement("div");
      placeholder.className = `${card.dataset.span} invisible pointer-events-none`;
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.style.height = `${card.offsetHeight}px`;
      card.before(placeholder);
      cards.forEach((other) => {
        other.toggleAttribute("data-last", other === card);
        if (other === card) return;
        other.dataset.state = "hidden";
        other.inert = true;
      });
      card.dataset.state = "open";
      card.querySelector("[data-card-toggle]")?.setAttribute("aria-expanded", "true");
      openCard = card;
      move(card, from, box(card));
    }
    function close({ focus = false, instant = false } = {}) {
      const card = openCard;
      if (!card) return;
      const from = box(card);
      settle();
      openCard = null;
      const toggle = card.querySelector("[data-card-toggle]");
      toggle?.setAttribute("aria-expanded", "false");
      cards.forEach((other) => {
        if (other === card) return;
        delete other.dataset.state;
        other.inert = false;
      });
      const shelf = placeholder;
      placeholder = null;
      card.dataset.state = "closing";
      move(card, from, box(shelf), () => {
        delete card.dataset.state;
        shelf.remove();
      });
      if (instant) settle();
      if (focus) toggle?.focus();
    }
    for (const card of cards) {
      card.querySelector("[data-card-toggle]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (openCard === card) {
          close();
        } else {
          close({ instant: true });
          open(card);
        }
      });
      card.querySelector("[data-card-close]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        close({ focus: true });
      });
    }
    window.addEventListener("click", (event) => {
      if (openCard && !event.target.closest("[data-card]")) close();
    });
    window.addEventListener("keydown", (event) => {
      if (openCard && event.key === "Escape") close({ focus: true });
    });
    expandable.addEventListener("change", (event) => {
      if (!event.matches) close({ instant: true });
    });
  }

  // <stdin>
  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = String((/* @__PURE__ */ new Date()).getFullYear());
  });
  initHeader();
  initCasino();
  initReveal();
  initLatticeTrails();
  initServices();
  initCopyEmail();
  initBlobs();
})();
