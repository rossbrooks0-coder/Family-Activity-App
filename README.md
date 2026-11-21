# Little Explorers

A mobile-first web app that helps parents and caregivers of children aged 0–12 find family-friendly outdoor activities: walks, trails, parks and gardens.

It can be installed to a phone's home screen like a normal app (it's a "Progressive Web App").

## What's in here

| File | What it does |
| --- | --- |
| `index.html` | The page shell: top bar, content area, bottom navigation |
| `styles.css` | All the colours, spacing and layout |
| `app.js` | Decides which screen to show and builds it |
| `data.js` | **The example activities. Edit this to change the content.** |
| `manifest.webmanifest` | App name, colours and icons used when installed |
| `sw.js` | Lets the app open fast and work offline |
| `icons/` | The home-screen icons |

There's no build step: these files can be hosted as they are.

## Preview it on your phone (GitHub Pages, free)

1. On GitHub, open the repository, then go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Pick the branch with the app on it and the `/ (root)` folder, then press **Save**.
4. Wait a minute or two. The page shows your link, e.g. `https://<your-username>.github.io/Family-Activity-App/`.
5. Open that link on your phone.

### Add it to your home screen
- **iPhone (Safari):** tap the Share button, then **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu, then **Install app** or **Add to Home screen**.

## Run it on a computer
From this folder run `python3 -m http.server 8000`, then open http://localhost:8000.
