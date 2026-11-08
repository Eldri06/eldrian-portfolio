# eldrian-portfolio

Personal portfolio of **Eldrian T. Colinares**, BSIT (Business Analytics) student at UM Tagum College, Tagum City, Philippines.

Chalk white, ink black and one hit of acid green, with a few 3D pieces along the way.

## Highlights

- Loading screen that counts from 000 to 100 while a dotted globe forms and lands on Tagum City
- Interactive 3D globe in the hero with real continents, flight arcs and an orbiting satellite (drag to spin)
- Sideways project gallery that pins while you scroll, with cards that tilt toward the mouse
- 3D cube sculpture in the About section (hover a cube, click to reshuffle)
- Certificates from seminars, webinars and certification exams, four per page
- Wireframe landscape in the footer that ripples under the mouse
- Light and dark mode that follows your system setting
- Custom cursor, magnetic links and a live Philippine clock

## Built with

- HTML, CSS and JavaScript, no framework or build step
- [Three.js](https://threejs.org/) for the 3D scenes
- [GSAP](https://gsap.com/) and ScrollTrigger for scroll animation
- [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling
- Fonts: Archivo, Geist and Geist Mono
- Map data: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas)

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The 3D scenes need a local server, so opening `index.html` directly won't load them.

## Accessibility

- Works with keyboard navigation and screen readers (skip link, visible focus, labelled controls)
- Respects reduced-motion settings: animations, 3D and scroll effects turn off
- 3D runs lighter on phones and pauses when it scrolls off screen

## Credits

Design inspired by [Akshay's portfolio](https://github.com/akshay-th/akshay-folio).
