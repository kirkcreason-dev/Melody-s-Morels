# Melody's Morels — Full App Setup

## What you need to set up (all free tiers available)

| Service | Purpose | Free tier |
|---|---|---|
| Firebase | Auth, database, storage, push | Spark plan — free forever |
| Stripe | Premium subscriptions | Free until you charge |
| Cloudinary | Photo uploads | 25 GB free |
| Formspree | Contact form emails | 50/month free |
| Google AdSense | Ad revenue | Free, pays you |

---

## Step 1 — Firebase (30 min)

1. Go to **console.firebase.google.com** → **Add project** → name it `melodys-morels`
2. Skip Google Analytics if you want

### Authentication
3. Left sidebar → **Build → Authentication → Get started**
4. Enable **Email/Password** and **Google**

### Firestore Database
5. Left sidebar → **Build → Firestore Database → Create database**
6. Choose **Production mode** → select a region close to your users (us-central1 works for the Midwest)
7. After created, go to **Rules** tab and paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /finds/{findId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /likes/{likeId} {
      allow read, write: if request.auth != null;
    }
    match /follows/{followId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage
8. Left sidebar → **Build → Storage → Get started** → Production mode
9. Go to **Rules** tab and paste:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Get your config
10. Left sidebar → **Project settings** (gear icon) → **Your apps** → **Add app** → Web (</>)
11. Name it `melodys-morels-web` → **Register app**
12. Copy the `firebaseConfig` object — it looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "melodys-morels.firebaseapp.com",
  databaseURL: "https://melodys-morels-default-rtdb.firebaseio.com",
  projectId: "melodys-morels",
  storageBucket: "melodys-morels.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```
13. Paste each value into `index.html` where you see `YOUR_API_KEY`, `YOUR_PROJECT`, etc.
14. Also paste the same config into `sw.js` (same spot at the top)

### Push Notifications (VAPID key)
15. **Project settings → Cloud Messaging** tab
16. Scroll to **Web Push certificates** → **Generate key pair**
17. Copy the key → paste into `index.html` as `FCM_VAPID_KEY`

---

## Step 2 — Stripe (15 min)

1. Go to **dashboard.stripe.com** → create account
2. Left sidebar → **Products → Add product**
   - Name: "Melody's Morels Premium"
   - Add price: **$9.99/month recurring** → Save → copy the **Price ID** (starts with `price_`)
   - Add another price: **$79.99/year recurring** → copy that Price ID too
3. Paste them into `index.html`:
   - `STRIPE_PRICE_MONTHLY` = monthly price ID
   - `STRIPE_PRICE_YEARLY` = yearly price ID
4. Left sidebar → **Developers → API keys** → copy **Publishable key** (starts with `pk_live_`)
5. Paste as `STRIPE_KEY` in `index.html`

### Deploy the Stripe webhook backend (Firebase Cloud Function)
6. Install Firebase CLI: `npm install -g firebase-tools`
7. In your project folder: `firebase login` then `firebase init functions`
8. Copy `functions/index.js` from this repo into the functions folder
9. Run: `cd functions && npm install`
10. Set your Stripe keys:
```bash
firebase functions:config:set stripe.secret="sk_live_YOUR_SECRET_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```
11. Deploy: `firebase deploy --only functions`
12. Copy the function URL shown → go to Stripe dashboard → **Developers → Webhooks → Add endpoint**
    - URL: the function URL
    - Events: `customer.subscription.created`, `customer.subscription.deleted`, `customer.subscription.updated`
13. Copy the **Signing secret** from Stripe → that's your `stripe.webhook_secret` above

---

## Step 3 — Cloudinary (5 min)

1. Go to **cloudinary.com** → free account
2. Dashboard → note your **Cloud name** (top left)
3. **Settings → Upload → Add upload preset** → Signing Mode: **Unsigned** → save
4. Copy the preset name
5. Paste both into `index.html`: `CLOUDINARY_CLOUD` and `CLOUDINARY_PRESET`

---

## Step 4 — Formspree (3 min)

1. Go to **formspree.io** → free account
2. **+ New Form** → name it "Guided Hunt Booking" → copy the ID (like `xpwzabcd`)
3. Create another form "General Inquiry" → copy that ID
4. In `index.html` find `HUNT_FORM_ID` and `GENERAL_FORM_ID` and replace them

---

## Step 5 — Google AdSense (1–2 weeks approval)

1. Go to **adsense.google.com** → apply with your site URL
2. After approval, go to **Ads → By ad unit** → create ad units
3. Copy your publisher ID (`ca-pub-XXXXXXXX`) → replace `ADSENSE_ID` in `index.html`
4. Find the ad slot comments in `index.html` and uncomment the `<ins class="adsbygoogle">` tags
5. Ads only show to free (non-premium) users automatically

---

## Step 6 — Deploy to GitHub Pages

1. Push all files to your GitHub repo: `index.html`, `sw.js`, `README.md`
2. **Settings → Pages → Source: main branch / root**
3. Live at `https://kirkcreason-dev.github.io/Melody-s-Morels`

**Note:** For the Stripe checkout to work, you need HTTPS (GitHub Pages provides this).
The service worker (`sw.js`) also requires HTTPS to run.

---

## Files in this repo

```
index.html              Main app — map, social feed, auth, premium, contact
sw.js                   Service worker for push notifications
functions/
  index.js              Firebase Cloud Function for Stripe webhooks
  package.json          Dependencies
README.md               This file
```

---

## Premium features gating

Premium users (`isPremium === true` in Firestore) automatically get:
- Ads disabled
- "PRO" badge in header
- Full access to all premium UI sections

Free users see ads and upgrade prompts. The `isPremium` flag is set by the Stripe webhook Cloud Function when a subscription becomes active, and cleared when it's canceled.

---

## Adding a guide in another state

To add a new guide card, find the Guided Hunts section in `index.html` and copy one of the guide card divs. Update the name, location, description, and tags.

## Adding map spots

Find the `CURATED` array in `index.html`. Add an entry:
```javascript
{
  name: "My Spot",
  lat: 38.123,
  lng: -94.456,
  base: 75,           // 0–100 baseline likelihood
  elev: "low",        // "low" | "mid" | "high"
  rk: "NW Missouri",  // must match a key in the RP object
  notes: "Hunting notes here."
}
```
