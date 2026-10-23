# Vallangarai Traders – Website

Single-page business website for **Vallangarai Traders**, Kodumudi (Erode District):
Aluminium | PVC Doors | UPVC Windows | Curtains | Blinds.

Built with React 18 + Vite. No backend: the enquiry form opens WhatsApp with the details filled in.
Content and photos come from `Vallangarai_Traders_Real_Photo_Brochure.pdf`.

## Run locally

```powershell
cd vallangarai-traders
npm install
npm run dev        # http://localhost:3002
npm run build      # production files in dist/
npm run preview    # serve dist/ to check the build
```

## Editing content

All text, phone numbers, address and the photo list are in **`src/data.js`**.

| To change | Edit |
|---|---|
| Phone numbers / WhatsApp number | `BUSINESS.phones`, `BUSINESS.whatsapp` (country code, no `+`) |
| Address / map pin | `BUSINESS.addressLines`, `BUSINESS.mapQuery` |
| Products and descriptions | `CATEGORIES` |
| "Why us" points | `STRENGTHS` |
| Photos | put the file in `public/images/`, then add it to `PHOTOS` and a category's `photos` |

Photos should be JPG, about 1000 px wide and under 200 KB.

## Sections

Header (sticky, mobile menu) · Hero with Call / WhatsApp · Services (5 categories) ·
Products (tabs per category with photos) · Why us · Gallery with full-screen viewer ·
Contact (phones, address, Google Map, WhatsApp enquiry form) · Footer · floating WhatsApp button.

## Deploy on Netlify

1. Push the repo to GitHub.
2. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
3. **Base directory:** `vallangarai-traders` (build command and publish folder come from `netlify.toml`).
4. Deploy. Then **Site configuration → Change site name** (e.g. `vallangarai-traders`).
5. Custom domain (optional): **Domain management → Add a domain**. Netlify adds free HTTPS.

## Still to confirm with the owner

- Which number is on WhatsApp (currently 84895 10293)
- Email address, years in business, owner name (for an About section)
- Blinds: photos/details (it is in the tagline and the enquiry form only)
- More photos for UPVC doors, Cheran / Lotus PVC doors and cupboards
- Tamil version
