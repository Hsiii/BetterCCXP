(function bootstrapBetterCcxp() {
  const TOKENS = {
    colorPrimary: "#7c2d92",
    colorAccent: "#d7a8e4",
    colorLegacyBlueText: "#2e4978",
    colorLegacyRedText: "#b85c68",
    colorBg: "#ffffff",
    colorSurface: "#ffffff",
    colorSurfaceMuted: "#f7f3fa",
    colorBorder: "rgba(103, 37, 125, 0.14)",
    colorText: "#221728",
    colorTextMuted: "#6c5a74",
    spacingXs: "6px",
    spacingSm: "10px",
    spacingMd: "16px",
    spacingLg: "24px",
    spacingXl: "32px",
    radiusMd: "14px",
    radiusLg: "20px",
    fontSans: "\"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", sans-serif",
    fontWeightRegular: "400",
    fontWeightStrong: "700",
    fontWeightHeavy: "800",
    fontSizeCaption: "12px",
    fontSizeNav: "13px",
    fontSizeUtility: "14px",
    fontSizeBody: "15px",
    fontSizePageTitle: "26px",
    fontSizeDisplay: "30px",
    sidebarClass: "better-ccxp-sidebar-shell",
    headerClass: "better-ccxp-header-shell",
    mainClass: "better-ccxp-main-skin"
  };

  const STRINGS = {
    appTitle: "NTHU 校務資訊系統",
    appSubtitle: "Better CCXP",
    emptyGroup: "此分類暫無可顯示項目"
  };

  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const FRAMESET_COLUMNS = "360,*";
  const FRAMESET_ROWS = "108,*";

  let attempts = 0;

  attachAndApply();

  function attachAndApply() {
    const frames = findFrames();

    if (!frames.top || !frames.nav || !frames.main) {
      retry();
      return;
    }

    applyFramesetLayout();
    attachFrameListener(frames.top, simplifyHeader);
    attachFrameListener(frames.nav, simplifySidebar);
    attachFrameListener(frames.main, simplifyMainFrame);
    simplifyHeader(frames.top);
    simplifySidebar(frames.nav);
    simplifyMainFrame(frames.main);
  }

  function findFrames() {
    const frameCandidates = Array.from(document.querySelectorAll("frame"));
    const top = frameCandidates.find((frame) => {
      const src = (frame.getAttribute("src") || "").toLowerCase();
      const name = (frame.getAttribute("name") || "").toLowerCase();
      return src.includes("top.php") || src.includes("top.html") || name === "top";
    });

    const nav = frameCandidates.find((frame) => {
      const src = (frame.getAttribute("src") || "").toLowerCase();
      return src.includes("in_inq_stu.php") || src.includes("in_inq_stu.html");
    });

    const main = frameCandidates.find((frame) => {
      const name = (frame.getAttribute("name") || "").toLowerCase();
      return name === "main";
    });

    return { top, nav, main };
  }

  function attachFrameListener(frame, callback) {
    if (frame.dataset.betterCcxpListenerAttached === "true") {
      return;
    }

    frame.addEventListener("load", () => callback(frame));
    frame.dataset.betterCcxpListenerAttached = "true";
  }

  function retry() {
    if (attempts >= RETRY_LIMIT) {
      return;
    }

    attempts += 1;
    window.setTimeout(attachAndApply, RETRY_DELAY_MS);
  }

  function applyFramesetLayout() {
    const topFrameset = document.querySelector("frameset[rows]");
    const innerFrameset = document.querySelector("frameset[cols]");

    if (topFrameset) {
      topFrameset.setAttribute("rows", FRAMESET_ROWS);
    }

    if (innerFrameset) {
      innerFrameset.setAttribute("cols", FRAMESET_COLUMNS);
    }
  }

  function simplifyHeader(topFrame) {
    const topDocument = topFrame.contentDocument;
    const topWindow = topFrame.contentWindow;

    if (!topDocument || !topWindow || !topDocument.body || !topDocument.head) {
      retry();
      return;
    }

    const { body } = topDocument;
    const linksCell = body.querySelector("table + table td[align='right']");
    const idleLabel = topDocument.getElementById("idle");

    if (!linksCell || !idleLabel) {
      return;
    }

    if (body.dataset.betterCcxpHeaderApplied !== "true") {
      injectBaseTokens(topDocument, "top");

      const style = topDocument.createElement("style");
      style.textContent = `
        body > *:not(.${TOKENS.headerClass}) {
          display: none !important;
        }

        .${TOKENS.headerClass} {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--better-ccxp-spacing-md);
          align-items: center;
          width: 100%;
          min-height: 108px;
          padding: 20px 28px 18px;
          background: var(--better-ccxp-surface);
          border-bottom: 1px solid var(--better-ccxp-border);
        }

        .better-ccxp-header-copy {
          min-width: 0;
        }

        .better-ccxp-header-kicker {
          color: var(--better-ccxp-type-caption-color);
          font: var(--better-ccxp-type-caption);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .better-ccxp-header-title {
          margin-top: 4px;
          color: var(--better-ccxp-type-display-color);
          font: var(--better-ccxp-type-display);
          letter-spacing: 0.03em;
        }

        .better-ccxp-header-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
          align-items: center;
        }

        .better-ccxp-header-links a,
        .better-ccxp-header-links span,
        .better-ccxp-header-links label {
          color: var(--better-ccxp-type-utility-color) !important;
          font: var(--better-ccxp-type-utility);
          text-decoration: none;
        }

        .better-ccxp-header-links a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(124, 45, 146, 0.06);
          border: 1px solid rgba(124, 45, 146, 0.1);
          border-radius: 999px;
        }

        .better-ccxp-header-links a:hover {
          background: rgba(124, 45, 146, 0.14);
        }

        .better-ccxp-header-link-icon {
          width: 14px;
          height: 14px;
          flex: 0 0 auto;
          color: currentColor;
          opacity: 0.9;
        }

      `;
      topDocument.head.appendChild(style);

      const header = topDocument.createElement("div");
      header.className = TOKENS.headerClass;
      header.innerHTML = `
        <div class="better-ccxp-header-copy">
          <div class="better-ccxp-header-kicker">${STRINGS.appSubtitle}</div>
          <div class="better-ccxp-header-title">${STRINGS.appTitle}</div>
        </div>
        <div class="better-ccxp-header-links"></div>
      `;

      const linksHost = header.querySelector(".better-ccxp-header-links");
      const sourceAnchors = Array.from(linksCell.querySelectorAll("a"));

      sourceAnchors.forEach((anchor) => {
        linksHost.appendChild(createHeaderLinkNode(topDocument, anchor));
      });
      idleLabel.remove();

      body.dataset.betterCcxpHeaderApplied = "true";
      body.appendChild(header);
      body.removeAttribute("bgcolor");
    }

    topWindow.requestAnimationFrame(() => {
      topFrame.setAttribute("scrolling", "no");
    });
  }

  function simplifySidebar(navFrame) {
    const navDocument = navFrame.contentDocument;

    if (!navDocument || !navDocument.body || !navDocument.head) {
      retry();
      return;
    }

    if (navDocument.body.dataset.betterCcxpSidebarApplied !== "true" && !isDocumentComplete(navDocument)) {
      retry();
      return;
    }

    const rawTree = parseSidebarTree(navDocument);

    if (!rawTree || !Array.isArray(rawTree.children)) {
      retry();
      return;
    }

    injectBaseTokens(navDocument, "nav");

    if (navDocument.body.dataset.betterCcxpSidebarApplied !== "true") {
      const style = navDocument.createElement("style");
      style.textContent = `
        html, body {
          background: var(--better-ccxp-bg);
        }

        .${TOKENS.sidebarClass} {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 176px minmax(0, 1fr);
          width: 100%;
          min-height: 100vh;
          height: 100vh;
          background: transparent;
          color: var(--better-ccxp-primary);
          overflow: hidden;
        }

        .better-ccxp-sidebar-primary,
        .better-ccxp-sidebar-secondary {
          box-sizing: border-box;
          min-height: 0;
          height: 100vh;
          padding: 18px 14px 20px;
        }

        .better-ccxp-sidebar-primary {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: transparent;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .better-ccxp-sidebar-primary-list,
        .better-ccxp-link-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .better-ccxp-primary-button {
          width: 100%;
          padding: 12px 10px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: var(--better-ccxp-type-nav);
          color: var(--better-ccxp-type-nav-color);
          text-align: left;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
          transition: background-color 120ms ease, color 120ms ease;
        }

        .better-ccxp-primary-button:hover {
          background: rgba(124, 45, 146, 0.06);
          color: var(--better-ccxp-type-nav-color);
        }

        .better-ccxp-primary-button.is-active {
          background: rgba(124, 45, 146, 0.12);
          color: var(--better-ccxp-type-nav-color);
        }

        .better-ccxp-sidebar-secondary {
          overflow-y: auto;
          overflow-x: hidden;
        }

        .better-ccxp-sidebar-secondary-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .better-ccxp-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .better-ccxp-section-label {
          color: var(--better-ccxp-type-section-label-color);
          font: var(--better-ccxp-type-section-label);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .better-ccxp-link-button {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 12px 10px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: var(--better-ccxp-type-nav);
          color: var(--better-ccxp-type-nav-color);
          text-align: left;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
          transition: background-color 120ms ease, color 120ms ease;
        }

        .better-ccxp-link-button:hover {
          background: rgba(124, 45, 146, 0.06);
          color: var(--better-ccxp-type-nav-color);
        }

        .better-ccxp-link-label {
          min-width: 0;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .better-ccxp-link-icon {
          width: 14px;
          height: 14px;
          color: inherit;
          opacity: 0.85;
        }

        .better-ccxp-empty {
          padding: 14px;
          border: 0;
          border-radius: 16px;
          color: var(--better-ccxp-type-body-muted-color);
          font: var(--better-ccxp-type-body-muted);
          background: rgba(124, 45, 146, 0.04);
        }
      `;
      navDocument.head.appendChild(style);

      const helperFrame = navDocument.querySelector("iframe[name='frame_7472']");
      const shell = navDocument.createElement("div");
      shell.className = TOKENS.sidebarClass;
      shell.innerHTML = `
        <aside class="better-ccxp-sidebar-primary">
          <div class="better-ccxp-sidebar-primary-list"></div>
        </aside>
        <section class="better-ccxp-sidebar-secondary">
          <div class="better-ccxp-sidebar-secondary-list"></div>
        </section>
      `;

      navDocument.body.replaceChildren(shell);

      if (helperFrame) {
        helperFrame.style.display = "none";
        navDocument.body.appendChild(helperFrame);
      }

      navDocument.body.dataset.betterCcxpSidebarApplied = "true";
    }

    const model = buildSidebarModel(rawTree, navDocument);
    renderSidebar(navDocument, model);
  }

  function simplifyMainFrame(mainFrame) {
    const mainDocument = mainFrame.contentDocument;

    if (!mainDocument || !mainDocument.head || !mainDocument.body) {
      retry();
      return;
    }

    injectBaseTokens(mainDocument, "main");

    if (mainDocument.head.querySelector("[data-better-ccxp-main='true']")) {
      return;
    }

    const style = mainDocument.createElement("style");
    style.dataset.betterCcxpMain = "true";
    style.textContent = `
      html, body {
        background: var(--better-ccxp-bg) !important;
        color: var(--better-ccxp-type-body-color) !important;
      }

      html, body, table, tbody, tr, td, th, input, select, textarea, button, a, font, div, span, p, li {
        font-family: var(--better-ccxp-font-sans) !important;
      }

      body {
        color: var(--better-ccxp-type-body-color);
        font: var(--better-ccxp-type-body);
      }

      a {
        color: var(--better-ccxp-type-primary-link-color);
        font: var(--better-ccxp-type-primary-link);
        text-decoration: none;
      }

      a:hover {
        color: var(--better-ccxp-type-primary-link-color);
        text-decoration: underline;
      }

      .td26 {
        color: var(--better-ccxp-type-page-title-color);
        font: var(--better-ccxp-type-page-title);
      }

      .td17 {
        color: var(--better-ccxp-type-body-strong-color);
        font: var(--better-ccxp-type-body-strong);
      }

      .td15,
      .opt,
      .opt1,
      li.td15,
      td[style*="color:#333344" i],
      td[style*="color: #333344" i] {
        color: var(--better-ccxp-type-body-color);
        font: var(--better-ccxp-type-body);
      }

      .td_item,
      b,
      strong {
        color: var(--better-ccxp-type-body-strong-color);
        font-weight: var(--better-ccxp-font-weight-strong);
      }

      .td_item {
        font-size: var(--better-ccxp-font-size-body);
      }

      td[style*="color:navy" i],
      td[style*="color: navy" i],
      a[style*="color:#032274" i],
      a[style*="color: #032274" i],
      a[style*="color:navy" i],
      a[style*="color: navy" i],
      font[color="#032274" i],
      font[color="navy" i],
      [color="#032274" i],
      [color="navy" i],
      [style*="color:#032274" i],
      [style*="color: #032274" i],
      [style*="color:navy" i],
      [style*="color: navy" i] {
        color: var(--better-ccxp-type-info-color) !important;
        font-weight: var(--better-ccxp-font-weight-strong) !important;
      }

      td[style*="color:#ff0000" i],
      td[style*="color: #ff0000" i],
      td[style*="color:#ff4444" i],
      td[style*="color: #ff4444" i],
      td[style*="color:red" i],
      td[style*="color: red" i],
      a[style*="color:#ff4444" i],
      a[style*="color: #ff4444" i],
      a[style*="color:#ff0000" i],
      a[style*="color: #ff0000" i],
      a[style*="color:red" i],
      a[style*="color: red" i],
      font[color="#ff4444" i],
      font[color="#ff0000" i],
      font[color="red" i],
      [color="#ff4444" i],
      [color="#ff0000" i],
      [color="red" i],
      [style*="color:#ff4444" i],
      [style*="color: #ff4444" i],
      [style*="color:#ff0000" i],
      [style*="color: #ff0000" i],
      [style*="color:red" i],
      [style*="color: red" i] {
        color: var(--better-ccxp-type-danger-color) !important;
        font-weight: var(--better-ccxp-font-weight-strong) !important;
      }

      font[size="2" i],
      [size="2" i] {
        color: var(--better-ccxp-type-caption-color) !important;
        font: var(--better-ccxp-type-caption) !important;
      }
    `;
    mainDocument.head.appendChild(style);
    mainDocument.body.classList.add(TOKENS.mainClass);
  }

  function injectBaseTokens(targetDocument, scope) {
    if (targetDocument.head.querySelector(`[data-better-ccxp-tokens='${scope}']`)) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.dataset.betterCcxpTokens = scope;
    style.textContent = `
      :root {
        --better-ccxp-primary: ${TOKENS.colorPrimary};
        --better-ccxp-accent: ${TOKENS.colorAccent};
        --better-ccxp-legacy-blue-text: ${TOKENS.colorLegacyBlueText};
        --better-ccxp-legacy-red-text: ${TOKENS.colorLegacyRedText};
        --better-ccxp-bg: ${TOKENS.colorBg};
        --better-ccxp-surface: ${TOKENS.colorSurface};
        --better-ccxp-surface-muted: ${TOKENS.colorSurfaceMuted};
        --better-ccxp-border: ${TOKENS.colorBorder};
        --better-ccxp-text: ${TOKENS.colorText};
        --better-ccxp-text-muted: ${TOKENS.colorTextMuted};
        --better-ccxp-spacing-xs: ${TOKENS.spacingXs};
        --better-ccxp-spacing-sm: ${TOKENS.spacingSm};
        --better-ccxp-spacing-md: ${TOKENS.spacingMd};
        --better-ccxp-spacing-lg: ${TOKENS.spacingLg};
        --better-ccxp-spacing-xl: ${TOKENS.spacingXl};
        --better-ccxp-radius-md: ${TOKENS.radiusMd};
        --better-ccxp-radius-lg: ${TOKENS.radiusLg};
        --better-ccxp-font-sans: ${TOKENS.fontSans};
        --better-ccxp-font-weight-regular: ${TOKENS.fontWeightRegular};
        --better-ccxp-font-weight-strong: ${TOKENS.fontWeightStrong};
        --better-ccxp-font-weight-heavy: ${TOKENS.fontWeightHeavy};
        --better-ccxp-font-size-caption: ${TOKENS.fontSizeCaption};
        --better-ccxp-font-size-nav: ${TOKENS.fontSizeNav};
        --better-ccxp-font-size-utility: ${TOKENS.fontSizeUtility};
        --better-ccxp-font-size-body: ${TOKENS.fontSizeBody};
        --better-ccxp-font-size-page-title: ${TOKENS.fontSizePageTitle};
        --better-ccxp-font-size-display: ${TOKENS.fontSizeDisplay};
        --better-ccxp-type-display: var(--better-ccxp-font-weight-heavy) var(--better-ccxp-font-size-display)/1.1 var(--better-ccxp-font-sans);
        --better-ccxp-type-display-color: var(--better-ccxp-text);
        --better-ccxp-type-page-title: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-page-title)/1.2 var(--better-ccxp-font-sans);
        --better-ccxp-type-page-title-color: var(--better-ccxp-text);
        --better-ccxp-type-primary-link: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-body)/1.5 var(--better-ccxp-font-sans);
        --better-ccxp-type-primary-link-color: var(--better-ccxp-primary);
        --better-ccxp-type-info: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-body)/1.5 var(--better-ccxp-font-sans);
        --better-ccxp-type-info-color: var(--better-ccxp-legacy-blue-text);
        --better-ccxp-type-danger: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-body)/1.5 var(--better-ccxp-font-sans);
        --better-ccxp-type-danger-color: var(--better-ccxp-legacy-red-text);
        --better-ccxp-type-body-strong: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-body)/1.55 var(--better-ccxp-font-sans);
        --better-ccxp-type-body-strong-color: var(--better-ccxp-text);
        --better-ccxp-type-body: var(--better-ccxp-font-weight-regular) var(--better-ccxp-font-size-body)/1.55 var(--better-ccxp-font-sans);
        --better-ccxp-type-body-color: var(--better-ccxp-text);
        --better-ccxp-type-body-muted: var(--better-ccxp-font-weight-regular) var(--better-ccxp-font-size-body)/1.55 var(--better-ccxp-font-sans);
        --better-ccxp-type-body-muted-color: var(--better-ccxp-text-muted);
        --better-ccxp-type-utility: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-utility)/1.4 var(--better-ccxp-font-sans);
        --better-ccxp-type-utility-color: var(--better-ccxp-primary);
        --better-ccxp-type-nav: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-nav)/1.35 var(--better-ccxp-font-sans);
        --better-ccxp-type-nav-color: var(--better-ccxp-primary);
        --better-ccxp-type-caption: var(--better-ccxp-font-weight-strong) var(--better-ccxp-font-size-caption)/1.4 var(--better-ccxp-font-sans);
        --better-ccxp-type-caption-color: var(--better-ccxp-text-muted);
        --better-ccxp-type-section-label: var(--better-ccxp-font-weight-heavy) var(--better-ccxp-font-size-caption)/1.4 var(--better-ccxp-font-sans);
        --better-ccxp-type-section-label-color: var(--better-ccxp-primary);
      }

      html, body {
        margin: 0;
        padding: 0;
        font-family: var(--better-ccxp-font-sans);
        color: var(--better-ccxp-text);
      }

      * {
        box-sizing: border-box;
      }
    `;
    targetDocument.head.appendChild(style);
  }

  function buildSidebarModel(root, navDocument) {
    const rootChildren = root.children || [];
    const topLevelGroups = rootChildren
      .map((entry, index) => normalizeRootEntry(entry, index, navDocument))
      .filter(Boolean);

    return {
      groups: topLevelGroups,
      initialGroupId: topLevelGroups[0] ? topLevelGroups[0].id : null
    };
  }

  function normalizeRootEntry(entryNode, index, navDocument) {
    if (!entryNode) {
      return null;
    }

    if (entryNode.children) {
      return normalizeTopLevelGroup(entryNode, index, navDocument);
    }

    const linkItem = normalizeLinkItem(entryNode, navDocument);
    if (!linkItem) {
      return null;
    }

    return {
      id: `link-${index}`,
      label: linkItem.label,
      directLinks: [linkItem],
      sections: [],
      kind: "link"
    };
  }

  function normalizeTopLevelGroup(folderNode, index, navDocument) {
    const directLinks = [];
    const sections = [];

    (folderNode.children || []).forEach((childNode) => {
      if (childNode && childNode.children) {
        sections.push({
          id: `section-${index}-${sections.length}`,
          label: toPlainText(childNode.desc, navDocument),
          links: collectLinks(childNode, navDocument)
        });
        return;
      }

      const linkItem = normalizeLinkItem(childNode, navDocument);
      if (linkItem) {
        directLinks.push(linkItem);
      }
    });

    return {
      id: `group-${index}`,
      label: toPlainText(folderNode.desc, navDocument),
      directLinks,
      sections: sections.filter((section) => section.links.length > 0),
      kind: "group"
    };
  }

  function collectLinks(folderNode, navDocument) {
    const links = [];

    (folderNode.children || []).forEach((childNode) => {
      if (childNode && childNode.children) {
        links.push(...collectLinks(childNode, navDocument));
        return;
      }

      const linkItem = normalizeLinkItem(childNode, navDocument);
      if (linkItem) {
        links.push(linkItem);
      }
    });

    return links;
  }

  function normalizeLinkItem(itemNode, navDocument) {
    if (!itemNode || typeof itemNode.link !== "string") {
      return null;
    }

    const parsedLink = parseLegacyLink(itemNode.link);

    if (!parsedLink.href) {
      return null;
    }

    const rawHtml = String(itemNode.desc || "");
    return {
      label: toPlainText(rawHtml, navDocument),
      href: parsedLink.href,
      target: parsedLink.target,
      clickLinkArgs: parseClickLinkArgs(rawHtml)
    };
  }

  function parseLegacyLink(rawLink) {
    const hrefMatch = rawLink.match(/^'([^']+)'/);
    const targetMatch = rawLink.match(/target="?([^"\s]+)"?/i);

    return {
      href: hrefMatch ? hrefMatch[1] : "",
      target: targetMatch ? targetMatch[1] : "main"
    };
  }

  function parseClickLinkArgs(rawHtml) {
    const match = rawHtml.match(/ClickLink\("([^"]+)","([^"]+)"\)/);
    if (!match) {
      return null;
    }

    return {
      name: match[1],
      url: match[2]
    };
  }

  function toPlainText(rawHtml, navDocument) {
    if (!rawHtml) {
      return "";
    }

    const scratch = navDocument.createElement("div");
    scratch.innerHTML = String(rawHtml);
    return (scratch.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function renderSidebar(navFrame, model) {
    const shell = navFrame.querySelector(`.${TOKENS.sidebarClass}`);

    if (!shell) {
      return;
    }

    const primaryList = shell.querySelector(".better-ccxp-sidebar-primary-list");
    const secondaryList = shell.querySelector(".better-ccxp-sidebar-secondary-list");

    if (!primaryList || !secondaryList) {
      return;
    }

    let activeGroupId =
      shell.dataset.activeGroupId && model.groups.some((group) => group.id === shell.dataset.activeGroupId)
        ? shell.dataset.activeGroupId
        : model.initialGroupId;

    const renderActiveState = () => {
      primaryList.innerHTML = "";
      model.groups.forEach((group) => {
        const button = navFrame.createElement("button");
        button.type = "button";
        button.className = `better-ccxp-primary-button${group.id === activeGroupId ? " is-active" : ""}`;
        button.textContent = group.label;
        button.addEventListener("click", () => {
          activeGroupId = group.id;
          shell.dataset.activeGroupId = group.id;
          renderActiveState();
        });
        primaryList.appendChild(button);
      });

      const activeGroup = model.groups.find((group) => group.id === activeGroupId) || model.groups[0];

      if (!activeGroup) {
        secondaryList.innerHTML = `<div class="better-ccxp-empty">${STRINGS.emptyGroup}</div>`;
        return;
      }

      secondaryList.innerHTML = "";

      const flatLinks = [
        ...activeGroup.directLinks,
        ...activeGroup.sections.flatMap((section) => section.links)
      ];

      if (flatLinks.length > 0) {
        secondaryList.appendChild(createSection(navFrame, "", flatLinks));
      }

      if (secondaryList.children.length === 0) {
        secondaryList.innerHTML = `<div class="better-ccxp-empty">${STRINGS.emptyGroup}</div>`;
      }
    };

    renderActiveState();
  }

  function createSection(targetDocument, label, links) {
    const section = targetDocument.createElement("section");
    section.className = "better-ccxp-section";

    if (label) {
      const sectionLabel = targetDocument.createElement("div");
      sectionLabel.className = "better-ccxp-section-label";
      sectionLabel.textContent = label;
      section.appendChild(sectionLabel);
    }

    const linkList = targetDocument.createElement("div");
    linkList.className = "better-ccxp-link-list";

    links.forEach((linkItem) => {
      const button = targetDocument.createElement("button");
      button.type = "button";
      button.className = "better-ccxp-link-button";

      const label = targetDocument.createElement("span");
      label.className = "better-ccxp-link-label";
      label.textContent = linkItem.label;
      button.appendChild(label);

      button.addEventListener("click", () => {
        activateLegacyLink(linkItem, targetDocument);
      });

      if (isExternalLinkTarget(linkItem.target)) {
        button.appendChild(createExternalLinkIcon(targetDocument));
      }

      linkList.appendChild(button);
    });

    section.appendChild(linkList);
    return section;
  }

  function activateLegacyLink(linkItem, navDocument) {
    if (linkItem.clickLinkArgs) {
      const helperFrame = navDocument.querySelector("iframe[name='frame_7472']");
      const helperUrl = new URL("JH/JH01.php", navDocument.location.href);
      helperUrl.searchParams.set("ACIXSTORE", readAcixstore(navDocument.location.href));
      helperUrl.searchParams.set("name", linkItem.clickLinkArgs.name);
      helperUrl.searchParams.set("url", linkItem.clickLinkArgs.url);

      if (helperFrame && helperFrame.contentWindow) {
        helperFrame.contentWindow.location.replace(helperUrl.toString());
      } else if (helperFrame) {
        helperFrame.setAttribute("src", helperUrl.toString());
      }
    }

    const resolvedUrl = new URL(linkItem.href, navDocument.location.href).toString();
    const normalizedTarget = (linkItem.target || "main").toLowerCase();

    if (normalizedTarget === "_blank") {
      window.open(resolvedUrl, "_blank", "noopener");
      return;
    }

    if (normalizedTarget === "_top") {
      window.top.location.href = resolvedUrl;
      return;
    }

    if (normalizedTarget === "main" && window.top && window.top.frames && window.top.frames.main) {
      window.top.frames.main.location.href = resolvedUrl;
      return;
    }

    window.location.href = resolvedUrl;
  }

  function isExternalLinkTarget(target) {
    return (target || "main").toLowerCase() === "_blank";
  }

  function createExternalLinkIcon(targetDocument) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "better-ccxp-link-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    [
      "M15 3h6v6",
      "M10 14 21 3",
      "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
    ].forEach((pathData) => {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.appendChild(path);
    });

    return icon;
  }

  function createHeaderLinkNode(targetDocument, anchor) {
    const clone = anchor.cloneNode(true);

    if ((anchor.getAttribute("target") || "main").toLowerCase() !== "_blank") {
      return clone;
    }

    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "better-ccxp-header-link-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    [
      "M15 3h6v6",
      "M10 14 21 3",
      "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
    ].forEach((pathData) => {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.appendChild(path);
    });

    clone.appendChild(icon);
    return clone;
  }

  function parseSidebarTree(navDocument) {
    const statements = Array.from(navDocument.scripts)
      .map((script) => script.textContent || "")
      .join("\n")
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    const nodes = new Map();
    const root = { desc: "", children: [] };
    nodes.set("foldersTree", root);

    const stringPattern = "\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'";
    const rootRegex = new RegExp(`^foldersTree\\s*=\\s*gFld\\s*\\(\\s*(${stringPattern})\\s*,\\s*(${stringPattern})\\s*\\)$`);
    const folderRegex = new RegExp(`^(\\w+)\\s*=\\s*insFld\\s*\\(\\s*(\\w+)\\s*,\\s*gFld\\s*\\(\\s*(${stringPattern})\\s*,\\s*(${stringPattern})\\s*\\)\\s*\\)$`);
    const docRegex = new RegExp(`^insDoc\\s*\\(\\s*(\\w+)\\s*,\\s*gLnk\\s*\\(\\s*([^,]+?)\\s*,\\s*(${stringPattern})\\s*,\\s*(${stringPattern})\\s*\\)\\s*\\)$`);

    statements.forEach((statement) => {
      const rootMatch = statement.match(rootRegex);
      if (rootMatch) {
        root.desc = parseJsStringLiteral(rootMatch[1]);
        return;
      }

      const folderMatch = statement.match(folderRegex);
      if (folderMatch) {
        const [, variableName, parentName, descLiteral] = folderMatch;
        const folderNode = {
          desc: parseJsStringLiteral(descLiteral),
          children: []
        };
        nodes.set(variableName, folderNode);
        const parentNode = nodes.get(parentName);
        if (parentNode) {
          parentNode.children.push(folderNode);
        }
        return;
      }

      const docMatch = statement.match(docRegex);
      if (docMatch) {
        const [, parentName, targetToken, descLiteral, hrefLiteral] = docMatch;
        const parentNode = nodes.get(parentName);
        if (!parentNode) {
          return;
        }

        parentNode.children.push({
          desc: parseJsStringLiteral(descLiteral),
          link: buildLegacyLinkString(targetToken.trim(), parseJsStringLiteral(hrefLiteral))
        });
      }
    });

    return root.children.length > 0 ? root : null;
  }

  function parseJsStringLiteral(literal) {
    const quote = literal[0];
    const inner = literal.slice(1, -1);

    if (quote === "\"") {
      return JSON.parse(literal);
    }

    return inner
      .replace(/\\\\/g, "\\")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, "\"")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t");
  }

  function buildLegacyLinkString(targetToken, href) {
    const normalizedTarget = targetToken === "1" ? "_blank" : "main";
    return `'${href}' target="${normalizedTarget}"`;
  }

  function readAcixstore(locationHref) {
    const url = new URL(locationHref);
    return url.searchParams.get("ACIXSTORE") || "";
  }

  function isDocumentComplete(targetDocument) {
    return targetDocument.readyState === "complete";
  }
})();
