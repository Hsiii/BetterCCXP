# Better CCXP

Chrome extension source lives in [`src`](./src). Load that folder as an unpacked extension in Chrome.

## What it does

- Matches only `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php*`
- Simplifies just the header frame for now
- Replaces the noisy legacy top banner with `NTHU 校務資訊系統`

## Files

- `src/manifest.json`: MV3 extension manifest
- `src/content.js`: same-origin frame script that rewrites the top header

## Use

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select [`src`](./src)
5. Visit a real CCXP page under `https://www.ccxp.nthu.edu.tw/ccxp/`
