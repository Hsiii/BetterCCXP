import { describe, expect, test, vi } from "vitest";

import { createLoginHtml } from "../helpers/login-fixtures.js";
import { createTestWindow, loadModules } from "../helpers/module-loader.js";

const loginBootstrapModulePaths = [
  "src/shared/constants.ts",
  "src/shared/locale.ts",
  "src/shared/theme.ts",
  "src/shared/brand.ts",
  "src/shared/dom.ts",
  "src/shared/analytics.ts",
  "src/login/locale.ts",
  "src/login/ui/support.ts",
  "src/login/ui/tabs.ts",
  "src/login/auth/validation.ts",
  "src/login/ui/login.ts",
  "src/login/auth/captcha.ts",
  "src/login/pipeline/identify.ts",
  "src/login/pipeline/rewrite.ts",
  "src/login/pipeline/style.ts",
  "src/login/pipeline/bootstrap.ts",
  "src/main/bootstrap.ts",
];

describe("main bootstrap login path", () => {
  test("keeps legacy frames hidden until the sidebar is applied", async () => {
    const { window } = createTestWindow(
      undefined,
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php",
    );
    const document = window.document as unknown as Document;
    // The production shell uses deprecated frames; Happy DOM cannot parse their markup.
    /* eslint-disable @typescript-eslint/no-deprecated */
    const frameset = document.createElement("frameset");
    const navFrame = document.createElement("frame");
    const mainFrame = document.createElement("frame");
    /* eslint-enable @typescript-eslint/no-deprecated */
    frameset.setAttribute("cols", "200,*");
    navFrame.setAttribute("name", "nav");
    mainFrame.setAttribute("name", "main");
    frameset.append(navFrame, mainFrame);
    document.body.replaceWith(frameset);
    const FrameEvent = window.Event as unknown as typeof Event;

    const { window: navWindow } = createTestWindow("<body>Legacy navigation</body>");
    const { window: mainWindow } = createTestWindow("<body>Legacy main content</body>");
    const navDocument = navWindow.document as unknown as Document;
    Object.defineProperty(navFrame, "contentDocument", { value: navDocument });
    Object.defineProperty(mainFrame, "contentDocument", { value: mainWindow.document });
    window.requestAnimationFrame = vi.fn(() => 1) as unknown as typeof window.requestAnimationFrame;
    let sidebarReady = false;
    window.CCXP_LITE.sidebar = {
      simplifySidebar: () => {
        if (sidebarReady) {
          navDocument.body.dataset.ccxpLiteSidebarApplied = "true";
        }
      },
    };

    loadModules(window, loginBootstrapModulePaths);

    expect(document.querySelector("body")).toBeNull();
    expect(window.getComputedStyle(navFrame).visibility).toBe("hidden");
    expect(window.getComputedStyle(mainFrame).visibility).toBe("hidden");
    mainFrame.dispatchEvent(new FrameEvent("load"));
    expect(window.getComputedStyle(navFrame).visibility).toBe("hidden");

    sidebarReady = true;
    navFrame.dispatchEvent(new FrameEvent("load"));
    expect(document.documentElement.dataset.ccxpLiteLoadingReady).toBe("true");
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(window.getComputedStyle(navFrame).visibility).not.toBe("hidden");
    expect(window.getComputedStyle(mainFrame).visibility).not.toBe("hidden");
  });

  test("rewrites the login page without requiring sidebar registration", async () => {
    const { window } = createTestWindow(
      createLoginHtml(),
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/",
    );
    window.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error("captcha fetch disabled in test"),
      ) as unknown as typeof window.fetch;

    loadModules(window, loginBootstrapModulePaths);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const document = window.document as unknown as Document;
    const body = document.body as HTMLBodyElement;
    const landingShell = document.querySelector("main.ccxp-lite-landing-shell");

    expect(body.dataset.ccxpLiteLandingApplied).toBe("true");
    expect(landingShell).not.toBeNull();
  });

  test("rewrites the login page when bootstrap starts before the form is parsed", async () => {
    const { window } = createTestWindow(
      "<!doctype html><html lang='zh'><head></head><body></body></html>",
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/",
    );
    window.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error("captcha fetch disabled in test"),
      ) as unknown as typeof window.fetch;

    let readyState: DocumentReadyState = "loading";
    Object.defineProperty(window.document, "readyState", {
      configurable: true,
      get: () => readyState,
    });

    loadModules(window, loginBootstrapModulePaths);

    const parsedDocument = new window.DOMParser().parseFromString(
      createLoginHtml(),
      "text/html",
    ) as unknown as Document;
    const document = window.document as unknown as Document;
    const targetBody = document.body as HTMLBodyElement;
    const replacementBody = parsedDocument.body.cloneNode(true) as HTMLBodyElement;
    targetBody.replaceChildren(...replacementBody.childNodes);
    readyState = "complete";

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });

    const body = document.body as HTMLBodyElement;
    const landingShell = document.querySelector("main.ccxp-lite-landing-shell");

    expect(body.dataset.ccxpLiteLandingApplied).toBe("true");
    expect(landingShell).not.toBeNull();
  });

  test("skins standalone inquire pages when they open outside the frameset", async () => {
    const { window } = createTestWindow(
      "<!doctype html><html lang='zh'><head></head><body><main>Standalone page</main></body></html>",
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/JH/B/B.2/B.2.3/JHB23001.php?ACIXSTORE=test",
    );

    loadModules(window, loginBootstrapModulePaths);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const document = window.document as unknown as Document;
    const body = document.body as HTMLBodyElement;

    expect(body.classList.contains("ccxp-lite-main-skin")).toBe(true);
    expect(body.style.getPropertyValue("background-image")).toBe("none");
    expect(body.style.getPropertyValue("background-color")).toBe("var(--ccxp-lite-bg)");
  });
});
