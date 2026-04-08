(function bootstrapBetterCcxp() {
  const TOKENS = {
    colorPrimary: "#1f2933",
    colorAccent: "#d5dbe1",
    colorLegacyBlueText: "#2e4978",
    colorLegacyRedText: "#b85c68",
    colorBg: "#ffffff",
    colorSurface: "#ffffff",
    colorSidebarSurface: "#f5f7f9",
    colorSurfaceMuted: "#f5f7f9",
    colorBorder: "rgba(31, 41, 51, 0.12)",
    colorText: "#111827",
    colorTextMuted: "#52606d",
    spacingXs: "6px",
    spacingSm: "10px",
    spacingMd: "16px",
    spacingLg: "24px",
    spacingXl: "32px",
    sidebarRowPaddingY: "12px",
    sidebarRowPaddingX: "10px",
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
    landingMaxWidth: "960px",
    sidebarWidth: "288px",
    sidebarClass: "better-ccxp-sidebar-shell",
    mainClass: "better-ccxp-main-skin",
    landingClass: "better-ccxp-landing-shell"
  };

  const STRINGS = {
    sidebarTitle: "NTHU AIS",
    emptyGroup: "此分類暫無可顯示項目"
  };

  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const FRAMESET_COLUMNS = "288,*";
  const FRAMESET_ROWS = "0,*";

  let attempts = 0;

  attachAndApply();

  function attachAndApply() {
    if (isLandingPage(document)) {
      simplifyLandingPage(document);
      return;
    }

    const frames = findFrames();

    if (!frames.top || !frames.nav || !frames.main) {
      retry();
      return;
    }

    applyFramesetLayout();
    attachFrameListener(frames.nav, simplifySidebar);
    attachFrameListener(frames.main, simplifyMainFrame);
    removeHeader(frames.top);
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

  function isLandingPage(targetDocument) {
    const pathName = ((targetDocument.location && targetDocument.location.pathname) || "").toLowerCase();
    const isSupportedPath = /\/ccxp\/inquire\/(?:index\.php)?$/.test(pathName);
    return isSupportedPath && Boolean(targetDocument.querySelector("form[name='form1'][action*='pre_select_entry.php']"));
  }

  function simplifyLandingPage(targetDocument) {
    if (!targetDocument.body || !targetDocument.head) {
      retry();
      return;
    }

    if (targetDocument.body.dataset.betterCcxpLandingApplied === "true") {
      return;
    }

    if (!isDocumentComplete(targetDocument)) {
      retry();
      return;
    }

    const loginSourceCell = findLoginSourceCell(targetDocument);
    const tabNavigation = targetDocument.querySelector(".tab");
    const tabContents = Array.from(targetDocument.querySelectorAll(".tabcontent"));
    const languageLinks = targetDocument.querySelector("ul.links");
    const announcementTable = findAnnouncementTable(targetDocument);
    const utilityLinks = findUtilityLinksTable(targetDocument);
    const serviceLink = findServiceLink(targetDocument);

    if (!loginSourceCell || !tabNavigation || tabContents.length === 0) {
      retry();
      return;
    }

    injectBaseTokens(targetDocument, "landing");

    const style = targetDocument.createElement("style");
    style.dataset.betterCcxpLanding = "true";
    style.textContent = `
      html, body {
        background: var(--better-ccxp-bg) !important;
        color: var(--better-ccxp-type-body-color);
      }

      body {
        margin: 0;
        padding: var(--better-ccxp-spacing-lg) var(--better-ccxp-spacing-md) 48px;
        font: var(--better-ccxp-type-body);
      }

      a {
        color: var(--better-ccxp-type-primary-link-color);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      .${TOKENS.landingClass} {
        width: min(100%, ${TOKENS.landingMaxWidth});
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--better-ccxp-spacing-lg);
      }

      .better-ccxp-landing-section {
        width: 100%;
      }

      .better-ccxp-landing-top {
        display: flex;
        flex-direction: column;
        gap: var(--better-ccxp-spacing-md);
      }

      .better-ccxp-landing-lang {
        display: flex;
        justify-content: flex-end;
        padding-bottom: var(--better-ccxp-spacing-sm);
        border-bottom: 1px solid var(--better-ccxp-border);
      }

      .better-ccxp-landing-lang ul,
      .better-ccxp-landing-lang li {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .better-ccxp-landing-lang a {
        color: var(--better-ccxp-type-utility-color);
        font: var(--better-ccxp-type-utility);
      }

      .better-ccxp-landing-login > table:first-of-type {
        display: none;
      }

      .better-ccxp-landing-login div[style*="login_mid.png"] {
        margin: 0 !important;
        padding: 0 !important;
        background-image: none !important;
      }

      .better-ccxp-landing-login div[style*="margin-left:1em"] {
        margin-left: 0 !important;
      }

      .better-ccxp-landing-login .inputtext {
        width: min(100%, 320px) !important;
        margin: 6px 0 12px !important;
        padding: 8px 0 !important;
        border: 0 !important;
        border-bottom: 1px solid var(--better-ccxp-border) !important;
        background: transparent;
        color: var(--better-ccxp-type-body-color);
        font: var(--better-ccxp-type-body);
      }

      .better-ccxp-landing-login .button {
        min-width: 112px;
        padding: 10px 18px;
        border-radius: 999px;
        background: var(--better-ccxp-text);
        color: var(--better-ccxp-bg);
        font: var(--better-ccxp-type-body-strong);
      }

      .better-ccxp-landing-section img,
      .better-ccxp-landing-section table,
      .better-ccxp-landing-section iframe {
        max-width: 100%;
      }

      .better-ccxp-landing-login table[border="1"] {
        margin-top: var(--better-ccxp-spacing-sm);
        border-color: var(--better-ccxp-border);
      }

      .better-ccxp-landing-login td,
      .better-ccxp-landing-section td,
      .better-ccxp-landing-section th,
      .better-ccxp-landing-section font,
      .better-ccxp-landing-section span,
      .better-ccxp-landing-section div,
      .better-ccxp-landing-section p,
      .better-ccxp-landing-section li,
      .better-ccxp-landing-section button,
      .better-ccxp-landing-section input {
        font-family: var(--better-ccxp-font-sans) !important;
      }

      .better-ccxp-landing-links table,
      .better-ccxp-landing-notices table,
      .better-ccxp-landing-calendar table {
        width: 100% !important;
      }

      .better-ccxp-landing-links table[background],
      .better-ccxp-landing-links [background] {
        background: none !important;
      }

      .better-ccxp-landing-tabs .tab {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-width: 0 !important;
      }

      .better-ccxp-landing-tabs .tab button {
        float: none;
        padding: 8px 12px;
        border: 1px solid var(--better-ccxp-border);
        border-radius: 999px;
        background: transparent;
        color: var(--better-ccxp-type-body-color);
        font: var(--better-ccxp-type-body);
      }

      .better-ccxp-landing-tabs .tab button.active {
        background: var(--better-ccxp-surface-muted);
        color: var(--better-ccxp-type-body-strong-color);
      }

      .better-ccxp-landing-tabs .tabcontent {
        margin-top: var(--better-ccxp-spacing-md);
        padding: var(--better-ccxp-spacing-md);
        border: 1px solid var(--better-ccxp-border);
        background: var(--better-ccxp-surface);
      }

      .better-ccxp-landing-tabs .tabcontent h3,
      .better-ccxp-landing-tabs .tabcontent ul {
        margin-block: 0.2em;
      }

      .better-ccxp-landing-service {
        margin-top: var(--better-ccxp-spacing-sm);
        text-align: right;
      }

      .better-ccxp-landing-notices td,
      .better-ccxp-landing-calendar td {
        word-break: break-word;
      }

      .better-ccxp-landing-seal {
        padding-top: var(--better-ccxp-spacing-sm);
        border-top: 1px solid var(--better-ccxp-border);
      }
    `;
    targetDocument.head.appendChild(style);

    const shell = targetDocument.createElement("main");
    shell.className = TOKENS.landingClass;

    const topSection = createLandingSection(targetDocument, "better-ccxp-landing-top");
    const langSection = createLandingSection(targetDocument, "better-ccxp-landing-lang");
    const loginSection = createLandingSection(targetDocument, "better-ccxp-landing-login");
    const linksSection = createLandingSection(targetDocument, "better-ccxp-landing-links");
    const tabsSection = createLandingSection(targetDocument, "better-ccxp-landing-tabs");
    const noticesSection = createLandingSection(targetDocument, "better-ccxp-landing-notices");
    const calendarSection = createLandingSection(targetDocument, "better-ccxp-landing-calendar");
    const sealSection = createLandingSection(targetDocument, "better-ccxp-landing-seal");

    if (languageLinks) {
      langSection.appendChild(languageLinks);
    }

    moveChildNodes(loginSourceCell, loginSection);

    const calendarTable = findCalendarTable(loginSection);
    const sealTable = loginSection.querySelector("#twcaseal")?.closest("table");

    if (calendarTable) {
      calendarSection.appendChild(calendarTable);
    }

    if (sealTable) {
      sealSection.appendChild(sealTable);
    }

    topSection.appendChild(langSection);
    topSection.appendChild(loginSection);
    shell.appendChild(topSection);

    if (utilityLinks) {
      linksSection.appendChild(utilityLinks);
      shell.appendChild(linksSection);
    }

    tabsSection.appendChild(tabNavigation);
    tabContents.forEach((tabContent) => {
      tabsSection.appendChild(tabContent);
    });

    if (serviceLink) {
      serviceLink.classList.add("better-ccxp-landing-service");
      tabsSection.appendChild(serviceLink);
    }

    shell.appendChild(tabsSection);

    if (announcementTable) {
      noticesSection.appendChild(announcementTable);
      shell.appendChild(noticesSection);
    }

    if (calendarSection.childElementCount > 0) {
      shell.appendChild(calendarSection);
    }

    if (sealSection.childElementCount > 0) {
      shell.appendChild(sealSection);
    }

    targetDocument.body.replaceChildren(shell);
    targetDocument.body.dataset.betterCcxpLandingApplied = "true";
  }

  function createLandingSection(targetDocument, className) {
    const section = targetDocument.createElement("section");
    section.className = `better-ccxp-landing-section ${className}`;
    return section;
  }

  function moveChildNodes(sourceNode, targetNode) {
    while (sourceNode.firstChild) {
      targetNode.appendChild(sourceNode.firstChild);
    }
  }

  function findLoginSourceCell(targetDocument) {
    return Array.from(targetDocument.querySelectorAll("td"))
      .find((cell) => cell.querySelector("form[name='form1'][action*='pre_select_entry.php']"));
  }

  function findAnnouncementTable(targetDocument) {
    return Array.from(targetDocument.querySelectorAll("table"))
      .find((table) => {
        const heading = table.querySelector(".board_item");
        return heading && ["系統公告", "System Notice"].some((text) => heading.textContent.includes(text));
      });
  }

  function findUtilityLinksTable(targetDocument) {
    const anchor = targetDocument.querySelector(
      "a[href*='ccc.site.nthu.edu.tw'], a[href*='aisccc.site.nthu.edu.tw'], a[href*='nthu-en.site.nthu.edu.tw']"
    );
    return anchor ? anchor.closest("table") : null;
  }

  function findServiceLink(targetDocument) {
    const anchor = targetDocument.querySelector("a[href*='inquire_cpr.html']");
    return anchor ? anchor.closest("div") : null;
  }

  function findCalendarTable(targetNode) {
    const calendarFrame = targetNode.querySelector("iframe[src*='calendar/cal.php']");

    if (!calendarFrame) {
      return null;
    }

    return Array.from(targetNode.querySelectorAll("table"))
      .find((table) => table.contains(calendarFrame) && ["月曆", "Calendar"].some((text) => table.textContent.includes(text)));
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

  function removeHeader(topFrame) {
    const topDocument = topFrame.contentDocument;

    if (!topDocument || !topDocument.body || !topDocument.head) {
      retry();
      return;
    }

    if (topDocument.body.dataset.betterCcxpHeaderRemoved === "true") {
      return;
    }

    topDocument.documentElement.style.display = "none";
    topDocument.body.replaceChildren();
    topDocument.body.dataset.betterCcxpHeaderRemoved = "true";
    topFrame.setAttribute("scrolling", "no");
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
          width: 100%;
          min-width: var(--better-ccxp-sidebar-width);
          min-height: 100vh;
          height: 100vh;
          min-height: 0;
          padding: 18px 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: var(--better-ccxp-sidebar-surface);
        }

        .better-ccxp-sidebar-brand {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          padding: 4px 6px 18px;
        }

        .better-ccxp-sidebar-brand-copy {
          min-width: 0;
        }

        .better-ccxp-sidebar-brand-title {
          color: var(--better-ccxp-type-display-color);
          font: var(--better-ccxp-type-body-strong);
          font-size: 20px;
          letter-spacing: 0.01em;
        }

        .better-ccxp-sidebar-list,
        .better-ccxp-link-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }

        .better-ccxp-sidebar-group {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .better-ccxp-row-button {
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: var(--better-ccxp-sidebar-row-padding-y) var(--better-ccxp-sidebar-row-padding-x);
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

        .better-ccxp-row-button:hover {
          background: rgba(124, 45, 146, 0.06);
        }

        .better-ccxp-expandable {
          color: var(--better-ccxp-type-nav-color);
        }

        .better-ccxp-item {
          color: var(--better-ccxp-type-body-color);
          font: var(--better-ccxp-type-nav);
        }

        .better-ccxp-row-leading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          color: inherit;
        }

        .better-ccxp-row-marker {
          color: currentColor;
          font: inherit;
          line-height: 1;
        }

        .better-ccxp-row-label {
          min-width: 0;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .better-ccxp-chevron {
          width: 14px;
          height: 14px;
          color: currentColor;
          transition: transform 120ms ease;
        }

        .better-ccxp-chevron.is-expanded {
          transform: rotate(90deg);
        }

        .better-ccxp-link-list {
          padding-left: 0;
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
        <div class="better-ccxp-sidebar-brand">
          <div class="better-ccxp-sidebar-brand-copy">
            <div class="better-ccxp-sidebar-brand-title">${STRINGS.sidebarTitle}</div>
          </div>
        </div>
        <aside class="better-ccxp-sidebar-list"></aside>
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

      body.${TOKENS.mainClass} {
        padding: var(--better-ccxp-spacing-lg);
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
        --better-ccxp-sidebar-surface: ${TOKENS.colorSidebarSurface};
        --better-ccxp-surface-muted: ${TOKENS.colorSurfaceMuted};
        --better-ccxp-border: ${TOKENS.colorBorder};
        --better-ccxp-text: ${TOKENS.colorText};
        --better-ccxp-text-muted: ${TOKENS.colorTextMuted};
        --better-ccxp-spacing-xs: ${TOKENS.spacingXs};
        --better-ccxp-spacing-sm: ${TOKENS.spacingSm};
        --better-ccxp-spacing-md: ${TOKENS.spacingMd};
        --better-ccxp-spacing-lg: ${TOKENS.spacingLg};
        --better-ccxp-spacing-xl: ${TOKENS.spacingXl};
        --better-ccxp-sidebar-row-padding-y: ${TOKENS.sidebarRowPaddingY};
        --better-ccxp-sidebar-row-padding-x: ${TOKENS.sidebarRowPaddingX};
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
        --better-ccxp-sidebar-width: ${TOKENS.sidebarWidth};
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
    const items = rootChildren
      .map((entry, index) => normalizeRootEntry(entry, index, navDocument))
      .filter(Boolean);

    return {
      items,
      initialExpandedItemIds: collectInitialExpandedIds(items)
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
      linkItem,
      kind: "link"
    };
  }

  function normalizeTopLevelGroup(folderNode, index, navDocument) {
    const directLinks = [];
    const sections = [];

    (folderNode.children || []).forEach((childNode) => {
      if (childNode && childNode.children) {
        const section = normalizeSectionNode(childNode, `${index}-${sections.length}`, navDocument);
        if (section) {
          sections.push(section);
        }
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
      sections,
      kind: "group"
    };
  }

  function normalizeSectionNode(folderNode, indexKey, navDocument) {
    const directLinks = [];
    const sections = [];

    (folderNode.children || []).forEach((childNode) => {
      if (childNode && childNode.children) {
        const section = normalizeSectionNode(childNode, `${indexKey}-${sections.length}`, navDocument);
        if (section) {
          sections.push(section);
        }
        return;
      }

      const linkItem = normalizeLinkItem(childNode, navDocument);
      if (linkItem) {
        directLinks.push(linkItem);
      }
    });

    if (!toPlainText(folderNode.desc, navDocument) && directLinks.length === 0 && sections.length === 0) {
      return null;
    }

    return {
      id: `section-${indexKey}`,
      label: toPlainText(folderNode.desc, navDocument),
      directLinks,
      sections,
      kind: "section"
    };
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

    const sidebarList = shell.querySelector(".better-ccxp-sidebar-list");

    if (!sidebarList) {
      return;
    }

    const initialExpandedIds = new Set(model.initialExpandedItemIds || []);
    const storedExpandedIds = shell.dataset.expandedItemIds
      ? shell.dataset.expandedItemIds.split(",").filter(Boolean)
      : null;
    let expandedItemIds = new Set(
      storedExpandedIds && storedExpandedIds.length > 0
        ? storedExpandedIds.filter((itemId) => model.items.some((item) => item.id === itemId && item.kind === "group"))
        : Array.from(initialExpandedIds)
    );

    const renderItems = () => {
      shell.dataset.expandedItemIds = Array.from(expandedItemIds).join(",");
      sidebarList.innerHTML = "";

      if (model.items.length === 0) {
        sidebarList.innerHTML = `<div class="better-ccxp-empty">${STRINGS.emptyGroup}</div>`;
        return;
      }

      model.items.forEach((item) => {
        if (item.kind === "group") {
          sidebarList.appendChild(createExpandableGroup(navFrame, item, expandedItemIds, 0, (groupId) => {
            if (expandedItemIds.has(groupId)) {
              expandedItemIds.delete(groupId);
            } else {
              expandedItemIds.add(groupId);
            }
            renderItems();
          }));
          return;
        }

        sidebarList.appendChild(createLinkButton(navFrame, item.linkItem, "better-ccxp-item", 0));
      });
    };

    renderItems();
  }

  function createExpandableGroup(targetDocument, group, expandedItemIds, depth, onToggle) {
    const isExpanded = expandedItemIds.has(group.id);
    const linkList = targetDocument.createElement("div");
    linkList.className = "better-ccxp-sidebar-group";

    const button = targetDocument.createElement("button");
    button.type = "button";
    button.className = "better-ccxp-row-button better-ccxp-expandable";
    button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    button.style.paddingLeft = `${10 + depth * 24}px`;

    const leading = targetDocument.createElement("span");
    leading.className = "better-ccxp-row-leading";
    leading.appendChild(createChevronIcon(targetDocument, isExpanded));
    button.appendChild(leading);

    const label = targetDocument.createElement("span");
    label.className = "better-ccxp-row-label";
    label.textContent = group.label;
    button.appendChild(label);

    button.addEventListener("click", () => {
      onToggle(group.id);
    });

    linkList.appendChild(button);

    if (isExpanded) {
      const children = targetDocument.createElement("div");
      children.className = "better-ccxp-link-list";

      group.directLinks.forEach((linkItem) => {
        children.appendChild(createLinkButton(targetDocument, linkItem, "better-ccxp-item", depth + 1));
      });

      group.sections.forEach((section) => {
        children.appendChild(createExpandableGroup(targetDocument, section, expandedItemIds, depth + 1, onToggle));
      });

      if (children.childElementCount > 0) {
        linkList.appendChild(children);
      } else {
        const empty = targetDocument.createElement("div");
        empty.className = "better-ccxp-empty";
        empty.textContent = STRINGS.emptyGroup;
        linkList.appendChild(empty);
      }
    }

    return linkList;
  }

  function createLinkButton(targetDocument, linkItem, toneClass, depth) {
    const button = targetDocument.createElement("button");
    button.type = "button";
    button.className = `better-ccxp-row-button ${toneClass}`;
    button.style.paddingLeft = `${10 + depth * 24}px`;

    const leading = targetDocument.createElement("span");
    leading.className = "better-ccxp-row-leading";
    const marker = targetDocument.createElement("span");
    marker.className = "better-ccxp-row-marker";
    marker.textContent = "-";
    leading.appendChild(marker);
    button.appendChild(leading);

    const label = targetDocument.createElement("span");
    label.className = "better-ccxp-row-label";
    label.textContent = linkItem.label;
    button.appendChild(label);

    button.addEventListener("click", () => {
      activateLegacyLink(linkItem, targetDocument);
    });

    if (isExternalLinkTarget(linkItem.target)) {
      button.appendChild(createExternalLinkIcon(targetDocument));
    }

    return button;
  }

  function collectInitialExpandedIds(items) {
    const ids = [];
    const firstGroup = items.find((item) => item.kind === "group");

    if (!firstGroup) {
      return ids;
    }

    ids.push(firstGroup.id);

    const firstSection = firstGroup.sections && firstGroup.sections[0];
    if (firstSection) {
      ids.push(firstSection.id);
    }

    return ids;
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

  function createChevronIcon(targetDocument, isExpanded) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", `better-ccxp-chevron${isExpanded ? " is-expanded" : ""}`);
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2.25");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m9 6 6 6-6 6");
    icon.appendChild(path);

    return icon;
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
