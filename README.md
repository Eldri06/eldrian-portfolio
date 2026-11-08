# eldrian-portfolio

Personal portfolio of **Eldrian T. Colinares**, BSIT (Business Analytics) at UM Tagum College, Tagum City.

Chalk white, ink black and one hit of acid green. Swiss-style type, a pinned sideways work gallery, and no frameworks.

## Stack

- Plain HTML, CSS and JavaScript. No build step, no npm.
- Fonts: Archivo, Space Grotesk and Space Mono (Google Fonts). Anton and Cormorant Garamond appear only inside project cards.
- Hosting: GitHub Pages.

## Files

```
index.html      page markup
css/style.css   tokens, layout, sections, motion
js/main.js      clock, greeting, scroll reveals, pinned gallery
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)`.
The site goes live at `https://eldri06.github.io/eldrian-portfolio/`.

## Still to fill in

- [ ] Email address (search for `your-email@example.com`)
- [ ] LinkedIn link
- [ ] Photo for the About section
- [ ] Resume PDF (add it to the repo and point the button at it)
- [ ] DenGuard link once the repo or demo is public
- [ ] Real screenshots per project, if wanted later

## Motion and accessibility

- Desktop with a mouse: the work gallery pins and scrolls sideways as you scroll down.
- Phones and tablets: the gallery is a normal swipeable row.
- `prefers-reduced-motion`: no entrance animations, no marquee, no pinning.
- Skip link, visible focus rings, and readable contrast (acid green is only used as a background, never as text on chalk).

## Design credit

Layout inspired by [Akshay's portfolio](https://github.com/akshay-th/akshay-folio).
