# NASA Space Apps San Salvador

Event site and social badge generator for the NASA Space Apps Challenge local event in San Salvador. Visitors learn what Space Apps is, how to take part, and create a personalized badge (post or story) to share on social media.

The site content is in Spanish. It is a static site with no runtime dependencies.

## Getting started

Requires Node.js 20 or later.

```sh
npm run dev      # http://127.0.0.1:4173
npm run check    # syntax check for browser scripts
npm run build    # outputs the static site to dist/
npm run format   # formats the codebase with Prettier
```

## Project structure

```
index.html                  Page markup and copy
src/
  css/main.css              Styles, brand tokens and motion
  js/event-config.js        Event details (city, dates, mode, countdown target)
  js/space-scene.js         Background canvas: starfield and orbit tunnel
  js/page-motion.js         Scroll reveals, counters, timeline, countdown, preview tilt
  js/badge-generator.js     Badge rendering and PNG export
assets/
  brand/                    Official Space Apps logos
  fonts/                    Fira Sans, Overpass and Fira Code (SIL OFL)
  partners/                 Sponsor logos used in the badge "Powered by" row
  favicon.svg
scripts/
  build.mjs                 Static build
  dev-server.mjs            Local development server
```

## Configuration

Edit `src/js/event-config.js`:

- `city`, `dates` and `mode` appear on the site and on the badge.
- `eventStart` drives the countdown. Leave it empty to hide it.

## Features

- Live badge preview with name, role or team, and photo (JPG, PNG or WebP up to 8 MB, 40 MP max) with zoom and vertical framing.
- 1080 × 1080 post and 1080 × 1920 story PNG exports.
- Photos are processed in the browser and never uploaded.
- Immersive background with a 3D orbit tunnel that accelerates on scroll.
- All non-essential motion is disabled with `prefers-reduced-motion`.

## Brand

Follows the NASA Space Apps Brand Guide 2026: official logos, color palette, Fira Sans / Overpass / Fira Code typography, Neon Yellow used only as an accent, alternating subheading lines, circular photo holders with concentric orbits, and the coordinates pattern at 25% opacity.

The badge "Powered by" row includes Ai Labs, Cognition, IEEE and SVNet. Logos are normalized by visual weight at render time.

Brands and logos belong to their respective owners. This is a community project and not an official NASA site. Creating a badge does not register you for the event.

## Deployment

The build output in `dist/` can be hosted on any static host.

- **Vercel:** import the repository; `vercel.json` sets the build command and output directory.
- **Netlify:** import the repository; `netlify.toml` contains the configuration.
- **Cloudflare Pages:** use `npm run build` and `dist` as the output directory.
