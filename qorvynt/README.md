# QORVYNT Technologies & Solutions – website

React + Vite site. Each menu item is its own page (`#about`, `#services`, …) and fits one desktop
screen; phones scroll where content stacks. The footer appears only on the Contact page.

```bash
npm install
npm run dev      # http://localhost:3003
npm run build    # output in dist/
```

## Editing content

All text, services (3 groups), mobile services, industries, process steps, portfolio examples and
form options are in `src/data.js`. Pages: Home, About, Services, Mobile Apps, Industries, Process,
Portfolio, Contact, plus Privacy and Terms.

The Android / iOS phone mockups (`src/components/Phone.jsx`) show an original sample app and are
labelled as illustrative - they are not published apps.

## Before launch – still to do

1. **Contact details** – fill `CONTACT` in `src/data.js` (email, phone, address). Until then the site
   shows "Official … to be added".
2. **Inquiry form delivery** – "Send Inquiry" opens WhatsApp to `CONTACT.whatsapp` with the details
   filled in; the visitor taps Send in WhatsApp. To receive inquiries directly instead, set
   `FORM_ENDPOINT` in `src/data.js` to a form service or your own API that accepts a JSON POST
   (`name, email, company, projectType, platform, budget, details`).
   Until it is set, the form validates input and tells the visitor clearly that the message was
   **not** sent. Never put API keys in the frontend.
3. **Domain** – once live, add `<link rel="canonical">` in `index.html` and make `og:image`
   (`/images/og-image.png`) an absolute URL.
4. **Legal pages** – Privacy Policy and Terms (`src/components/Legal.jsx`) are general drafts; have
   them reviewed, and update them if analytics or cookies are added.
5. **Budget ranges** – the form lists budgets in USD (`BUDGETS` in `src/data.js`); change the currency
   or ranges to suit your market.
6. **App stores** – the site offers store submission support but never claims published apps. For
   real client releases you will need Google Play Console and Apple Developer Program accounts.
7. **Logo** – the hexagon "Q" mark (`src/components/Logo.jsx`, `public/favicon.svg`) is a placeholder
   until the official logo is supplied.

## Deploying on Netlify

Set the site's **Base directory** to `qorvynt`; `netlify.toml` handles the build.
