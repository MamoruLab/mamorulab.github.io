# Mamoru Lab website

Marketing site for Mamoru Lab GmbH, built with [Hugo](https://gohugo.io), published on GitHub Pages. The output is
plain static HTML, CSS and one small script: no server, no cookies, no third-party requests. Building the site
needs Hugo and nothing else (no Node.js).

## 1. Prerequisites

- **Hugo 0.154** or later: <https://gohugo.io/installation/> (macOS: `brew install hugo`; Linux: your
  distribution's package if it is recent enough, otherwise the `.tar.gz` from the
  [releases page](https://github.com/gohugoio/hugo/releases)). Tested with 0.154.5 and 0.169.0; GitHub builds
  the site with 0.169.0.

```sh
hugo version   # v0.154.0 or later
```

## 2. Run the site locally

```sh
hugo server     # http://localhost:1313, reloads when you save a file
```

To build the final site into `public/` exactly as GitHub does:

```sh
hugo --gc --minify
```

## 3. Publish on GitHub Pages

1. Create a repository on GitHub and push the contents of this folder to its `main` branch:

   ```sh
   git init -b main
   git add .
   git commit -m "Mamoru Lab website"
   git remote add origin git@github.com:<account>/<repository>.git
   git push -u origin main
   ```

   Use git rather than the web uploader: folders whose names start with a dot (`.github/`, `static/.well-known/`)
   are easy to miss when dragging files into the browser, and the uploader ignores `.gitignore`.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Every push to `main` now runs `.github/workflows/deploy.yml`, which builds the site and publishes it. Follow it
   under the **Actions** tab. The first run may need to be started again (Actions → the run → *Re-run jobs*) if it
   started before step 2.

The site works both at `https://<account>.github.io/<repository>/` and on a custom domain: the workflow passes
the published address to Hugo, and all links are built from it.

### Custom domain (mamorulab.com)

1. **Verify the domain first** (account or organisation **Settings → Pages → Add a domain**). This stops anyone else
   from publishing a GitHub Pages site on it.
2. In the repository: **Settings → Pages → Custom domain** → `mamorulab.com`.
3. At the DNS provider, for the apex domain:
   - `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www`: `CNAME` to `<account>.github.io`
4. Once the certificate is issued, tick **Enforce HTTPS**.

`/.well-known/security.txt` and `/robots.txt` only take effect at the root of a domain, so they need the custom
domain (or a `<account>.github.io` repository).

## 4. Where things are

| Path | What |
|---|---|
| `hugo.toml` | Site settings: title, description, email, menu links, social profiles |
| `content/` | One file per page. `impressum.md` and `privacy.md` hold the legal texts in Markdown |
| `data/services.yaml`, `data/steps.yaml` | The "What we do" and "How we work" cards |
| `layouts/home.html` and `layouts/_partials/sections/` | Homepage and partners sections |
| `layouts/_partials/` | Header, footer, logo, lattice pattern, buttons, icons |
| `layouts/contact.html`, `partners.html`, `legal.html`, `404.html` | Page layouts |
| `tailwind/main.css` | Source of the stylesheet: fonts, colours, animations (see "Changing the styles") |
| `assets/css/main.css` | The stylesheet, generated from `tailwind/main.css`. Don't edit it by hand |
| `assets/js/` | Behaviour: header and menu, scroll entrances, lattice trail, service cards, copy button |
| `brand/` | Logo and pattern masters (used by the site through Hugo) |
| `static/` | Copied as is: fonts, favicons, `.well-known/security.txt` |
| `.github/workflows/deploy.yml` | Build and deployment on GitHub |

### Legal pages

`{{< todo >}}…{{< /todo >}}` in `content/impressum.md` and `content/privacy.md` marks information that still has
to be filled in or confirmed. It is highlighted in green on the page so it can't ship unnoticed: replace it with
the final text once known.

The company data in the legal notice comes from the Firmenbuch (FN 676889a, published at
<https://www.evi.gv.at/f/676889a>).

### Changing the styles

The pages are styled with [Tailwind CSS](https://tailwindcss.com) classes in the templates
(`class="text-4xl md:text-6xl …"`). The stylesheet those classes need, `assets/css/main.css`, is generated ahead
of time and is part of the repository, so Hugo and GitHub only publish it.

Editing text, the legal pages or the cards in `data/` never requires regenerating it. Regenerate it after:

- changing `tailwind/main.css` (fonts, colours, animations), or
- using a Tailwind class in `layouts/`, `content/`, `data/` or `assets/js/` that the site doesn't use yet. Write
  classes out whole (`lg:col-span-7`), never assembled from pieces, or Tailwind won't find them.

Regenerating uses Tailwind's standalone executable, a single file that needs no Node.js:

1. Download the file for your system from the
   [Tailwind CSS v4.1.18 release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.1.18)
   (`tailwindcss-macos-arm64`, `tailwindcss-linux-x64`, …), and check it against `sha256sums.txt` there.
2. Put it in this folder (git ignores it), rename it to `tailwindcss` and make it executable
   (`chmod +x tailwindcss`; on macOS also `xattr -d com.apple.quarantine tailwindcss`).
3. Run:

   ```sh
   ./tailwindcss -i tailwind/main.css -o assets/css/main.css --minify
   ```

   While editing templates, `./tailwindcss -i tailwind/main.css -o assets/css/main.css --watch` keeps the
   stylesheet up to date next to `hugo server`.
4. Commit `assets/css/main.css` together with your changes.

## 5. Security and privacy notes

- **Content Security Policy:** GitHub Pages can't send custom HTTP headers, so the policy is set in a `<meta>`
  tag (`layouts/_partials/head.html`) and enforced: only same-origin scripts, styles, fonts and images, no inline
  scripts or styles. `Referrer-Policy` is set the same way.
- **Not possible on GitHub Pages:** `frame-ancestors` / `X-Frame-Options` (clickjacking protection),
  `X-Content-Type-Options: nosniff`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` only work as HTTP
  headers. To send them, put a proxy in front (for example Cloudflare, with response header rules) or move to a
  host that lets you set headers.
- **Contact:** there is no contact form. The contact page shows info@mamorulab.com, with a button that copies
  the address (`assets/js/copy-email.js`). Adding a form would need a third-party form service (the site has no
  server), and the privacy policy would have to name it.
- **security.txt** expires on **2027-10-01**: renew the `Expires:` line before then.
- **Hosting terms:** GitHub Pages "is not intended for or allowed to be used as a free web-hosting service to run
  your online business, e-commerce site, or any other website that is primarily directed at either facilitating
  commercial transactions or providing commercial software as a service (SaaS)". A company presentation site is not
  that, but keep it in mind if the site grows.
