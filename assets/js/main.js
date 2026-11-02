// Site behaviour. Built by Hugo (js.Build) into one file, loaded with defer on every page.
import { initBlobs } from "./blobs.js";
import { initCasino } from "./casino.js";
import { initCopyEmail } from "./copy-email.js";
import { initHeader } from "./header.js";
import { initLatticeTrails } from "./lattice-trail.js";
import { initReveal } from "./reveal.js";
import { initServices } from "./services.js";

// The year is filled in when the site is built; keep it current between builds
document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
});

initHeader();
initCasino();
initReveal();
initLatticeTrails();
initServices();
initCopyEmail();
initBlobs();
