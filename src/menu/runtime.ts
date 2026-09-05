(function registerCcxpLiteSidebarRuntime(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { shared, sidebarState } = namespace;
  if (!shared || !sidebarState) {
    return;
  }
  const { TOKENS, ensureThemeDocument, cleanLegacyAttributes } = shared;
  const { getSidebarUiState, persistSidebarScroll } = sidebarState;
  const INITIAL_MAIN_URL_STORAGE_KEY =
    "ccxp-lite-sidebar-initial-main-url::/ccxp/INQUIRE/select_entry.php";
  const DESTINATION_LOAD_TIMEOUT_MS = 8000;
  const EXTERNAL_LINK_PATH_PREFIXES = ["/ccxp/INQUIRE/PE/1/14D/"] as const;
  const destinationDisposers = new Map<Document, () => void>();
  shared.addCleanupTask(() => {
    for (const dispose of destinationDisposers.values()) {
      dispose();
    }
    destinationDisposers.clear();
  });

  function disposeDestination(targetDocument: Document) {
    destinationDisposers.get(targetDocument)?.();
    destinationDisposers.delete(targetDocument);
  }

  function createDestinationFrame(
    targetDocument: Document,
    navDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    onStatus: (status: "loading" | "ready" | "error") => void,
  ) {
    disposeDestination(targetDocument);
    const frame = targetDocument.createElement("iframe");
    frame.className = "ccxp-lite-destination-frame";
    frame.setAttribute("frameborder", "0");
    frame.setAttribute("scrolling", "auto");
    frame.setAttribute("allowTransparency", "true");
    frame.title = linkItem.label;
    const legacyMainFrame = getLegacyMainFrame();
    let disposed = false;
    let status: "loading" | "ready" | "error" = "loading";
    const stopWaiting = () => {
      globalThis.clearTimeout(timeoutId);
      legacyMainFrame?.removeEventListener("load", syncFromLegacyMainFrame);
    };
    const settle = (nextStatus: "ready" | "error") => {
      if (disposed || status !== "loading") {
        return;
      }
      status = nextStatus;
      stopWaiting();
      frame.hidden = nextStatus !== "ready";
      onStatus(nextStatus);
    };
    const onLoad = () => {
      if (disposed || status === "error") {
        return;
      }
      try {
        simplifyEmbeddedFrame(frame);
      } catch {
        // Cross-origin destinations can load without allowing theme access.
      }
      settle("ready");
    };
    const syncFromLegacyMainFrame = () => {
      if (disposed || status !== "loading" || !legacyMainFrame) {
        return;
      }
      try {
        const legacyHref = legacyMainFrame.contentWindow?.location.href ?? "";
        if (legacyHref !== "" && legacyHref !== "about:blank" && frame.src !== legacyHref) {
          frame.src = legacyHref;
          return;
        }
        if (frame.contentDocument?.readyState === "complete") {
          onLoad();
        }
      } catch {
        // Rely on the destination load event when frame access is unavailable.
      }
    };
    const timeoutId = globalThis.setTimeout(
      () => {
        settle("error");
      },
      DESTINATION_LOAD_TIMEOUT_MS,
      undefined,
    );
    frame.addEventListener("load", onLoad);
    legacyMainFrame?.addEventListener("load", syncFromLegacyMainFrame, { once: true });
    destinationDisposers.set(targetDocument, () => {
      disposed = true;
      stopWaiting();
      frame.removeEventListener("load", onLoad);
    });
    frame.hidden = true;
    onStatus("loading");
    activateLegacyLink(linkItem, navDocument, frame);
    return frame;
  }

  function shouldOpenLeafInDestination(linkItem: CcxpLiteSidebarLinkItem, navDocument: Document) {
    if ((linkItem.target ?? "main").toLowerCase() !== "main") {
      return false;
    }
    const resolvedUrl = resolveLeafUrl(linkItem, navDocument);
    if (resolvedUrl === "") {
      return false;
    }
    return !isExternalLinkOnlyRoute(resolvedUrl);
  }

  function openLeafDestination(
    targetDocument: Document,
    navDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    rerender: () => void,
  ) {
    if (!shouldOpenLeafInDestination(linkItem, navDocument)) {
      openLeafInNewTab(linkItem, navDocument);
      return;
    }
    const state = getSidebarUiState(targetDocument);
    const legacyMainFrame = getLegacyMainFrame();
    if (state.sidebarVariant === "classic" && legacyMainFrame) {
      activateLegacyLink(linkItem, navDocument, legacyMainFrame);
      return;
    }
    persistSidebarScroll(targetDocument, "category");
    state.activeLeaf = {
      id: linkItem.id,
      label: linkItem.label,
      href: linkItem.href,
      target: linkItem.target,
      clickLinkArgs: linkItem.clickLinkArgs,
      nonce: Date.now(),
    };
    captureInitialMainFrameUrl();
    rerender();
  }

  function simplifyEmbeddedFrame(frame: HTMLIFrameElement) {
    const frameDocument = frame.contentDocument;
    if (!frameDocument) {
      return;
    }
    ensureThemeDocument(frameDocument, "main");
    cleanLegacyAttributes(frameDocument);
    frameDocument.body.classList.add(TOKENS.mainClass);
    // Force a style override as a last resort.
    frameDocument.body.style.setProperty("background-image", "none", "important");
    frameDocument.body.style.setProperty("background-color", "var(--ccxp-lite-bg)", "important");
  }

  function captureInitialMainFrameUrl() {
    const storage = getScopedSessionStorage();
    if (!storage) {
      return;
    }
    try {
      if (storage.getItem(INITIAL_MAIN_URL_STORAGE_KEY) !== null) {
        return;
      }
    } catch {
      return;
    }
    const currentUrl = readInitialFrameHref();
    if (currentUrl === "") {
      return;
    }
    try {
      storage.setItem(INITIAL_MAIN_URL_STORAGE_KEY, currentUrl);
    } catch {
      // Ignore session storage failures.
    }
  }

  function getScopedSessionStorage() {
    try {
      return (window.top ?? globalThis).sessionStorage;
    } catch {
      return undefined;
    }
  }

  function openLeafInNewTab(activeLeaf: CcxpLiteSidebarLinkItem, navDocument: Document) {
    const resolvedUrl = resolveLeafUrl(activeLeaf, navDocument);
    window.open(resolvedUrl, "_blank", "noopener");
  }

  function readInitialFrameHref() {
    try {
      const frame = getLegacyMainFrame();
      if (!frame) {
        return "";
      }
      const scopeDocument = window.top ? window.top.document : document;
      const src = frame.getAttribute("src") ?? "";
      return src === "" ? "" : new URL(src, scopeDocument.location.href).toString();
    } catch {
      return "";
    }
  }

  function getLegacyMainFrame() {
    try {
      const scopeDocument = window.top ? window.top.document : document;
      return (
        scopeDocument.querySelector<HTMLIFrameElement>("frame[name='main']") ??
        scopeDocument.querySelector<HTMLIFrameElement>("frame[name='ccxp-lite-legacy-main']") ??
        undefined
      );
    } catch {
      return undefined;
    }
  }

  function activateLegacyLink(
    linkItem: CcxpLiteSidebarLinkItem,
    navDocument: Document,
    destinationFrame?: HTMLIFrameElement,
  ) {
    if (linkItem.clickLinkArgs) {
      const helperFrame = navDocument.querySelector<HTMLIFrameElement>("iframe[name='frame_7472']");
      const helperUrl = new URL("JH/JH01.php", navDocument.location.href);
      helperUrl.searchParams.set("ACIXSTORE", readAcixstore(navDocument.location.href));
      helperUrl.searchParams.set("name", linkItem.clickLinkArgs.name);
      helperUrl.searchParams.set("url", linkItem.clickLinkArgs.url);
      if (helperFrame && helperFrame.contentWindow) {
        const helperWindow = helperFrame.contentWindow;
        helperWindow.location.replace(helperUrl.toString());
      } else if (helperFrame) {
        helperFrame.setAttribute("src", helperUrl.toString());
      }
    }
    const resolvedUrl = resolveLeafUrl(linkItem, navDocument);
    const normalizedTarget = (linkItem.target ?? "main").toLowerCase();
    const resolvedDestinationFrame =
      normalizedTarget === "main" ? (destinationFrame ?? getLegacyMainFrame()) : destinationFrame;
    if (normalizedTarget === "_blank") {
      window.open(resolvedUrl, "_blank", "noopener");
      return;
    }
    if (normalizedTarget === "_top") {
      if (window.top) {
        window.top.location.href = resolvedUrl;
        return;
      }
      globalThis.location.href = resolvedUrl;
      return;
    }
    if (normalizedTarget === "main" && resolvedDestinationFrame) {
      resolvedDestinationFrame.src = resolvedUrl;
      return;
    }
    globalThis.location.href = resolvedUrl;
  }

  function isExternalLinkTarget(linkItem: CcxpLiteSidebarLinkItem | string, navDocument: Document) {
    const normalizedTarget =
      typeof linkItem === "string"
        ? linkItem.toLowerCase()
        : (linkItem.target ?? "main").toLowerCase();
    if (normalizedTarget === "_blank") {
      return true;
    }
    if (typeof linkItem === "string") {
      return false;
    }
    const resolvedUrl = resolveLeafUrl(linkItem, navDocument);
    return isExternalLinkOnlyRoute(resolvedUrl);
  }

  function resolveLeafUrl(linkItem: CcxpLiteSidebarLinkItem, navDocument: Document) {
    return new URL(linkItem.href ?? "", navDocument.location.href).toString();
  }

  function isExternalLinkOnlyRoute(resolvedUrl: string) {
    try {
      const url = new URL(resolvedUrl);
      return EXTERNAL_LINK_PATH_PREFIXES.some((pathPrefix) => url.pathname.startsWith(pathPrefix));
    } catch {
      return false;
    }
  }

  function readAcixstore(locationHref: string) {
    const url = new URL(locationHref);
    return url.searchParams.get("ACIXSTORE") ?? "";
  }
  namespace.sidebarRuntime = {
    INITIAL_MAIN_URL_STORAGE_KEY,
    shouldOpenLeafInDestination,
    openLeafDestination,
    createDestinationFrame,
    disposeDestination,
    getLegacyMainFrame,
    captureInitialMainFrameUrl,
    openLeafInNewTab,
    activateLegacyLink,
    isExternalLinkTarget,
  };
})(globalThis);
