# Academic Personal Homepage

A clean, modern, and **fully dynamic** academic personal website powered by Markdown. Update your homepage by simply editing `.md` files — no build step required.

## ✨ Features

- **Dynamic Markdown Content** — Edit `data/*.md` files to update all site content instantly
- **Zero Build Step** — Pure HTML/CSS/JS, deploy directly to GitHub Pages
- **Responsive Design** — Works beautifully on desktop, tablet, and mobile
- **Rich Paper Listings** — Auto-formatted publication cards with year grouping
- **News Timeline** — Chronological news items with date extraction
- **Project Grid** — Card-based project showcase
- **Clean Academic Aesthetic** — Inspired by top academic homepages

## 📁 Project Structure

```
.
├── index.html              # Entry point
├── css/
│   ├── base.css            # CSS variables & reset
│   ├── layout.css          # Sidebar + main layout
│   ├── components.css      # Cards, papers, projects, news
│   └── responsive.css      # Mobile & print styles
├── js/
│   ├── config.js           # 🔧 Site configuration (edit me!)
│   ├── renderer.js         # Markdown fetch & render engine
│   ├── sections.js         # Section-specific formatters
│   └── main.js             # App initialization & routing
├── data/                   # 📝 All your content (Markdown)
│   ├── about.md
│   ├── papers.md
│   ├── projects.md
│   └── news.md
└── assets/
    └── images/
        └── avatar.jpg      # Your profile photo
```

## 🚀 Quick Start

### 1. Configure Your Info

Edit [`js/config.js`](js/config.js):

```javascript
const SITE_CONFIG = {
  profile: {
    name: "Your Name",
    role: "Ph.D. Student",
    affiliation: "University Name",
    email: "you@example.com",
    avatar: "assets/images/avatar.jpg",
    links: [
      { icon: "github", url: "https://github.com/...", label: "GitHub" },
      { icon: "scholar", url: "https://scholar.google.com/...", label: "Google Scholar" },
      // ...
    ],
  },
  // ...
};
```

### 2. Add Your Content

Simply edit the Markdown files in the `data/` directory:

| File | Purpose |
|------|---------|
| `data/about.md` | Bio, education, experience |
| `data/papers.md` | Publications (grouped by `## Year`) |
| `data/projects.md` | Projects (uses `*italic*` for tags) |
| `data/news.md` | News & updates (use `**Date**` prefix) |

### 3. Add Your Photo

Place your profile photo at `assets/images/avatar.jpg`.

### 4. Deploy

#### Option A: GitHub Pages (Recommended)

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Select **Deploy from a branch** → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/repo-name/`

> **Note**: If deploying to a subdirectory, update the asset paths in `index.html` and `config.js` to use relative paths (`./css/...` instead of `/css/...`).

#### Option B: Local Preview

Simply open `index.html` in your browser, or run a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# Then open http://localhost:8000
```

## 📝 Markdown Conventions

### Publications (`data/papers.md`)

```markdown
## 2024

- **Paper Title Here**
  - *Author One, Your Name, Author Three*
  - Conference Name (Venue)
  - [PDF](link) | [Code](link) | [Project](link)
```

The renderer automatically:
- Groups papers by year
- Counts papers per year
- Formats title, authors, venue
- Creates styled link buttons

### News (`data/news.md`)

```markdown
- **Jan 2024** – Your news item here with [links](https://...)
```

Dates in `**bold**` at the start are extracted into a styled date badge.

### Projects (`data/projects.md`)

```markdown
- **[Project Name](link)**
  - Description of the project
  - *Tag1, Tag2, Tag3*
```

Italic text at the end becomes technology tags.

## 🎨 Customization

### Colors

Edit CSS variables in [`css/base.css`](css/base.css):

```css
:root {
  --color-accent: #2563eb;      /* Primary accent color */
  --color-bg: #ffffff;          /* Background */
  --color-text: #2c3e50;        /* Main text */
  /* ... */
}
```

### Add New Sections

1. Add to `js/config.js`:
   ```javascript
   navigation: [
     // ...existing items...
     { id: "talks", label: "Talks", dataFile: "data/talks.md" },
   ],
   ```

2. Create `data/talks.md`

3. Optionally add a post-processor in `js/sections.js`

### Add Social Icons

Add SVG icons to the `ICONS` object in `js/main.js`:

```javascript
const ICONS = {
  // ...existing icons...
  youricon: `<svg>...</svg>`,
};
```

Then reference it in `config.js`:

```javascript
{ icon: "youricon", url: "https://...", label: "Your Platform" }
```

## 📄 License

MIT License — feel free to use and modify for your own academic homepage.

## 🙏 Acknowledgments

Design inspired by [ysymyth.github.io](https://ysymyth.github.io).
