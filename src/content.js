(function bootstrapBetterCcxp() {
  const TOKENS = {
    colorPrimary: "#7c2d92",
    colorPrimaryStrong: "#5e1f71",
    colorAccent: "#d7a8e4",
    colorBg: "#ffffff",
    colorSurface: "#ffffff",
    colorSurfaceMuted: "#f7f3fa",
    colorBorder: "rgba(103, 37, 125, 0.14)",
    colorText: "#221728",
    colorTextMuted: "#6c5a74",
    colorShadow: "rgba(65, 21, 81, 0.12)",
    spacingXs: "6px",
    spacingSm: "10px",
    spacingMd: "16px",
    spacingLg: "24px",
    spacingXl: "32px",
    radiusMd: "14px",
    radiusLg: "20px",
    fontSans: "\"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", sans-serif",
    sidebarClass: "better-ccxp-sidebar-shell",
    headerClass: "better-ccxp-header-shell",
    mainClass: "better-ccxp-main-skin"
  };

  const STRINGS = {
    appTitle: "NTHU 校務資訊系統",
    appSubtitle: "Better CCXP",
    linksSection: "常用入口",
    menuSection: "功能選單",
    shortcutsGroup: "快捷",
    emptyGroup: "此分類暫無可顯示項目"
  };

  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const FRAMESET_COLUMNS = "360,*";
  const FRAMESET_ROWS = "108,*";
  const NAV_TREE_DATA_ID = "better-ccxp-nav-tree-data";
  const NAV_BRIDGE_ATTR = "data-better-ccxp-nav-bridge";

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
          color: var(--better-ccxp-text-muted);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .better-ccxp-header-title {
          margin-top: 4px;
          color: var(--better-ccxp-text);
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 0.03em;
          line-height: 1.1;
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
          color: var(--better-ccxp-primary) !important;
          font-size: 14px !important;
          font-weight: 700;
          text-decoration: none;
        }

        .better-ccxp-header-links a {
          padding: 8px 12px;
          background: rgba(124, 45, 146, 0.06);
          border: 1px solid rgba(124, 45, 146, 0.1);
          border-radius: 999px;
        }

        .better-ccxp-header-links a:hover {
          background: rgba(124, 45, 146, 0.14);
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
        linksHost.appendChild(anchor.cloneNode(true));
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

    ensureNavBridge(navDocument);

    const rawTree = readNavTreeData(navDocument);

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
          grid-template-columns: 112px minmax(0, 1fr);
          width: 100%;
          min-height: 100vh;
          background: transparent;
          color: var(--better-ccxp-text);
        }

        .better-ccxp-sidebar-primary,
        .better-ccxp-sidebar-secondary {
          box-sizing: border-box;
          min-height: 100vh;
          padding: 18px 14px 20px;
        }

        .better-ccxp-sidebar-primary {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-right: 1px solid var(--better-ccxp-border);
          background: var(--better-ccxp-surface);
        }

        .better-ccxp-sidebar-primary-title {
          color: var(--better-ccxp-text-muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .better-ccxp-sidebar-primary-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .better-ccxp-primary-button {
          width: 100%;
          padding: 12px 10px;
          border: 1px solid transparent;
          border-radius: 16px;
          background: transparent;
          color: var(--better-ccxp-text-muted);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
          text-align: left;
          transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease;
        }

        .better-ccxp-primary-button:hover {
          background: rgba(124, 45, 146, 0.06);
          color: var(--better-ccxp-text);
          transform: translateY(-1px);
        }

        .better-ccxp-primary-button.is-active {
          background: rgba(124, 45, 146, 0.12);
          border-color: rgba(124, 45, 146, 0.12);
          color: var(--better-ccxp-primary-strong);
          box-shadow: 0 12px 24px rgba(124, 45, 146, 0.1);
        }

        .better-ccxp-sidebar-secondary {
          overflow: auto;
        }

        .better-ccxp-sidebar-secondary-header {
          margin-bottom: 16px;
        }

        .better-ccxp-sidebar-secondary-heading {
          color: var(--better-ccxp-text);
          font-size: 18px;
          font-weight: 800;
          line-height: 1.2;
        }

        .better-ccxp-sidebar-secondary-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .better-ccxp-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .better-ccxp-section-label {
          color: var(--better-ccxp-text-muted);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .better-ccxp-link-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .better-ccxp-link-button {
          display: block;
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--better-ccxp-border);
          border-radius: 16px;
          background: var(--better-ccxp-surface);
          color: var(--better-ccxp-text);
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.45;
          text-align: left;
          box-shadow: 0 12px 30px var(--better-ccxp-shadow);
          transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
        }

        .better-ccxp-link-button:hover {
          border-color: rgba(124, 45, 146, 0.22);
          transform: translateY(-1px);
          box-shadow: 0 18px 36px rgba(65, 21, 81, 0.16);
        }

        .better-ccxp-link-target {
          display: block;
          margin-top: 4px;
          color: var(--better-ccxp-text-muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .better-ccxp-empty {
          padding: 14px;
          border: 1px dashed var(--better-ccxp-border);
          border-radius: 16px;
          color: var(--better-ccxp-text-muted);
          font-size: 13px;
          line-height: 1.5;
          background: rgba(255, 255, 255, 0.6);
        }
      `;
      navDocument.head.appendChild(style);

      const helperFrame = navDocument.querySelector("iframe[name='frame_7472']");
      const shell = navDocument.createElement("div");
      shell.className = TOKENS.sidebarClass;
      shell.innerHTML = `
        <aside class="better-ccxp-sidebar-primary">
          <div class="better-ccxp-sidebar-primary-title">${STRINGS.menuSection}</div>
          <div class="better-ccxp-sidebar-primary-list"></div>
        </aside>
        <section class="better-ccxp-sidebar-secondary">
          <div class="better-ccxp-sidebar-secondary-header">
            <div class="better-ccxp-sidebar-secondary-heading"></div>
          </div>
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
        color: var(--better-ccxp-text) !important;
      }

      html, body, table, tbody, tr, td, th, input, select, textarea, button, a, font, div, span, p, li {
        font-family: var(--better-ccxp-font-sans) !important;
      }

      body {
        line-height: 1.55;
      }

      a {
        color: var(--better-ccxp-primary);
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
        --better-ccxp-primary-strong: ${TOKENS.colorPrimaryStrong};
        --better-ccxp-accent: ${TOKENS.colorAccent};
        --better-ccxp-bg: ${TOKENS.colorBg};
        --better-ccxp-surface: ${TOKENS.colorSurface};
        --better-ccxp-surface-muted: ${TOKENS.colorSurfaceMuted};
        --better-ccxp-border: ${TOKENS.colorBorder};
        --better-ccxp-text: ${TOKENS.colorText};
        --better-ccxp-text-muted: ${TOKENS.colorTextMuted};
        --better-ccxp-shadow: ${TOKENS.colorShadow};
        --better-ccxp-spacing-xs: ${TOKENS.spacingXs};
        --better-ccxp-spacing-sm: ${TOKENS.spacingSm};
        --better-ccxp-spacing-md: ${TOKENS.spacingMd};
        --better-ccxp-spacing-lg: ${TOKENS.spacingLg};
        --better-ccxp-spacing-xl: ${TOKENS.spacingXl};
        --better-ccxp-radius-md: ${TOKENS.radiusMd};
        --better-ccxp-radius-lg: ${TOKENS.radiusLg};
        --better-ccxp-font-sans: ${TOKENS.fontSans};
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
    const directRootLinks = rootChildren
      .filter((entry) => entry && !entry.children)
      .map((entry) => normalizeLinkItem(entry, navDocument))
      .filter(Boolean);

    const topLevelGroups = rootChildren
      .filter((entry) => entry && entry.children)
      .map((entry, index) => normalizeTopLevelGroup(entry, index, navDocument));

    if (directRootLinks.length > 0) {
      topLevelGroups.unshift({
        id: "group-root-links",
        label: STRINGS.shortcutsGroup,
        directLinks: directRootLinks,
        sections: []
      });
    }

    return {
      groups: topLevelGroups,
      initialGroupId: topLevelGroups[0] ? topLevelGroups[0].id : null
    };
  }

  function normalizeTopLevelGroup(folderNode, index, navWindow) {
    const directLinks = [];
    const sections = [];

    (folderNode.children || []).forEach((childNode) => {
      if (childNode && childNode.children) {
        sections.push({
          id: `section-${index}-${sections.length}`,
          label: toPlainText(childNode.desc, navWindow),
          links: collectLinks(childNode, navWindow)
        });
        return;
      }

      const linkItem = normalizeLinkItem(childNode, navWindow);
      if (linkItem) {
        directLinks.push(linkItem);
      }
    });

    return {
      id: `group-${index}`,
      label: toPlainText(folderNode.desc, navWindow),
      directLinks,
      sections: sections.filter((section) => section.links.length > 0)
    };
  }

  function collectLinks(folderNode, navWindow) {
    const links = [];

    (folderNode.children || []).forEach((childNode) => {
      if (childNode && childNode.children) {
        links.push(...collectLinks(childNode, navWindow));
        return;
      }

      const linkItem = normalizeLinkItem(childNode, navWindow);
      if (linkItem) {
        links.push(linkItem);
      }
    });

    return links;
  }

  function normalizeLinkItem(itemNode, navWindow) {
    if (!itemNode || typeof itemNode.link !== "string") {
      return null;
    }

    const parsedLink = parseLegacyLink(itemNode.link);

    if (!parsedLink.href) {
      return null;
    }

    const rawHtml = String(itemNode.desc || "");
    return {
      label: toPlainText(rawHtml, navWindow),
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

  function toPlainText(rawHtml, navWindow) {
    if (!rawHtml) {
      return "";
    }

    const scratch = navWindow.document.createElement("div");
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
    const secondaryHeading = shell.querySelector(".better-ccxp-sidebar-secondary-heading");
    const secondaryList = shell.querySelector(".better-ccxp-sidebar-secondary-list");

    if (!primaryList || !secondaryHeading || !secondaryList) {
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
        secondaryHeading.textContent = "";
        secondaryList.innerHTML = `<div class="better-ccxp-empty">${STRINGS.emptyGroup}</div>`;
        return;
      }

        secondaryHeading.textContent = activeGroup.label;
      secondaryList.innerHTML = "";

      if (activeGroup.directLinks.length > 0) {
        secondaryList.appendChild(createSection(navFrame, "", activeGroup.directLinks));
      }

      activeGroup.sections.forEach((section) => {
        secondaryList.appendChild(createSection(navFrame, section.label, section.links));
      });

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
      button.textContent = linkItem.label;
      button.addEventListener("click", () => {
        activateLegacyLink(linkItem, targetDocument);
      });

      const targetHint = targetDocument.createElement("span");
      targetHint.className = "better-ccxp-link-target";
      targetHint.textContent = formatTarget(linkItem.target);
      button.appendChild(targetHint);
      linkList.appendChild(button);
    });

    section.appendChild(linkList);
    return section;
  }

  function activateLegacyLink(linkItem, navDocument) {
    navDocument.dispatchEvent(
      new CustomEvent("better-ccxp:activate-link", {
        detail: {
          href: linkItem.href,
          target: linkItem.target,
          clickLinkArgs: linkItem.clickLinkArgs || null
        }
      })
    );
  }

  function formatTarget(target) {
    const normalizedTarget = (target || "main").toLowerCase();
    if (normalizedTarget === "_blank") {
      return "新分頁";
    }
    if (normalizedTarget === "_top") {
      return "整頁跳轉";
    }
    return "主內容";
  }

  function ensureNavBridge(navDocument) {
    if (navDocument.documentElement.hasAttribute(NAV_BRIDGE_ATTR)) {
      return;
    }

    const script = navDocument.createElement("script");
    script.textContent = `
      (() => {
        const dataId = ${JSON.stringify(NAV_TREE_DATA_ID)};

        function serializeNode(node) {
          return {
            desc: node && typeof node.desc === "string" ? node.desc : "",
            link: node && typeof node.link === "string" ? node.link : null,
            children: node && Array.isArray(node.children) ? node.children.map(serializeNode) : []
          };
        }

        function writeTreeData() {
          if (!window.foldersTree) {
            return;
          }

          let dataNode = document.getElementById(dataId);
          if (!dataNode) {
            dataNode = document.createElement("script");
            dataNode.type = "application/json";
            dataNode.id = dataId;
            document.documentElement.appendChild(dataNode);
          }

          dataNode.textContent = JSON.stringify(serializeNode(window.foldersTree));
        }

        function activateLink(event) {
          const detail = event.detail || {};
          const href = detail.href;
          const target = (detail.target || "main").toLowerCase();
          const clickLinkArgs = detail.clickLinkArgs || null;

          if (clickLinkArgs && typeof window.ClickLink === "function") {
            window.ClickLink(clickLinkArgs.name, clickLinkArgs.url);
          }

          if (!href) {
            return;
          }

          const resolvedUrl = new URL(href, window.location.href).toString();

          if (target === "_blank") {
            window.open(resolvedUrl, "_blank");
            return;
          }

          if (target === "_top") {
            window.top.location.href = resolvedUrl;
            return;
          }

          if (target === "main" && window.top && window.top.frames && window.top.frames.main) {
            window.top.frames.main.location.href = resolvedUrl;
            return;
          }

          window.location.href = resolvedUrl;
        }

        document.addEventListener("better-ccxp:activate-link", activateLink);
        writeTreeData();
        document.documentElement.setAttribute(${JSON.stringify(NAV_BRIDGE_ATTR)}, "true");
      })();
    `;

    navDocument.documentElement.appendChild(script);
    script.remove();
  }

  function readNavTreeData(navDocument) {
    const dataNode = navDocument.getElementById(NAV_TREE_DATA_ID);
    if (!dataNode || !dataNode.textContent) {
      return null;
    }

    try {
      return JSON.parse(dataNode.textContent);
    } catch {
      return null;
    }
  }
})();
