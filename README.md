# eldrian-portfolio

Personal portfolio of **Eldrian T. Colinares**, BSIT (Business Analytics) at UM Tagum College, Tagum City.

Chalk white, ink black and one hit of acid green. Swiss-style type, a pinned sideways work gallery, and no frameworks.

## Stack

- Plain HTML, CSS and JavaScript. No build step, no npm.
- GSAP 3.12.5 + ScrollTrigger (cdnjs) for the pinned gallery and line reveals; Lenis 1.1.13 (jsDelivr) for smooth scroll.
- Fonts: Archivo (display), Geist and Geist Mono (Google Fonts). Anton and Cormorant Garamond appear only inside project cards.
- Hosting: GitHub Pages.

## Files

```
index.html      page markup
css/style.css   tokens, layout, sections, motion
js/main.js      preloader, clock, greeting, cursor, magnetic links,
                Lenis, pinned gallery, line reveals, live previews
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

## Features

- 000 to 100 preloader that wipes upward
- Live Philippine time and a time-of-day greeting
- Custom cursor (acid dot + ink ring) and magnetic nav, footer link and button
- Two marquee rows running opposite ways
- Pinned sideways work gallery with motif drift on each card
- About lead that reveals line by line
- Giant LET'S TALK link that fills acid green on hover
- Grain overlay and a header that frosts once you scroll
- Live preview on hover: add `data-preview="https://..."` to a card link to show its live site

## Motion and accessibility

- Desktop with a mouse: the work gallery pins and scrolls sideways as you scroll down.
- Phones and tablets: the gallery is a normal swipeable row.
- `prefers-reduced-motion`: no entrance animations, no marquee, no pinning.
- Skip link, visible focus rings, and readable contrast (acid green is only used as a background, never as text on chalk).

## Design credit

Design and interactions inspired by [Akshay's portfolio](https://github.com/akshay-th/akshay-folio).
All code here is written from scratch for this site; none of it is copied from that repo.
