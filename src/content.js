(function bootstrapCcxpLite() {
  const TOKENS = {
    colorPrimary: "#1f2933",
    colorAccent: "#d5dbe1",
    colorBrand: "rgb(121, 36, 133)",
    colorLegacyBlueText: "#2e4978",
    colorLegacyRedText: "#b85c68",
    colorBg: "#ffffff",
    colorSurface: "#ffffff",
    colorSidebarSurface: "#f5f7f9",
    colorSurfaceMuted: "#f5f7f9",
    colorBorder: "rgba(31, 41, 51, 0.12)",
    colorSidebarDivider: "rgba(31, 41, 51, 0.22)",
    colorText: "#111827",
    colorTextMuted: "#52606d",
    spacingXs: "6px",
    spacingSm: "10px",
    spacingMd: "16px",
    spacingLg: "24px",
    spacingXl: "32px",
    sidebarRowPaddingY: "12px",
    sidebarRowPaddingX: "10px",
    radiusSm: "10px",
    radiusMd: "14px",
    radiusLg: "20px",
    fontSans: "\"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", sans-serif",
    fontBrand: "\"Futura\", \"Futura PT\", \"Avenir Next\", sans-serif",
    fontWeightRegular: "400",
    fontWeightStrong: "700",
    fontWeightHeavy: "800",
    fontSizeCaption: "12px",
    fontSizeNav: "13px",
    fontSizeUtility: "14px",
    fontSizeBody: "15px",
    fontSizeSidebarBrand: "20px",
    sizeSidebarBrandLogo: "30px",
    spacingSidebarBrandWordGap: "0.5ch",
    sizeSidebarHeaderDividerWidth: "96px",
    sizeSidebarHeaderDividerHeight: "2px",
    fontSizePageTitle: "26px",
    fontSizeDisplay: "30px",
    landingMaxWidth: "960px",
    sidebarWidth: "288px",
    sidebarClass: "ccxp-lite-sidebar-shell",
    mainClass: "ccxp-lite-main-skin",
    landingClass: "ccxp-lite-landing-shell"
  };

  const STRINGS = {
    sidebarTitle: "NTHU AIS",
    landingTitle: "NTHU AIS",
    emptyGroup: "此分類暫無可顯示項目"
  };

  const ASSETS = {
    brandLogoPath: "assets/nthu.jpg",
    sidebarBrandLogoPath: "assets/nthu.png"
  };

  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const FRAMESET_COLUMNS = "288,*";
  const FRAMESET_ROWS = "0,*";

  let attempts = 0;

  attachAndApply();

  function attachAndApply() {
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

    if (targetDocument.body.dataset.ccxpLiteLandingApplied === "true") {
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
    style.dataset.ccxpLiteLanding = "true";
    style.textContent = `
      html, body {
        background: var(--ccxp-lite-bg) !important;
        color: var(--ccxp-lite-type-body-color);
      }

      body {
        margin: 0;
        padding: var(--ccxp-lite-spacing-lg) var(--ccxp-lite-spacing-md) 48px;
        font: var(--ccxp-lite-type-body);
      }

      a {
        color: var(--ccxp-lite-type-primary-link-color);
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
        gap: var(--ccxp-lite-spacing-lg);
      }

      .ccxp-lite-landing-section {
        width: 100%;
      }

      .ccxp-lite-landing-top {
        display: flex;
        flex-direction: column;
        gap: var(--ccxp-lite-spacing-md);
      }

      .ccxp-lite-landing-brand {
        display: flex;
        align-items: center;
        gap: var(--ccxp-lite-spacing-md);
        padding-bottom: var(--ccxp-lite-spacing-sm);
        border-bottom: 1px solid var(--ccxp-lite-border);
      }

      .ccxp-lite-landing-brand-logo {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .ccxp-lite-landing-brand-copy {
        min-width: 0;
      }

      .ccxp-lite-landing-brand-title {
        color: var(--ccxp-lite-type-display-color);
        font: var(--ccxp-lite-type-body-strong);
        font-size: 28px;
        letter-spacing: 0.01em;
      }

      .ccxp-lite-landing-lang {
        display: flex;
        justify-content: flex-end;
        padding-bottom: var(--ccxp-lite-spacing-sm);
        border-bottom: 1px solid var(--ccxp-lite-border);
      }

      .ccxp-lite-landing-lang ul,
      .ccxp-lite-landing-lang li {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .ccxp-lite-landing-lang a {
        color: var(--ccxp-lite-type-utility-color);
        font: var(--ccxp-lite-type-utility);
      }

      .ccxp-lite-landing-login > table:first-of-type {
        display: none;
      }

      .ccxp-lite-landing-login div[style*="login_mid.png"] {
        margin: 0 !important;
        padding: 0 !important;
        background-image: none !important;
      }

      .ccxp-lite-landing-login div[style*="margin-left:1em"] {
        margin-left: 0 !important;
      }

      .ccxp-lite-landing-login .inputtext {
        width: min(100%, 320px) !important;
        margin: 6px 0 12px !important;
        padding: 8px 0 !important;
        border: 0 !important;
        border-bottom: 1px solid var(--ccxp-lite-border) !important;
        background: transparent;
        color: var(--ccxp-lite-type-body-color);
        font: var(--ccxp-lite-type-body);
      }

      .ccxp-lite-landing-login .button {
        min-width: 112px;
        padding: 10px 18px;
        border-radius: 999px;
        background: var(--ccxp-lite-text);
        color: var(--ccxp-lite-bg);
        font: var(--ccxp-lite-type-body-strong);
      }

      .ccxp-lite-landing-section img,
      .ccxp-lite-landing-section table,
      .ccxp-lite-landing-section iframe {
        max-width: 100%;
      }

      .ccxp-lite-landing-login table[border="1"] {
        margin-top: var(--ccxp-lite-spacing-sm);
        border-color: var(--ccxp-lite-border);
      }

      .ccxp-lite-landing-login td,
      .ccxp-lite-landing-section td,
      .ccxp-lite-landing-section th,
      .ccxp-lite-landing-section font,
      .ccxp-lite-landing-section span,
      .ccxp-lite-landing-section div,
      .ccxp-lite-landing-section p,
      .ccxp-lite-landing-section li,
      .ccxp-lite-landing-section button,
      .ccxp-lite-landing-section input {
        font-family: var(--ccxp-lite-font-sans) !important;
      }

      .ccxp-lite-landing-links table,
      .ccxp-lite-landing-notices table {
        width: 100% !important;
      }

      .ccxp-lite-landing-notices table[width],
      .ccxp-lite-landing-notices td[width],
      .ccxp-lite-landing-notices th[width] {
        width: auto !important;
      }

      .ccxp-lite-landing-notices table {
        table-layout: fixed;
      }

      .ccxp-lite-landing-notices td:first-child,
      .ccxp-lite-landing-notices th:first-child {
        width: 8rem !important;
      }

      .ccxp-lite-landing-links table[background],
      .ccxp-lite-landing-links [background] {
        background: none !important;
      }

      .ccxp-lite-landing-tabs .tab {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-width: 0 !important;
      }

      .ccxp-lite-landing-tabs .tab button {
        float: none;
        padding: 8px 12px;
        border: 1px solid var(--ccxp-lite-border);
        border-radius: 999px;
        background: transparent;
        color: var(--ccxp-lite-type-body-color);
        font: var(--ccxp-lite-type-nav);
      }

      .ccxp-lite-landing-tabs .tab button.active {
        background: var(--ccxp-lite-surface-muted);
        color: var(--ccxp-lite-type-body-strong-color);
      }

      .ccxp-lite-landing-tabs .tabcontent {
        margin-top: var(--ccxp-lite-spacing-md);
        padding: var(--ccxp-lite-spacing-md);
        border: 1px solid var(--ccxp-lite-border);
        background: var(--ccxp-lite-surface);
      }

      .ccxp-lite-landing-tabs .tabcontent h3,
      .ccxp-lite-landing-tabs .tabcontent ul {
        margin-block: 0.2em;
      }

      .ccxp-lite-landing-tabs .tabcontent h3 {
        color: var(--ccxp-lite-type-body-strong-color);
        font: var(--ccxp-lite-type-body-strong);
      }

      .ccxp-lite-landing-service {
        color: var(--ccxp-lite-type-utility-color);
        font: var(--ccxp-lite-type-utility);
      }

      .ccxp-lite-landing-service {
        margin-top: var(--ccxp-lite-spacing-sm);
        text-align: right;
      }

      .ccxp-lite-landing-notices td {
        word-break: break-word;
      }
    `;
    targetDocument.head.appendChild(style);

    const shell = targetDocument.createElement("main");
    shell.className = TOKENS.landingClass;

    const topSection = createLandingSection(targetDocument, "ccxp-lite-landing-top");
    const brandSection = createLandingSection(targetDocument, "ccxp-lite-landing-brand");
    const langSection = createLandingSection(targetDocument, "ccxp-lite-landing-lang");
    const loginSection = createLandingSection(targetDocument, "ccxp-lite-landing-login");
    const linksSection = createLandingSection(targetDocument, "ccxp-lite-landing-links");
    const tabsSection = createLandingSection(targetDocument, "ccxp-lite-landing-tabs");
    const noticesSection = createLandingSection(targetDocument, "ccxp-lite-landing-notices");

    brandSection.appendChild(createBrandImage(targetDocument, "ccxp-lite-landing-brand-logo"));
    brandSection.appendChild(createBrandCopy(targetDocument, "ccxp-lite-landing-brand-copy", "ccxp-lite-landing-brand-title", STRINGS.landingTitle));

    if (languageLinks) {
      langSection.appendChild(languageLinks);
    }

    moveChildNodes(loginSourceCell, loginSection);
    removeNode(findCalendarTable(loginSection));
    removeNode(loginSection.querySelector("#twcaseal")?.closest("table"));

    topSection.appendChild(brandSection);
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
      serviceLink.classList.add("ccxp-lite-landing-service");
      tabsSection.appendChild(serviceLink);
    }

    shell.appendChild(tabsSection);

    if (announcementTable) {
      noticesSection.appendChild(announcementTable);
      shell.appendChild(noticesSection);
    }

    targetDocument.body.replaceChildren(shell);
    targetDocument.body.dataset.ccxpLiteLandingApplied = "true";
  }

  function createLandingSection(targetDocument, className) {
    const section = targetDocument.createElement("section");
    section.className = `ccxp-lite-landing-section ${className}`;
    return section;
  }

  function createBrandImage(targetDocument, className, assetPath = ASSETS.brandLogoPath) {
    const image = targetDocument.createElement("img");
    image.className = className;
    image.alt = STRINGS.sidebarTitle;
    image.src = chrome.runtime.getURL(assetPath);
    return image;
  }

  function createBrandCopy(targetDocument, containerClassName, titleClassName, title) {
    const copy = targetDocument.createElement("div");
    copy.className = containerClassName;

    const titleNode = targetDocument.createElement("div");
    titleNode.className = titleClassName;

    if (titleClassName === "ccxp-lite-sidebar-brand-title" && title.includes(" ")) {
      const titleWords = title.split(" ");

      titleWords.forEach((word) => {
        const wordNode = targetDocument.createElement("span");
        wordNode.textContent = word;
        titleNode.appendChild(wordNode);
      });
    } else {
      titleNode.textContent = title;
    }

    copy.appendChild(titleNode);

    return copy;
  }

  function moveChildNodes(sourceNode, targetNode) {
    while (sourceNode.firstChild) {
      targetNode.appendChild(sourceNode.firstChild);
    }
  }

  function removeNode(node) {
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  function findLoginSourceCell(targetDocument) {
    return Array.from(targetDocument.querySelectorAll("td"))
      .find((cell) => cell.querySelector("form[name='form1'][action*='pre_select_entry.php']"));
  }

  function findCalendarTable(targetNode) {
    const calendarFrame = targetNode.querySelector("iframe[src*='calendar/cal.php']");

    if (!calendarFrame) {
      return null;
    }

    return Array.from(targetNode.querySelectorAll("table"))
      .find((table) => table.contains(calendarFrame) && ["月曆", "Calendar"].some((text) => table.textContent.includes(text)));
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

  function attachFrameListener(frame, callback) {
    if (frame.dataset.ccxpLiteListenerAttached === "true") {
      return;
    }

    frame.addEventListener("load", () => callback(frame));
    frame.dataset.ccxpLiteListenerAttached = "true";
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

    if (topDocument.body.dataset.ccxpLiteHeaderRemoved === "true") {
      return;
    }

    topDocument.documentElement.style.display = "none";
    topDocument.body.replaceChildren();
    topDocument.body.dataset.ccxpLiteHeaderRemoved = "true";
    topFrame.setAttribute("scrolling", "no");
  }

  function simplifySidebar(navFrame) {
    const navDocument = navFrame.contentDocument;

    if (!navDocument || !navDocument.body || !navDocument.head) {
      retry();
      return;
    }

    if (navDocument.body.dataset.ccxpLiteSidebarApplied !== "true" && !isDocumentComplete(navDocument)) {
      retry();
      return;
    }

    const rawTree = parseSidebarTree(navDocument);

    if (!rawTree || !Array.isArray(rawTree.children)) {
      retry();
      return;
    }

    injectBaseTokens(navDocument, "nav");

    if (navDocument.body.dataset.ccxpLiteSidebarApplied !== "true") {
      const style = navDocument.createElement("style");
      style.textContent = `
        html, body {
          background: var(--ccxp-lite-bg);
        }

        .${TOKENS.sidebarClass} {
          box-sizing: border-box;
          width: 100%;
          min-width: var(--ccxp-lite-sidebar-width);
          min-height: 100vh;
          height: 100vh;
          min-height: 0;
          padding: 18px 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: auto;
          background: var(--ccxp-lite-sidebar-surface);
        }

        .ccxp-lite-sidebar-brand {
          --ccxp-lite-sidebar-brand-font-size: var(--ccxp-lite-font-size-sidebar-brand);
          display: grid;
          grid-template-columns: var(--ccxp-lite-size-sidebar-brand-logo) minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          padding: 4px 6px 18px;
          font-family: var(--ccxp-lite-font-brand);
          font-size: var(--ccxp-lite-sidebar-brand-font-size);
          line-height: 1;
        }

        .ccxp-lite-sidebar-brand-logo {
          width: auto;
          height: var(--ccxp-lite-size-sidebar-brand-logo);
          max-width: 100%;
          border-radius: 12px;
          object-fit: contain;
          filter: var(--ccxp-lite-brand-logo-filter);
        }

        .ccxp-lite-sidebar-brand-copy {
          min-width: 0;
        }

        .ccxp-lite-sidebar-brand-title {
          display: inline-flex;
          align-items: baseline;
          gap: var(--ccxp-lite-spacing-sidebar-brand-word-gap);
          color: var(--ccxp-lite-type-display-color);
          font-family: var(--ccxp-lite-font-brand);
          font-size: var(--ccxp-lite-sidebar-brand-font-size);
          font-weight: var(--ccxp-lite-font-weight-strong);
          line-height: 1;
          letter-spacing: 0.01em;
        }

        .ccxp-lite-sidebar-divider {
          display: block;
          flex: 0 0 auto;
          width: var(--ccxp-lite-size-sidebar-header-divider-width);
          min-height: var(--ccxp-lite-size-sidebar-header-divider-height);
          height: var(--ccxp-lite-size-sidebar-header-divider-height);
          margin: 0 0 14px 6px;
          border-radius: 999px;
          background: var(--ccxp-lite-sidebar-divider-color);
        }

        .ccxp-lite-sidebar-list,
        .ccxp-lite-link-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }

        .ccxp-lite-sidebar-group {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .ccxp-lite-row-button {
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: var(--ccxp-lite-sidebar-row-padding-y) var(--ccxp-lite-sidebar-row-padding-x);
          border: 0;
          border-radius: var(--ccxp-lite-radius-sm);
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: var(--ccxp-lite-type-nav);
          color: var(--ccxp-lite-type-nav-color);
          text-align: left;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
          transition: background-color 120ms ease, color 120ms ease;
        }

        .ccxp-lite-row-button:hover {
          background: rgba(124, 45, 146, 0.06);
        }

        .ccxp-lite-expandable {
          color: var(--ccxp-lite-type-nav-color);
        }

        .ccxp-lite-item {
          color: var(--ccxp-lite-type-body-color);
          font: var(--ccxp-lite-type-nav);
        }

        .ccxp-lite-row-leading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          color: inherit;
        }

        .ccxp-lite-row-marker {
          color: currentColor;
          font: inherit;
          line-height: 1;
        }

        .ccxp-lite-row-label {
          min-width: 0;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .ccxp-lite-chevron {
          width: 14px;
          height: 14px;
          color: currentColor;
          transition: transform 120ms ease;
        }

        .ccxp-lite-chevron.is-expanded {
          transform: rotate(90deg);
        }

        .ccxp-lite-link-list {
          padding-left: 0;
        }

        .ccxp-lite-link-icon {
          width: 14px;
          height: 14px;
          color: inherit;
          opacity: 0.85;
        }

        .ccxp-lite-empty {
          padding: 14px;
          border: 0;
          border-radius: var(--ccxp-lite-radius-sm);
          color: var(--ccxp-lite-type-body-muted-color);
          font: var(--ccxp-lite-type-body-muted);
          background: rgba(124, 45, 146, 0.04);
        }
      `;
      navDocument.head.appendChild(style);

      const helperFrame = navDocument.querySelector("iframe[name='frame_7472']");
      const shell = navDocument.createElement("div");
      shell.className = TOKENS.sidebarClass;
      const brand = navDocument.createElement("div");
      brand.className = "ccxp-lite-sidebar-brand";
      brand.appendChild(createBrandImage(navDocument, "ccxp-lite-sidebar-brand-logo", ASSETS.sidebarBrandLogoPath));
      brand.appendChild(createBrandCopy(navDocument, "ccxp-lite-sidebar-brand-copy", "ccxp-lite-sidebar-brand-title", STRINGS.sidebarTitle));
      const divider = navDocument.createElement("div");
      divider.className = "ccxp-lite-sidebar-divider";

      const list = navDocument.createElement("aside");
      list.className = "ccxp-lite-sidebar-list";

      shell.appendChild(brand);
      shell.appendChild(divider);
      shell.appendChild(list);

      navDocument.body.replaceChildren(shell);

      if (helperFrame) {
        helperFrame.style.display = "none";
        navDocument.body.appendChild(helperFrame);
      }

      navDocument.body.dataset.ccxpLiteSidebarApplied = "true";
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

    if (mainDocument.head.querySelector("[data-ccxp-lite-main='true']")) {
      return;
    }

    const style = mainDocument.createElement("style");
    style.dataset.ccxpLiteMain = "true";
    style.textContent = `
      html, body {
        background: var(--ccxp-lite-bg) !important;
        color: var(--ccxp-lite-type-body-color) !important;
      }

      html, body, table, tbody, tr, td, th, input, select, textarea, button, a, font, div, span, p, li {
        font-family: var(--ccxp-lite-font-sans) !important;
      }

      body {
        color: var(--ccxp-lite-type-body-color);
        font: var(--ccxp-lite-type-body);
      }

      body.${TOKENS.mainClass} {
        padding: var(--ccxp-lite-spacing-lg);
      }

      a {
        color: var(--ccxp-lite-type-primary-link-color);
        font: var(--ccxp-lite-type-primary-link);
        text-decoration: none;
      }

      a:hover {
        color: var(--ccxp-lite-type-primary-link-color);
        text-decoration: underline;
      }

      .td26 {
        color: var(--ccxp-lite-type-page-title-color);
        font: var(--ccxp-lite-type-page-title);
      }

      .td17 {
        color: var(--ccxp-lite-type-body-strong-color);
        font: var(--ccxp-lite-type-body-strong);
      }

      .td15,
      .opt,
      .opt1,
      li.td15,
      td[style*="color:#333344" i],
      td[style*="color: #333344" i] {
        color: var(--ccxp-lite-type-body-color);
        font: var(--ccxp-lite-type-body);
      }

      .td_item,
      b,
      strong {
        color: var(--ccxp-lite-type-body-strong-color);
        font-weight: var(--ccxp-lite-font-weight-strong);
      }

      .td_item {
        font-size: var(--ccxp-lite-font-size-body);
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
        color: var(--ccxp-lite-type-info-color) !important;
        font-weight: var(--ccxp-lite-font-weight-strong) !important;
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
        color: var(--ccxp-lite-type-danger-color) !important;
        font-weight: var(--ccxp-lite-font-weight-strong) !important;
      }

      font[size="2" i],
      [size="2" i] {
        color: var(--ccxp-lite-type-caption-color) !important;
        font: var(--ccxp-lite-type-caption) !important;
      }
    `;
    mainDocument.head.appendChild(style);
    mainDocument.body.classList.add(TOKENS.mainClass);
  }

  function injectBaseTokens(targetDocument, scope) {
    if (targetDocument.head.querySelector(`[data-ccxp-lite-tokens='${scope}']`)) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.dataset.ccxpLiteTokens = scope;
    style.textContent = `
      :root {
        --ccxp-lite-primary: ${TOKENS.colorPrimary};
        --ccxp-lite-accent: ${TOKENS.colorAccent};
        --ccxp-lite-brand: ${TOKENS.colorBrand};
        --ccxp-lite-brand-logo-filter: brightness(0) saturate(100%) invert(19%) sepia(49%) saturate(2697%) hue-rotate(278deg) brightness(89%) contrast(92%);
        --ccxp-lite-legacy-blue-text: ${TOKENS.colorLegacyBlueText};
        --ccxp-lite-legacy-red-text: ${TOKENS.colorLegacyRedText};
        --ccxp-lite-bg: ${TOKENS.colorBg};
        --ccxp-lite-surface: ${TOKENS.colorSurface};
        --ccxp-lite-sidebar-surface: ${TOKENS.colorSidebarSurface};
        --ccxp-lite-surface-muted: ${TOKENS.colorSurfaceMuted};
        --ccxp-lite-border: ${TOKENS.colorBorder};
        --ccxp-lite-sidebar-divider-color: ${TOKENS.colorSidebarDivider};
        --ccxp-lite-text: ${TOKENS.colorText};
        --ccxp-lite-text-muted: ${TOKENS.colorTextMuted};
        --ccxp-lite-spacing-xs: ${TOKENS.spacingXs};
        --ccxp-lite-spacing-sm: ${TOKENS.spacingSm};
        --ccxp-lite-spacing-md: ${TOKENS.spacingMd};
        --ccxp-lite-spacing-lg: ${TOKENS.spacingLg};
        --ccxp-lite-spacing-xl: ${TOKENS.spacingXl};
        --ccxp-lite-sidebar-row-padding-y: ${TOKENS.sidebarRowPaddingY};
        --ccxp-lite-sidebar-row-padding-x: ${TOKENS.sidebarRowPaddingX};
        --ccxp-lite-radius-sm: ${TOKENS.radiusSm};
        --ccxp-lite-radius-md: ${TOKENS.radiusMd};
        --ccxp-lite-radius-lg: ${TOKENS.radiusLg};
        --ccxp-lite-font-sans: ${TOKENS.fontSans};
        --ccxp-lite-font-brand: ${TOKENS.fontBrand};
        --ccxp-lite-font-weight-regular: ${TOKENS.fontWeightRegular};
        --ccxp-lite-font-weight-strong: ${TOKENS.fontWeightStrong};
        --ccxp-lite-font-weight-heavy: ${TOKENS.fontWeightHeavy};
        --ccxp-lite-font-size-caption: ${TOKENS.fontSizeCaption};
        --ccxp-lite-font-size-nav: ${TOKENS.fontSizeNav};
        --ccxp-lite-font-size-utility: ${TOKENS.fontSizeUtility};
        --ccxp-lite-font-size-body: ${TOKENS.fontSizeBody};
        --ccxp-lite-font-size-sidebar-brand: ${TOKENS.fontSizeSidebarBrand};
        --ccxp-lite-size-sidebar-brand-logo: ${TOKENS.sizeSidebarBrandLogo};
        --ccxp-lite-spacing-sidebar-brand-word-gap: ${TOKENS.spacingSidebarBrandWordGap};
        --ccxp-lite-size-sidebar-header-divider-width: ${TOKENS.sizeSidebarHeaderDividerWidth};
        --ccxp-lite-size-sidebar-header-divider-height: ${TOKENS.sizeSidebarHeaderDividerHeight};
        --ccxp-lite-font-size-page-title: ${TOKENS.fontSizePageTitle};
        --ccxp-lite-font-size-display: ${TOKENS.fontSizeDisplay};
        --ccxp-lite-sidebar-width: ${TOKENS.sidebarWidth};
        --ccxp-lite-type-display: var(--ccxp-lite-font-weight-heavy) var(--ccxp-lite-font-size-display)/1.1 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-display-color: var(--ccxp-lite-text);
        --ccxp-lite-type-page-title: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-page-title)/1.2 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-page-title-color: var(--ccxp-lite-text);
        --ccxp-lite-type-primary-link: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-body)/1.5 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-primary-link-color: var(--ccxp-lite-primary);
        --ccxp-lite-type-info: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-body)/1.5 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-info-color: var(--ccxp-lite-legacy-blue-text);
        --ccxp-lite-type-danger: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-body)/1.5 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-danger-color: var(--ccxp-lite-legacy-red-text);
        --ccxp-lite-type-body-strong: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-body)/1.55 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-body-strong-color: var(--ccxp-lite-text);
        --ccxp-lite-type-body: var(--ccxp-lite-font-weight-regular) var(--ccxp-lite-font-size-body)/1.55 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-body-color: var(--ccxp-lite-text);
        --ccxp-lite-type-body-muted: var(--ccxp-lite-font-weight-regular) var(--ccxp-lite-font-size-body)/1.55 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-body-muted-color: var(--ccxp-lite-text-muted);
        --ccxp-lite-type-utility: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-utility)/1.4 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-utility-color: var(--ccxp-lite-primary);
        --ccxp-lite-type-nav: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-nav)/1.35 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-nav-color: var(--ccxp-lite-primary);
        --ccxp-lite-type-caption: var(--ccxp-lite-font-weight-strong) var(--ccxp-lite-font-size-caption)/1.4 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-caption-color: var(--ccxp-lite-text-muted);
        --ccxp-lite-type-section-label: var(--ccxp-lite-font-weight-heavy) var(--ccxp-lite-font-size-caption)/1.4 var(--ccxp-lite-font-sans);
        --ccxp-lite-type-section-label-color: var(--ccxp-lite-primary);
      }

      html, body {
        margin: 0;
        padding: 0;
        font-family: var(--ccxp-lite-font-sans);
        color: var(--ccxp-lite-text);
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

    const sidebarList = shell.querySelector(".ccxp-lite-sidebar-list");

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
        sidebarList.innerHTML = `<div class="ccxp-lite-empty">${STRINGS.emptyGroup}</div>`;
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

        sidebarList.appendChild(createLinkButton(navFrame, item.linkItem, "ccxp-lite-item", 0));
      });
    };

    renderItems();
  }

  function createExpandableGroup(targetDocument, group, expandedItemIds, depth, onToggle) {
    const isExpanded = expandedItemIds.has(group.id);
    const linkList = targetDocument.createElement("div");
    linkList.className = "ccxp-lite-sidebar-group";

    const button = targetDocument.createElement("button");
    button.type = "button";
    button.className = "ccxp-lite-row-button ccxp-lite-expandable";
    button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    button.style.paddingLeft = `${10 + depth * 24}px`;

    const leading = targetDocument.createElement("span");
    leading.className = "ccxp-lite-row-leading";
    leading.appendChild(createChevronIcon(targetDocument, isExpanded));
    button.appendChild(leading);

    const label = targetDocument.createElement("span");
    label.className = "ccxp-lite-row-label";
    label.textContent = group.label;
    button.appendChild(label);

    button.addEventListener("click", () => {
      onToggle(group.id);
    });

    linkList.appendChild(button);

    if (isExpanded) {
      const children = targetDocument.createElement("div");
      children.className = "ccxp-lite-link-list";

      group.directLinks.forEach((linkItem) => {
        children.appendChild(createLinkButton(targetDocument, linkItem, "ccxp-lite-item", depth + 1));
      });

      group.sections.forEach((section) => {
        children.appendChild(createExpandableGroup(targetDocument, section, expandedItemIds, depth + 1, onToggle));
      });

      if (children.childElementCount > 0) {
        linkList.appendChild(children);
      } else {
        const empty = targetDocument.createElement("div");
        empty.className = "ccxp-lite-empty";
        empty.textContent = STRINGS.emptyGroup;
        linkList.appendChild(empty);
      }
    }

    return linkList;
  }

  function createLinkButton(targetDocument, linkItem, toneClass, depth) {
    const button = targetDocument.createElement("button");
    button.type = "button";
    button.className = `ccxp-lite-row-button ${toneClass}`;
    button.style.paddingLeft = `${10 + depth * 24}px`;

    const leading = targetDocument.createElement("span");
    leading.className = "ccxp-lite-row-leading";
    const marker = targetDocument.createElement("span");
    marker.className = "ccxp-lite-row-marker";
    marker.textContent = "-";
    leading.appendChild(marker);
    button.appendChild(leading);

    const label = targetDocument.createElement("span");
    label.className = "ccxp-lite-row-label";
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
    icon.setAttribute("class", "ccxp-lite-link-icon");
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
    icon.setAttribute("class", `ccxp-lite-chevron${isExpanded ? " is-expanded" : ""}`);
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
