// "What we do": on wide screens a card expands to fill the grid when its title is pressed, and the others fade out.
// Below that width the cards are static and show their details inline (see what-we-do.html).
//
// The card's state is in data-state, which the template's classes style: "open" (fills the grid), "hidden"
// (another card is open), "closing" (shrinking back to its place). While a card is open or closing, an invisible
// placeholder keeps its place in the grid.

const EXPANDABLE = "(min-width: 64rem)";
const DURATION = 700;
const EASING = "cubic-bezier(0.19, 1, 0.22, 1)";

export function initServices() {
    const grid = document.querySelector("[data-services]");
    if (!grid) return;

    const cards = [...grid.querySelectorAll("[data-card]")];
    const expandable = window.matchMedia(EXPANDABLE);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let openCard = null;
    let placeholder = null;
    let animation = null;
    let pending = null; // runs when the current animation ends

    // Position and size of an element relative to the grid
    function box(element) {
        const outer = grid.getBoundingClientRect();
        const inner = element.getBoundingClientRect();
        return { top: inner.top - outer.top, left: inner.left - outer.left, width: inner.width, height: inner.height };
    }

    // Ends the running animation at once, so the next one starts from a settled layout
    function settle() {
        animation?.cancel();
        animation = null;
        const done = pending;
        pending = null;
        done?.();
    }

    // Moves the card from one box to another; with reduced motion it simply jumps
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
        const from = box(card); // where it is now, even halfway through closing
        settle();

        placeholder = document.createElement("div");
        placeholder.className = `${card.dataset.span} invisible pointer-events-none`;
        placeholder.setAttribute("aria-hidden", "true");
        // The placeholder keeps the card's closed height, so the grid, and the open card that fills it, are the same
        // size whichever card is open (a card alone in its row would otherwise collapse that row)
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
        const from = box(card); // where it is now, even halfway through opening
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

    // Cards only expand on wide screens: below that, an open card simply goes back to its place
    expandable.addEventListener("change", (event) => {
        if (!event.matches) close({ instant: true });
    });
}
