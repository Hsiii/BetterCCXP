module.exports = {
  git: {
    commitMessage: "chore: release ccxpLite crx-v${version}",
    tagName: "crx-v${version}",
  },
  github: {
    assets: ["dist/crx/ccxpLite-crx-v${version}.zip"],
    autoGenerate: true,
    draft: true,
    release: true,
    releaseName: "ccxpLite crx-v${version}",
  },
  hooks: {
    "before:bump": "bun run typecheck && bun run lint && bun run format:check",
    "before:github:release": "bun run build:crx",
  },
  npm: false,
};
