import { copyFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(projectRoot, "src");
const distDir = join(projectRoot, "dist");
const outputZip = join(distDir, "ccxpLite.zip");
const stagingDir = mkdtempSync(join(tmpdir(), "ccxp-lite-build-"));
const filesToPack = ["manifest.json", "content.js"];

try {
  mkdirSync(distDir, { recursive: true });
  rmSync(outputZip, { force: true });

  for (const fileName of filesToPack) {
    const sourcePath = join(srcDir, fileName);

    if (!existsSync(sourcePath)) {
      throw new Error(`Missing required source file: ${sourcePath}`);
    }

    copyFileSync(sourcePath, join(stagingDir, fileName));
  }

  const zipResult = spawnSync("zip", ["-q", "-r", outputZip, ...filesToPack], {
    cwd: stagingDir,
    stdio: "inherit"
  });

  if (zipResult.status !== 0) {
    throw new Error("zip command failed");
  }

  process.stdout.write(`Built ${outputZip}\n`);
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
