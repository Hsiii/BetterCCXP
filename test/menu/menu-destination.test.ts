import { afterEach, describe, expect, test, vi } from "vitest";

import { createSidebarModel, createSidebarShellHtml } from "../helpers/menu-fixtures.js";
import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

function setupDestination() {
  const { window } = createTestWindow(createSidebarShellHtml());
  loadModules(window, menuModulePaths);
  vi.useFakeTimers();
  window.setTimeout = globalThis.setTimeout as unknown as typeof window.setTimeout;
  window.clearTimeout = globalThis.clearTimeout as unknown as typeof window.clearTimeout;
  const runtime = requireValue(window.CCXP_LITE.sidebarRuntime);
  const document = window.document as Document;
  const link: CcxpLiteSidebarLinkItem = {
    id: "grades",
    label: "Semester Grades",
    href: "/grades",
    target: "main",
  };
  return { window, document, runtime, link };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("destination lifetime", () => {
  test("settles once and cancels the timeout on success", () => {
    const { document, runtime, link } = setupDestination();
    const status = vi.fn<(status: "loading" | "ready" | "error") => void>();
    const frame = runtime.createDestinationFrame(document, document, link, status);
    expect(frame.src).toBe("https://www.ccxp.nthu.edu.tw/grades");
    expect(frame.hidden).toBe(true);
    frame.dispatchEvent(new Event("load"));
    frame.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(9000);
    expect(status.mock.calls).toEqual([["loading"], ["ready"]]);
    expect(frame.hidden).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    runtime.disposeDestination(document);
  });

  test("times out without allowing late success, then replaces the attempt", () => {
    const { document, runtime, link } = setupDestination();
    const firstStatus = vi.fn<(status: "loading" | "ready" | "error") => void>();
    const first = runtime.createDestinationFrame(document, document, link, firstStatus);
    vi.advanceTimersByTime(8000);
    first.dispatchEvent(new Event("load"));
    expect(firstStatus.mock.calls).toEqual([["loading"], ["error"]]);
    expect(first.hidden).toBe(true);
    const nextStatus = vi.fn<(status: "loading" | "ready" | "error") => void>();
    const next = runtime.createDestinationFrame(document, document, link, nextStatus);
    first.dispatchEvent(new Event("load"));
    expect(nextStatus.mock.calls).toEqual([["loading"]]);
    next.dispatchEvent(new Event("load"));
    expect(nextStatus.mock.calls).toEqual([["loading"], ["ready"]]);
    runtime.disposeDestination(document);
  });

  test("leaving ignores old frame and legacy load events and cancels pending work", () => {
    const { document, runtime, link } = setupDestination();
    const legacy = document.createElement("frame" as string);
    legacy.setAttribute("name", "main");
    Object.defineProperty(legacy, "contentWindow", {
      value: { location: { href: "https://www.ccxp.nthu.edu.tw/redirect" } },
    });
    document.body.append(legacy);
    const status = vi.fn<(status: "loading" | "ready" | "error") => void>();
    const frame = runtime.createDestinationFrame(document, document, link, status);
    runtime.disposeDestination(document);
    runtime.disposeDestination(document);
    legacy.dispatchEvent(new Event("load"));
    frame.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(9000);
    expect(status.mock.calls).toEqual([["loading"]]);
    expect(frame.src).toBe("https://www.ccxp.nthu.edu.tw/grades");
    expect(vi.getTimerCount()).toBe(0);
  });

  test("follows a legacy redirect before settling the destination", () => {
    const { document, runtime, link } = setupDestination();
    const legacy = document.createElement("frame" as string);
    legacy.setAttribute("name", "main");
    Object.defineProperty(legacy, "contentWindow", {
      value: { location: { href: "https://www.ccxp.nthu.edu.tw/redirect" } },
    });
    document.body.append(legacy);
    const status = vi.fn<(status: "loading" | "ready" | "error") => void>();
    const frame = runtime.createDestinationFrame(document, document, link, status);
    legacy.dispatchEvent(new Event("load"));
    expect(frame.src).toBe("https://www.ccxp.nthu.edu.tw/redirect");
    expect(status.mock.calls).toEqual([["loading"]]);
    frame.dispatchEvent(new Event("load"));
    expect(status.mock.calls).toEqual([["loading"], ["ready"]]);
    runtime.disposeDestination(document);
  });

  test("extension cleanup cancels the active attempt", () => {
    const { window, document, runtime, link } = setupDestination();
    const status = vi.fn<(status: "loading" | "ready" | "error") => void>();
    const frame = runtime.createDestinationFrame(document, document, link, status);
    for (const cleanup of window.CCXP_LITE.cleanupTasks ?? []) {
      cleanup();
    }
    frame.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(9000);
    expect(status.mock.calls).toEqual([["loading"]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("sidebar retry replaces the frame and back disposes it", () => {
    const { window, document, link } = setupDestination();
    const state = requireValue(window.CCXP_LITE.sidebarState).getSidebarUiState(document);
    state.sidebarVariant = "layered";
    state.activeLeaf = link;
    const ui = requireValue(window.CCXP_LITE.sidebarUi);
    ui.renderSidebar(document, document, createSidebarModel());
    const first = requireElement(
      document.querySelector<HTMLIFrameElement>(".ccxp-lite-destination-frame"),
    );
    vi.advanceTimersByTime(8000);
    const error = requireElement(
      document.querySelector<HTMLElement>(".ccxp-lite-destination-error"),
    );
    expect(error.hidden).toBe(false);
    requireElement(
      document.querySelector<HTMLButtonElement>(".ccxp-lite-destination-action"),
    ).click();
    const next = requireElement(
      document.querySelector<HTMLIFrameElement>(".ccxp-lite-destination-frame"),
    );
    expect(next).not.toBe(first);
    next.dispatchEvent(new Event("load"));
    expect(next.hidden).toBe(false);
    requireElement(document.querySelector<HTMLButtonElement>(".ccxp-lite-back-button")).click();
    expect(document.querySelector(".ccxp-lite-destination-frame")).toBeNull();
    expect(state.activeLeaf).toBeUndefined();
    first.dispatchEvent(new Event("load"));
    next.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(9000);
    expect(document.querySelector(".ccxp-lite-destination-error")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
