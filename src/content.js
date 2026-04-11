(function bootstrapCcxpLite() {
  const { shared, sidebar } = window.CCXP_LITE;
  const { TOKENS, STRINGS, ensureThemeDocument, createBrandImage, createBrandCopy, moveChildNodes, removeNode, isDocumentComplete } = shared;

  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const FRAMESET_COLUMNS = "288,*";
  const FRAMESET_ROWS = "0,*";
  const LOADING_SPRITE_ID = "ccxp-lite-loading-sprite";
  const LOADING_SPRITE_STYLE_ID = "ccxp-lite-loading-sprite-style";
  const LOADING_SPRITE_TIMEOUT_MS = 8000;

  let attempts = 0;
  const loadingState = initializeLoadingSprite(document);

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
    attachFrameListener(frames.nav, () => {
      sidebar.simplifySidebar(frames.nav, retry);
      updateLoadingStateForNav(frames.nav);
    });
    attachFrameListener(frames.main, () => simplifyMainFrame(frames.main));
    removeHeader(frames.top);
    sidebar.simplifySidebar(frames.nav, retry);
    updateLoadingStateForNav(frames.nav);
    simplifyMainFrame(frames.main);
  }

  function initializeLoadingSprite(targetDocument) {
    if (!isSupportedInquirePath(targetDocument)) {
      return null;
    }

    ensureLoadingSprite(targetDocument);

    const state = {
      navReady: false,
      mainReady: false,
      timerId: null,
      released: false
    };

    state.timerId = window.setTimeout(() => {
      releaseLoadingSprite(targetDocument);
      state.released = true;
    }, LOADING_SPRITE_TIMEOUT_MS);

    return state;
  }

  function ensureLoadingSprite(targetDocument) {
    if (!targetDocument || !targetDocument.documentElement) {
      return;
    }

    if (!targetDocument.getElementById(LOADING_SPRITE_STYLE_ID)) {
      const styleNode = targetDocument.createElement("style");
      styleNode.id = LOADING_SPRITE_STYLE_ID;
      styleNode.textContent = `
        html, body {
          background: #ffffff !important;
        }

        #${LOADING_SPRITE_ID} {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: none;
          background: #ffffff;
          opacity: 1;
          transition: opacity 160ms ease;
        }

        #${LOADING_SPRITE_ID}::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 22px;
          height: 22px;
          margin-top: -11px;
          margin-left: -11px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.08), 0 8px 24px rgba(17, 24, 39, 0.08);
        }
      `;

      if (targetDocument.head) {
        targetDocument.head.appendChild(styleNode);
      } else {
        targetDocument.documentElement.appendChild(styleNode);
      }
    }

    if (!targetDocument.getElementById(LOADING_SPRITE_ID)) {
      const sprite = targetDocument.createElement("div");
      sprite.id = LOADING_SPRITE_ID;
      targetDocument.documentElement.appendChild(sprite);
    }
  }

  function releaseLoadingSprite(targetDocument) {
    const sprite = targetDocument.getElementById(LOADING_SPRITE_ID);
    if (!sprite) {
      return;
    }

    sprite.style.opacity = "0";
    window.setTimeout(() => removeNode(sprite), 180);
  }

  function updateLoadingStateForNav(navFrame) {
    if (!loadingState || loadingState.released) {
      return;
    }

    const navDocument = navFrame && navFrame.contentDocument;
    if (navDocument && navDocument.body && navDocument.body.dataset.ccxpLiteSidebarApplied === "true") {
      loadingState.navReady = true;
    }

    tryReleaseLoadingSprite();
  }

  function markMainReady() {
    if (!loadingState || loadingState.released) {
      return;
    }

    loadingState.mainReady = true;
    tryReleaseLoadingSprite();
  }

  function markLandingReady() {
    if (!loadingState || loadingState.released) {
      return;
    }

    loadingState.navReady = true;
    loadingState.mainReady = true;
    tryReleaseLoadingSprite();
  }

  function tryReleaseLoadingSprite() {
    if (!loadingState || loadingState.released) {
      return;
    }

    if (!loadingState.navReady || !loadingState.mainReady) {
      return;
    }

    if (loadingState.timerId) {
      window.clearTimeout(loadingState.timerId);
    }

    loadingState.released = true;
    releaseLoadingSprite(document);
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
    if (frame.dataset.ccxpLiteListenerAttached === "true") {
      return;
    }

    frame.addEventListener("load", callback);
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

  function simplifyMainFrame(mainFrame) {
    const mainDocument = mainFrame.contentDocument;

    if (!mainDocument || !mainDocument.head || !mainDocument.body) {
      retry();
      return;
    }

    ensureThemeDocument(mainDocument, "main");
    mainDocument.body.classList.add(TOKENS.mainClass);
    markMainReady();
  }

  function isSupportedInquirePath(targetDocument) {
    const pathName = ((targetDocument.location && targetDocument.location.pathname) || "").toLowerCase();
    return /\/ccxp\/inquire\/(?:index\.php)?\/?$/.test(pathName);
  }

  function isLandingPage(targetDocument) {
    if (!isSupportedInquirePath(targetDocument)) {
      return false;
    }

    return Boolean(getLoginForm(targetDocument) || hasLandingTabContent(targetDocument));
  }

  function hasLandingTabContent(targetDocument) {
    return Boolean(targetDocument.querySelector(".tab, .tabcontent"));
  }

  function getLoginForm(targetDocument) {
    const forms = Array.from(targetDocument.querySelectorAll("form"));

    return forms.find((form) => {
      const action = (form.getAttribute("action") || "").toLowerCase();
      const hasKnownAction = action.includes("pre_select_entry.php") || action.includes("select_entry.php");
      const hasCredentials = Boolean(form.querySelector("input[name='account']"))
        && Boolean(form.querySelector("input[name='passwd'], input[name='passwd2']"));
      return hasKnownAction || hasCredentials;
    }) || null;
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

    const loginForm = getLoginForm(targetDocument);
    const loginSourceCell = findLoginSourceCell(targetDocument, loginForm);
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

    const loginValidationState = captureLoginValidationState(targetDocument);

    ensureThemeDocument(targetDocument, "landing");

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

    if (loginForm) {
      loginSection.appendChild(loginForm);
    } else {
      moveChildNodes(loginSourceCell, loginSection);
    }
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
    restoreLoginValidationGuards(targetDocument, loginValidationState);
    targetDocument.body.dataset.ccxpLiteLandingApplied = "true";
    markLandingReady();
  }

  function captureLoginValidationState(targetDocument) {
    const fnstrField = targetDocument.querySelector("input[name='fnstr']");
    const rawFnstr = fnstrField ? fnstrField.value : "";
    const match = rawFnstr.match(/^(\d{8})-(\d+)$/);

    if (!match) {
      return { startedAt: Date.now() };
    }

    const dayPart = match[1];
    const seedPart = match[2];

    return {
      startedAt: Date.now(),
      fnstrDate: dayPart,
      fnstrSeed: seedPart
    };
  }

  function restoreLoginValidationGuards(targetDocument, state) {
    const fields = ["account", "passwd", "passwd2"]
      .map((name) => targetDocument.querySelector(`input[name='${name}']`))
      .filter(Boolean);

    if (fields.length === 0) {
      return;
    }

    const form = getLoginForm(targetDocument);
    if (!form || form.dataset.ccxpLiteValidationBound === "true") {
      return;
    }

    const startedAt = Number(state && state.startedAt) || Date.now();
    const onFieldActivity = () => {
      if (Date.now() - startedAt > 30 * 60 * 1000) {
        targetDocument.location.reload();
      }
    };

    ["click", "change", "keydown"].forEach((eventName) => {
      fields.forEach((field) => {
        field.addEventListener(eventName, onFieldActivity);
      });
    });

    form.addEventListener("submit", () => {
      ensureLoginSubmissionPayload(form, targetDocument);
    });

    form.dataset.ccxpLiteValidationBound = "true";
  }

  function ensureLoginSubmissionPayload(form, targetDocument) {
    if (!form) {
      return;
    }

    const normalizedAction = (form.getAttribute("action") || "").toLowerCase();
    if (normalizedAction.includes("select_entry.php") && !normalizedAction.includes("pre_select_entry.php")) {
      form.setAttribute("action", "pre_select_entry.php");
    }

    const authImage = form.querySelector("img[src*='auth_img.php?pwdstr=']");
    const tokenFromImage = extractPwdstrFromImage(authImage, targetDocument);
    let fnstrField = form.querySelector("input[name='fnstr']");

    if (!fnstrField && tokenFromImage) {
      fnstrField = targetDocument.createElement("input");
      fnstrField.type = "hidden";
      fnstrField.name = "fnstr";
      form.appendChild(fnstrField);
    }

    if (fnstrField && tokenFromImage && fnstrField.value !== tokenFromImage) {
      fnstrField.value = tokenFromImage;
    }
  }

  function extractPwdstrFromImage(imageNode, targetDocument) {
    if (!imageNode) {
      return "";
    }

    const rawSrc = imageNode.getAttribute("src") || "";

    try {
      const parsed = new URL(rawSrc, targetDocument.location && targetDocument.location.href ? targetDocument.location.href : window.location.href);
      return parsed.searchParams.get("pwdstr") || "";
    } catch (_error) {
      const match = rawSrc.match(/[?&]pwdstr=([^&]+)/i);
      return match ? decodeURIComponent(match[1]) : "";
    }
  }

  function createLandingSection(targetDocument, className) {
    const section = targetDocument.createElement("section");
    section.className = `ccxp-lite-landing-section ${className}`;
    return section;
  }

  function findLoginSourceCell(targetDocument, loginForm) {
    if (loginForm) {
      return loginForm.closest("td, table, section, article") || loginForm;
    }

    return Array.from(targetDocument.querySelectorAll("td, table, div, section, article"))
      .find((cell) => cell.querySelector("form"));
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

  attachAndApply();
})();
