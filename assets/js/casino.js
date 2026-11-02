// Letters that roll on hover (layouts/_partials/casino.html): each letter starts a little after the previous one
export function initCasino() {
    document.querySelectorAll("[data-casino]").forEach((text) => {
        const delay = parseFloat(text.dataset.casino);
        const duration = parseFloat(text.dataset.casinoDuration);
        text.querySelectorAll(".casino-char").forEach((char, index) => {
            char.style.transitionDelay = `${index * delay}s`;
            if (duration) char.style.transitionDuration = `${duration}s`;
        });
    });
}
