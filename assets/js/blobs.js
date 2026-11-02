// Partners hero: soft coloured blobs, placed at random across their colour's column, each drifting slowly back and
// forth on its own path. With reduced motion they stay still.
const EASINGS = ["ease-in-out", "ease-in", "ease-out", "linear", "cubic-bezier(0.42, 0, 0.58, 1)", "cubic-bezier(0.4, 0, 0.2, 1)"];

const random = (from, to) => from + Math.random() * (to - from);

export function initBlobs() {
    const container = document.querySelector("[data-blobs]");
    if (!container) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    container.querySelectorAll("[data-blob]").forEach((blob) => {
        const column = Number(blob.dataset.blobColumn);
        const columns = Number(blob.dataset.blobColumns);
        Object.assign(blob.style, {
            top: `${random(0, 100)}%`,
            left: `${((column + random(0, 0.7)) / columns) * 100}%`,
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
                duration: random(15, 30) * 1000,
                iterations: Infinity,
                direction: "alternate",
                easing: EASINGS[Math.floor(Math.random() * EASINGS.length)]
            }
        );
    });

    container.hidden = false;
}
