# 🍄 Morel Locator

Interactive morel mushroom habitat map for the United States. Shows ~55 named habitat spots with likelihood scoring based on season, temperature, rainfall, and field conditions.

**Live site:** `https://YOUR-USERNAME.github.io/morel-locator`

## Features
- Zoomable map with terrain and road layers (OpenStreetMap / OpenTopoMap)
- Habitat toggles: south-facing slope, wood line, water, oak trees
- Season and weather condition sliders
- Elevation baked into scoring (lowlands / mid / high)
- Click any spot for terrain details, tree associations, and hunting notes

## Deploy to GitHub Pages

1. Create a new repo at github.com (e.g. `morel-locator`)
2. Upload `index.html` and `README.md`
3. Go to **Settings → Pages**
4. Under **Source**, select `main` branch and `/ (root)` folder
5. Click **Save** — your site will be live at `https://YOUR-USERNAME.github.io/morel-locator` in ~60 seconds

## Add a spot
All spots are in the `SPOTS` array near the top of `index.html`. Each entry looks like:

```js
{
  name: "My Spot Name",
  lat: 39.245,
  lng: -94.290,
  base: 75,          // 0–100 baseline likelihood
  elev: "low",       // "low" | "mid" | "high"
  region: "NW Missouri",
  trees: "Elm, ash, cottonwood",
  topo: "South-facing creek hollows",
  notes: "Hunting notes go here.",
  habitat: {
    southSlope: 2,   // 0=absent, 1=present, 2=prime/defining
    woodLine: 2,
    water: 2,
    oak: 1
  }
}
```

## Map tiles
Uses free tile servers — no API key needed.
- **Streets:** OpenStreetMap (`tile.openstreetmap.org`)
- **Terrain:** OpenTopoMap (`tile.opentopomap.org`)

For high-traffic sites, consider a hosted tile CDN like [Stadia Maps](https://stadiamaps.com) (free tier) as a drop-in replacement.
