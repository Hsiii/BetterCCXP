# Better CCXP

Chrome extension source lives in [`src`](./src). Load that folder as an unpacked extension in Chrome.

Offline logged-in CCXP reference markup lives in [`fixtures/ccxp-snapshot`](./fixtures/ccxp-snapshot). It is a saved browser snapshot for selector and DOM inspection only, and is not part of the shipped extension.

## What it does

- Matches only `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php*`
- Simplifies just the header frame for now
- Replaces the noisy legacy top banner with `NTHU 校務資訊系統`

## Files

- `src/manifest.json`: MV3 extension manifest
- `src/content.js`: same-origin frame script that rewrites the top header
- `fixtures/ccxp-snapshot/index.html`: saved logged-in CCXP entry page snapshot for local reference
- `fixtures/ccxp-snapshot/page-assets/`: assets captured alongside the saved snapshot

## Use

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select [`src`](./src)
5. Visit a real CCXP page under `https://www.ccxp.nthu.edu.tw/ccxp/`
