// "Copy address" buttons ([data-copy]): copy the address to the clipboard and confirm for a moment.
// The clipboard API exists only on secure pages (HTTPS, localhost); elsewhere the button stays hidden.

const CONFIRM_MS = 2000;

export function initCopyEmail() {
    if (!navigator.clipboard) return;

    const status = document.querySelector("[data-copy-status]");

    document.querySelectorAll("[data-copy]").forEach((button) => {
        let timer = 0;
        button.hidden = false;

        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
            } catch {
                return; // permission refused: the address is on screen to copy by hand
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
