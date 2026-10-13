# Mandram Ledger — mobile app

A native Android/iOS app for the Masiriyamman Mandram ledger, built with **Expo (SDK 57) /
React Native**. It talks to the **same Flask backend** as the web app in `frontend/` — there is no
separate database and no duplicated business logic. Anything entered here shows up in the web app
and vice versa.

The web app in `frontend/` is untouched and keeps working exactly as before.

## Running it

The backend must be running first:

```
cd ../mandram-backend
venv\Scripts\python.exe app.py
```

Then start the app:

```
cd mandram-mobile
npm start
```

Scan the QR code with **Expo Go** on your phone (App Store / Play Store), or press `a` for an
Android emulator.

## First run: the server address

The app asks for the backend address before anything else, and stores it on the device.

**Do not enter `localhost`.** On a phone that means the phone itself, not your PC. Find your PC's
address with `ipconfig` and use the IPv4 value, e.g. `192.168.1.5:5001`. The app adds `http://`
for you, checks `/health` before saving, and tells you what is wrong if it cannot connect.

You can change it later from **Server Settings** in the drawer menu.

Requirements for it to connect:

- phone and PC on the same WiFi
- backend running (it already listens on `0.0.0.0`, so it accepts LAN connections)
- Windows Firewall allowing port 5001 — Windows usually prompts the first time
- plain HTTP is allowed by `usesCleartextTraffic` in `app.json`; without it Android would block
  every request silently

## What is in it

Every screen from the web app, reachable from the drawer menu:

| Screen | Notes |
| --- | --- |
| Meetings | open a meeting, filter by year |
| Members | add/edit members; the joining date drives their ledger visibility |
| Member Ledger | the monthly entry screen — share, joining installment, EMI, personal loans, penalties |
| EMI Loans | assign a loan; totals at the bottom |
| Personal Loans | assign a loan; outstanding and repaid totals |
| Expenditures | entries + categories |
| Chit & Savings | monthly chit/gold/deposit cash, commission, auction amount |
| Chit Management | the register of chits won |
| Monthly Summary | income, expenditure, balance roll-forward, finalize |
| Joining Contributions | admin only — suggests and records buy-ins |
| Users | admin only — logins |

Role handling matches the backend: viewers see only their own loans, and admin-only screens are
hidden from the drawer entirely.

## How it differs from the web app

The logic is identical because it is the same API. The presentation is not:

- **Tables became cards.** A ledger row is a card per member with their entries stacked inside,
  because a nine-column table is unreadable on a phone.
- **A drawer, not tabs.** Eleven sections will not fit in a bottom tab bar.
- **Pull to refresh** on every screen.
- **The server address is configurable**, because a phone cannot use `localhost`.

## Layout

```
App.js                    auth/server gate + drawer navigation
src/
  api/client.js           axios instance; server URL and session in AsyncStorage
  api/services.js         one function per endpoint (mirrors frontend/src/services/mandramApi.js)
  context/AppContext.js   server, signed-in user, meeting list, selected meeting
  hooks/useLoad.js        fetch + loading/refreshing/error for a screen
  components/ui.js        Card, Field, Badge, Btn, TextField, Select, Loading, ErrorBanner
  components/Screen.js    page frame + the shared meeting picker
  theme.js                colours, spacing, rupee and month formatting
  screens/                one file per screen
```

## Building an installable APK

`npm start` + Expo Go is enough for day-to-day use and needs nothing else installed.

For a standalone APK you need an Expo account and EAS:

```
npx eas-cli build --platform android --profile preview
```

That builds in the cloud and gives you a download link. A local build instead needs Android Studio
and a JDK. Neither is set up in this repo.
