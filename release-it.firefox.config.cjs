module.exports = {
  git: {
    commitMessage: "chore: release ccxpLite firefox-v${version}",
    tagName: "firefox-v${version}",
  },
  github: {
    assets: [
      "dist/firefox/ccxpLite-firefox-v${version}.xpi",
      "dist/firefox/ccxpLite-firefox-v${version}-sources.zip",
    ],
    autoGenerate: true,
    draft: true,
    release: true,
    releaseName: "ccxpLite firefox-v${version}",
  },
  hooks: {
    "before:bump": "bun run typecheck && bun run lint && bun run format:check",
    "before:github:release": "bun run build:firefox",
  },
  npm: false,
};
