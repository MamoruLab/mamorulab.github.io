// Fixed header: compact once the page is scrolled, hidden while scrolling down, back when scrolling up.
// On small screens the menu button opens a full-screen overlay with the links.

const DESKTOP = "(min-width: 64rem)"; // lg: the links sit in the header and there is no overlay

export function initHeader() {
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

    // Following a link closes the menu (an in-page link to a section doesn't load a new page)
    menu.querySelectorAll("[data-menu-link]").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    header.querySelector("a")?.addEventListener("click", () => setOpen(false));

    window.addEventListener("keydown", (event) => {
        if (open && event.key === "Escape") {
            setOpen(false);
            button.focus();
        }
    });

    // The overlay is for small screens only: close it if the window grows to the inline-links layout
    window.matchMedia(DESKTOP).addEventListener("change", (event) => {
        if (event.matches && open) setOpen(false);
    });

    // A page restored from the back/forward cache comes back as it was left
    window.addEventListener("pageshow", (event) => {
        if (event.persisted && open) setOpen(false);
    });
}
