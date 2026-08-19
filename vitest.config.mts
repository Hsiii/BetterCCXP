import type { UserConfig } from "vitest/config";

export default {
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
    clearMocks: true,
    maxWorkers: 2,
  },
} satisfies UserConfig;
