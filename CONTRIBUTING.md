# Contributing to ccxpLite

Thanks for helping improve ccxpLite.

## Before You Start

Small bug fixes and documentation improvements can go directly to a pull request. Please open an issue first for new behavior, broad visual changes, or work that affects several parts of the extension so we can agree on the direction.

Security and privacy issues should be reported privately according to our [security policy](.github/SECURITY.md), not through a public issue.

## Development

You need [Bun](https://bun.sh/) 1.3.9 or later.

```sh
bun install
bun run check
bun run build
```

`bun run check` runs type checking, linting, formatting checks, and unit tests. `bun run build` rebuilds the Chrome and Firefox extensions. Run both before submitting changes. If a command fails on an unchanged `main` branch too, include that comparison in your pull request instead of hiding the failure.

Keep tests focused on the behavior you changed. Do not commit generated build output from `dist/`.

### Manual Browser Testing

Build and load the extension locally before submitting changes to browser behavior or CCXP pages:

- Chrome: run `bun run build:crx`, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/crx/unpacked`.
- Firefox: run `bun run build:firefox`, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/firefox/unpacked/manifest.json`.

Rebuild after changing TypeScript. Test the affected CCXP pages with your own account, and remove personal information from screenshots.

## Pull Requests

- Create your branch from the latest `main`.
- Keep each pull request focused on one reviewable concern.
- Do not stack pull requests unless you have agreed on that workflow with the maintainer. If a pull request has a dependency, link it clearly.
- Use a [Conventional Commits](https://www.conventionalcommits.org/) title, such as `fix: restore section heading contrast`.
- Describe the user-visible problem, the chosen solution, and relevant trade-offs.
- For visual changes, include before and after screenshots taken in the same state and viewport.
- For changes to CCXP pages, list the affected page paths and browsers you tested.
- Add or update focused tests for behavior changes.

AI-assisted contributions are welcome, but disclose what the tools helped with in the pull request. Write the pull request description in your own words, and review, understand, test, and take responsibility for every submitted line. Remove generated placeholders, irrelevant commentary, and unrelated changes before opening the pull request. Be prepared to explain your changes and respond to review feedback.

By contributing, you agree that your contribution will be licensed under the [MIT License](LICENSE) and that you will follow our [Code of Conduct](CODE_OF_CONDUCT.md).
