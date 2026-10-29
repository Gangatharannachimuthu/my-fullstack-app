# RK Interior – Website

Single-page business website for **RK Interior**, Kavinthapadi (Erode District).
*We Design Your Dream Space.* Managing Director: R Ranjith Babu · 97253 55524 · rkinterior79@gmail.com.

Built with React 18 + Vite. No backend: the enquiry form opens WhatsApp with the details filled in.
Content, colours and photos come from the client's brochure.

## Run locally

```powershell
cd rk-interior
npm install
npm run dev        # http://localhost:3003
npm run build      # production files in dist/
npm run preview    # serve dist/ to check the build
```

## Editing content

All text, phone number, email, address and the photo list are in **`src/data.js`**.

| To change | Edit |
|---|---|
| Phone / WhatsApp / email | `BUSINESS.phones`, `BUSINESS.whatsapp` (country code, no `+`), `BUSINESS.email` |
| Address / map pin | `BUSINESS.addressLines`, `BUSINESS.mapQuery` |
| About text | `ABOUT` |
| Services list | `SERVICES` |
| Spaces (Kitchen, Office, Living, Lobby) | `SPACES` |
| "How we work" steps | `PROCESS` |
| Instagram | `INSTAGRAM.handle` (also `sameAs` in `index.html`) |
| Google review link, rating, count | `GOOGLE` |
| Client reviews shown on the site | `REVIEWS` (real reviews only, copied from Google) |
| Gallery photos | `/admin` page, or edit `src/content/gallery.json` |
| Hero / About / Spaces photos | put the file in `public/images/` and update `PHOTOS` |

The logo is drawn in `src/components/Logo.jsx`. Photos should be JPG, about 1200 px wide and under 250 KB.

## Owner admin page (adding photos)

The owner adds, removes and reorders **gallery photos** at **`/admin`** (Decap CMS), without a developer.
Each save is a commit to `main` (`rk-interior/src/content/gallery.json` and photos in
`rk-interior/public/images/uploads/`); Netlify then rebuilds and the photo is live in about a minute.
Setup is in `public/admin/config.yml`.

### One-time setup on Netlify (after the site is deployed)

1. Site → **Integrations / Identity → Enable Identity**.
2. Identity settings → **Registration: Invite only** (so nobody else can sign up).
3. Identity → **Services → Git Gateway → Enable**.
4. Identity → **Invite users** → the owner's email (rkinterior79@gmail.com).
5. The owner opens the invite email, sets a password, and is taken to `/admin`.
   After that they log in at `https://rk-interior.netlify.app/admin/`.

If Netlify Identity is not available on the account, change `backend` in `config.yml` to
`name: github` + `repo: Gangatharannachimuthu/my-fullstack-app` and add a GitHub OAuth app in
Netlify (**Access control → OAuth**); the owner then needs a GitHub account with access to the repo.

### How the owner adds a photo

Login → **Website → Gallery photos** → **Add photo** → choose the photo, type a caption → **Publish**.
The newest photo is added at the top (shown large). Keep photos under 2 MB.

### Testing the admin page on your computer (no login)

```powershell
cd rk-interior
npm run dev        # terminal 1 – site on http://localhost:3003
npm run cms        # terminal 2 – local CMS server (reads/writes files in this repo)
```

Open **http://localhost:3003/admin/index.html**, click **Login**. Changes are written straight to the
files here (not committed) – check `git status` / revert test changes before committing.

## Sections

Header (sticky, mobile menu) · Hero "Build your dream home with us" · About us with MD contact ·
Services (9) · Spaces we design (4) · How we work · Gallery with full-screen viewer ·
Contact (phone, email, location, Google Map, WhatsApp enquiry form) · Footer · floating WhatsApp button.

## Deploy on Netlify

1. Push the repo to GitHub.
2. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
3. **Base directory:** `rk-interior` (build command and publish folder come from `netlify.toml`).
4. Deploy, then **Site configuration → Change site name** (e.g. `rk-interior`).

## Still to confirm with the owner

- Google Business Profile review link (Google Business → "Ask for reviews" → copy link)
- Full shop / office address (door no, street) and Google Maps pin
- Original high-resolution photos (the current ones are cut from the brochure; the four
  "spaces" photos are only about 200 px wide) and real project photos
- Logo file (the current logo is redrawn from the brochure)
- Opening hours, years in business
- Tamil version
