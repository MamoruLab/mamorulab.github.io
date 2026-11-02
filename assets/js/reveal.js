// Scroll entrances, played once when the element comes into view. The hidden starting state is in main.css.
//   [data-reveal]       fade with a small rise (data-reveal="fade": fade only); data-reveal-delay in seconds
//   [data-words]        the [data-word] spans inside rise into place one after the other

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

export function initReveal() {
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
