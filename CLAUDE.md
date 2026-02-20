# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Capital Golf Labs** is a marketing landing page for a private, 24/7 golf simulator studio coming to the DMV (Washington DC/Maryland/Virginia) area. The site promotes founding memberships and waitlist signups using TrackMan iO technology as its core differentiator.

- **Live domain**: `capitalgolflabs.com` (configured via `CNAME`)
- **Hosting target**: GitHub Pages (static) or Heroku (if Flask backend is activated)
- **Current state**: Single-page static website; Flask infrastructure is present but no backend application file exists yet

---

## Repository Structure

```
dmv-golf-lab/
├── index.html          # The entire website — one HTML file, single page
├── static/
│   ├── css/
│   │   └── style.css   # All styles (~22 KB); single stylesheet, no preprocessor
│   └── img/
│       ├── trackman-hero.jpg         # Hero section background (210 KB)
│       ├── Trackman_iO_Side.jpg      # Product photo (111 KB)
│       └── Trackman_iO_Front.png     # Product photo (14.3 MB — large, handle with care)
├── requirements.txt    # Flask + Gunicorn pinned dependencies (for future backend)
├── CNAME               # GitHub Pages custom domain: capitalgolflabs.com
├── Procfile            # Heroku config — currently empty
├── .gitignore          # Excludes venv/, *.pyc, __pycache__/, .env
└── sync-fix.txt        # Sync marker file — do not delete
```

---

## Development Workflow

### Serving the site locally

This is a static site. Open `index.html` directly in a browser, or serve it with any simple HTTP server:

```bash
# Python (no install required)
python3 -m http.server 8080

# Node.js (if available)
npx serve .
```

### If activating the Flask backend

There is no `app.py` yet. If you create one, the standard entry point expected by Gunicorn is `app:app`:

```bash
pip install -r requirements.txt
gunicorn app:app
```

The `Procfile` is empty — populate it when a backend is ready:
```
web: gunicorn app:app
```

### No build step

There is no bundler, transpiler, or asset pipeline. Edit `index.html` and `static/css/style.css` directly. Changes are immediately reflected when the browser refreshes.

---

## Testing

There are **no automated tests** in this repository. There is no test framework, no test directory, and no CI/CD configuration.

When making changes:
1. Open `index.html` in a browser and visually inspect all sections
2. Resize the browser to verify responsive breakpoints at **768px** and **1200px**
3. Check that all navigation anchor links (`#tech`, `#trackman`, `#comparison`) scroll correctly
4. Confirm external Google Forms links open properly (see External Integrations below)

---

## Code Conventions

### HTML (`index.html`)

- Single HTML file, no templating engine currently in use
- Sections are clearly delimited with comments (e.g., `<!-- ===================== CONCEPT SECTION ===================== -->`)
- Anchor IDs used for in-page navigation: `#tech`, `#trackman`, `#comparison`
- No JavaScript — the site is entirely HTML and CSS

### CSS (`static/css/style.css`)

- **No preprocessor** — plain CSS with custom properties (variables)
- **Design tokens** defined at `:root`:
  - `--bg`: dark background
  - `--accent`: `#4fa3d1` (blue)
  - `--text`: body text color
- **BEM-like class naming**: `feature-card`, `trackman-section`, `status-link-primary`, `hero-btns`, etc.
- **Typography**:
  - Headings: `Barlow Condensed` (Google Fonts, weights 400/600/700/800)
  - Body: `DM Sans` (Google Fonts, weights 300/400/500/700)
- **Responsive breakpoints**:
  - `768px` — tablet/mobile transition
  - `1200px` — wide desktop
- **Dark theme** throughout; do not introduce light-mode styles without explicit instruction
- All animations use `transition` and CSS `@keyframes`; no JavaScript animations

### Python (if adding backend)

- Follow PEP 8
- Pin all new dependencies with exact versions in `requirements.txt`
- Do not commit `.env` files — the `.gitignore` already excludes them

---

## External Integrations

All user-facing forms are hosted on Google Forms. The URLs are embedded directly in `index.html`:

| Purpose | Link variable in HTML | Current URL |
|---|---|---|
| Founding member signup | `FOUNDING MEMBER FORM` comment | `https://forms.gle/fjFhxJwyRkByqQQn9` |
| General waitlist | `WAITLIST FORM` comment | `https://forms.gle/SUdiG1LNcRmVzhmd6` |

When updating form links, search for the comment labels in `index.html` — they are annotated clearly:
```html
<!-- FOUNDING MEMBER FORM: ... -->
<!-- WAITLIST FORM: ... -->
```

---

## Key Content Sections (index.html)

| Section | Anchor / ID | Description |
|---|---|---|
| Navigation | `<nav>` | Logo, nav links, waitlist CTA |
| Hero | `<header class="hero">` | Primary headline, two CTA buttons |
| Announcement banner | `.announcement-banner` | "Limited founding memberships available" |
| The Concept | `#tech` | Three feature cards (tour tech, 24/7, pricing) |
| Technology | `#trackman` | TrackMan iO specs and product images |
| Who It's For | `#comparison` | "What We Are / What We Aren't" comparison |
| Status | `#status` (if present) | Site selection progress |
| Social proof | Instagram link section | |
| Footer | `<footer>` | Contact info |

---

## Assets

- **Do not resize or recompress images without explicit instruction** — product photos are sourced from TrackMan and must remain high quality
- `Trackman_iO_Front.png` is 14.3 MB; avoid adding similarly large unoptimized assets
- New images go in `static/img/`

---

## Git Workflow

The active development branch for AI-assisted work follows the pattern:
```
claude/claude-md-<session-id>
```

Commit messages in this repo use plain imperative style (no ticket numbers):
```
Fixed footer
Updated for mobile scrolling
Changed meta
```

Match this style when committing changes.

---

## What Does Not Exist (Do Not Assume)

- No `app.py` or Flask application — do not reference it unless you create it
- No JavaScript files — the site has zero JS
- No database or backend API
- No test suite or CI pipeline
- No CSS preprocessor (no Sass/Less/PostCSS)
- No package.json or Node dependencies
