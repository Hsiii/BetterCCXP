module.exports = {
  git: {
    commitMessage: "chore: release ccxpLite v${version}",
    tagName: "v${version}",
  },
  github: {
    assets: [
      "dist/crx/ccxpLite-crx-v${version}.zip",
      "dist/firefox/ccxpLite-firefox-v${version}.xpi",
      "dist/firefox/ccxpLite-firefox-v${version}-sources.zip",
    ],
    autoGenerate: true,
    draft: true,
    release: true,
    releaseName: "ccxpLite v${version}",
  },
  hooks: {
    "before:bump": "bun run typecheck && bun run lint && bun run format:check",
    "before:github:release": "bun run build",
  },
  npm: {
    publish: false,
  },
};
