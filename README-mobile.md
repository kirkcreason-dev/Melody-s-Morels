# Melody's Morels — Mobile App Setup (iOS + Android)

The web app becomes a native iOS and Android app using **Capacitor** — it wraps the existing `index.html` in a native WebView and gives it access to native APIs like AdMob, push notifications, and the camera.

---

## What you need installed on your computer

| Tool | Download |
|---|---|
| Node.js (v18+) | nodejs.org |
| Xcode (for iOS) | Mac App Store — Mac only |
| Android Studio | developer.android.com/studio |
| CocoaPods (for iOS) | `sudo gem install cocoapods` |

---

## Step 1 — AdMob setup (admob.google.com)

1. Go to **admob.google.com** → sign in with your Google account
2. **Apps → Add app** → select iOS → enter app name "Melody's Morels" → copy the **App ID** (`ca-app-pub-XXXX~XXXXXXXXXX`)
3. Repeat for Android → copy that App ID too
4. For each app, create two **Ad units**:
   - **Banner** (shown at bottom of screen) → copy the Unit ID
   - **Interstitial** (full-screen, shown between natural breaks) → copy the Unit ID
5. Paste all 6 values into `index.html` at the top of the script (ADMOB_APP_ID_IOS, ADMOB_APP_ID_ANDROID, etc.)
6. Also paste the App IDs into `capacitor.config.json` under the AdMob plugin section

---

## Step 2 — Install Capacitor and build the app

Open Terminal, navigate to your project folder, then run:

```bash
# Install dependencies
npm install

# Add iOS and Android platforms
npx cap add ios
npx cap add android

# Sync your web files into the native projects
npx cap sync
```

---

## Step 3 — iOS (requires Mac + Xcode)

```bash
npx cap open ios
```

This opens Xcode. In Xcode:

1. Select your team under **Signing & Capabilities** → sign in with your Apple Developer account ($99/year at developer.apple.com)
2. Change the **Bundle Identifier** to `com.melodysmorels.app` (or your own)
3. To run on a real iPhone: plug it in, select it as the target, press ▶ Run
4. To submit to the App Store: **Product → Archive → Distribute App**

### App Store info you'll need:
- App name: Melody's Morels
- Category: Sports → Hunting
- Age rating: 4+
- Privacy policy URL (required — create a simple one at app-privacy-policy-generator.firebaseapp.com)
- Screenshots: 6.5" iPhone and 12.9" iPad

---

## Step 4 — Android (Windows or Mac)

```bash
npx cap open android
```

This opens Android Studio. In Android Studio:

1. Let it sync and download dependencies (first time takes a few minutes)
2. **File → Project Structure → app** → change Application ID to `com.melodysmorels.app`
3. To run on a real device: enable Developer Options on your Android phone, plug in, click ▶ Run
4. To publish to Google Play:
   - **Build → Generate Signed Bundle / APK → Android App Bundle**
   - Create a keystore (save this file forever — you need it for every update)
   - Upload the `.aab` file at **play.google.com/console**

### Play Store info you'll need:
- App name: Melody's Morels
- Category: Sports
- Content rating: complete the questionnaire (will be Everyone or Teen)
- Privacy policy URL (same as iOS)
- Feature graphic: 1024×500px banner image

---

## Step 5 — AdSense for the website

The web version (GitHub Pages) uses Google AdSense, not AdMob.

1. Apply at **adsense.google.com** with your site URL
2. After approval (1–2 weeks), go to **Ads → By ad unit**
3. Create a **Display ad** (leaderboard 728×90) → copy the ad slot ID
4. In `index.html` replace `YOUR_ADSENSE_ID` with your publisher ID (`ca-pub-XXXXXXXX`) and `YOUR_LEADERBOARD_SLOT_ID` with the slot ID
5. The app automatically uses AdSense on web and AdMob on mobile

---

## How ads work in the app

The JavaScript at the top of `index.html` detects which platform it's running on:

- **Web browser** → shows Google AdSense banner units (HTML)
- **iOS or Android app** → shows AdMob banner at the bottom of the screen + interstitial ads between certain actions

**Premium subscribers never see any ads** — both AdMob and AdSense are disabled for `isPremium === true` users.

---

## Updating the app

After any change to `index.html`:

```bash
npx cap sync         # copies updated web files into native projects
npx cap open ios     # then build + submit in Xcode
npx cap open android # then build + submit in Android Studio
```

---

## App icon and splash screen

Put your icon files here:
- `resources/icon.png` — 1024×1024px, no rounded corners (the OS applies them)
- `resources/splash.png` — 2732×2732px, logo centered on green (#2d6a4f) background

Then run:
```bash
npm install @capacitor/assets
npx capacitor-assets generate
npx cap sync
```

This auto-generates all required icon and splash sizes for both platforms.

---

## Useful commands

```bash
npx cap sync                    # sync web → native after any index.html change
npx cap run ios --livereload    # live reload during development (requires same WiFi)
npx cap run android --livereload
npx cap doctor                  # diagnose setup issues
```
