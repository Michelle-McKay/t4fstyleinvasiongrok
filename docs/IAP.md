# In-app purchases: shipping guide

The game ships a complete store front end and a purchase layer (`js/iap.js`). In a browser it runs in **sandbox mode**: no payment, labelled "Demo build", prices are placeholders. Real money must go through Apple StoreKit or Google Play Billing inside a native wrapper. Apple and Google both require this for digital goods.

## Catalog (all consumable)
Diamond packs `com.ironmarch.dia.*` (six sizes) and 16 themed packs `com.ironmarch.pack.*` (recruit, starter, builder, harvest, grid, quarter, chrono, overtime, warpath, marshal, siege, foundry, vanguard, outrider, warlord, sovereign), $0.99 to $99.99. Contents live in `js/packs.js`; `IAP_CONFIG.provider` is pinned to `sandbox` until server validation exists. Recruit, Starter and Builder's Contract are one per commander.

Diamond packs give a one-time "first purchase" double of the base amount per product. Price tiers are set in App Store Connect and Play Console; the app shows the store's localized price once the native plugin loads it.

## Native wrapper (Capacitor or Cordova)
1. `npm i @capacitor/core @capacitor/cli`, `npx cap init`, set `webDir` to this folder, `npx cap add ios android`.
2. `npm i cordova-plugin-purchase` and `npx cap sync`. `IAP.init()` in `js/iap.js` registers every product and uses `window.CdvPurchase` when present, otherwise sandbox. The native path is written to the plugin v13 API and has **not been tested on a device**.
3. Create the same product ids as consumables in App Store Connect (In-App Purchases) and Play Console (Monetize > Products > In-app products). Add a sandbox tester (Apple) and a licence tester (Google).
4. Bundle the two fonts locally instead of loading them from Google Fonts.
5. Set `IAP_CONFIG.provider = 'native'` for store builds so a missing plugin fails loudly instead of falling back to sandbox.

## Server validation (required before launch)
The client cannot be trusted: anyone can edit local storage or call `iapFulfill`. Before release:
- Stand up a validator (for example RevenueCat, or your own endpoint) and set `IAP_CONFIG.validatorUrl`. It must verify the receipt with Apple (App Store Server API) or Google (Play Developer API purchases.products.get), reject replays, and return the verified transaction id.
- Move diamond balance and purchase records to the server, and have the client read them. Today diamonds live in the local save, so a determined user can grant themselves currency regardless of IAP.
- Acknowledge Google purchases within 3 days and finish Apple transactions after granting. The plugin does this in `verified -> finish`.
- Listen for refund and revocation notices (Apple server notifications, Google real-time developer notifications) and claw back or flag.

## Store and legal checklist
- Digital goods must use the platform store. No links to outside payment for the same items in the iOS build.
- Show the real localized price. Never show diamonds as having cash value.
- Disclose contents before purchase. Every pack here is fixed and contains no random rewards, so no loot-box odds are needed. If you add random packs, publish odds in the store listing and in game (Apple 3.1.1, Google Play policy, and local law).
- Publish a Privacy Policy and Terms, and a refund note. Replace the `#terms`, `#privacy`, `#refunds` links and the support email in `IAP_CONFIG`.
- Set an honest age rating. For children's audiences (COPPA, Apple Kids category, Google Families) purchases need a parental gate and restrictions on ads and data.
- Add spending controls where the law or regions require them (for example parental approval, spending caps, or cool-off periods).
- Provide Restore Purchases (present). Consumables are not restorable, so it only restores entitlements you later add.
- Check consumer law in your markets (EU withdrawal rights for digital content, tax and VAT are handled by the store as merchant of record).
- Get legal review before submission. This document is engineering guidance, not legal advice.
