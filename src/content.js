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
    const cannotLoginLink = findCannotLoginLink(targetDocument, utilityLinks);
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
    const headerSection = createLandingSection(targetDocument, "ccxp-lite-landing-header");
    const brandSection = createLandingSection(targetDocument, "ccxp-lite-landing-brand");
    const langSection = createLandingSection(targetDocument, "ccxp-lite-landing-lang");
    const loginSection = createLandingSection(targetDocument, "ccxp-lite-landing-login");
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

    normalizeLoginFormLayout(loginSection);
    removeLoginResetControls(loginSection);
    forceCaptchaLabelDisplay(loginSection);
    replaceLoginFormImageButtons(targetDocument, loginSection);
    alignCaptchaMediaRow(targetDocument, loginSection);
    enhancePasswordVisibilityToggle(targetDocument, loginSection);

    removeNode(findCalendarTable(loginSection));
    removeNode(loginSection.querySelector("#twcaseal")?.closest("table"));

    collapseLegacyThreeColumnRows(targetDocument.body);

    headerSection.appendChild(brandSection);
    if (languageLinks) {
      headerSection.appendChild(langSection);
    }

    const utilityHeaderLinks = buildHeaderUtilityLinks(targetDocument, utilityLinks, cannotLoginLink);
    if (utilityHeaderLinks) {
      if (languageLinks) {
        headerSection.insertBefore(utilityHeaderLinks, langSection);
      } else {
        headerSection.appendChild(utilityHeaderLinks);
      }
    }

    if (utilityLinks) {
      collapseLegacyUtilityRow(utilityLinks);
      removeNode(utilityLinks);
    }

    topSection.appendChild(headerSection);
    topSection.appendChild(loginSection);
    shell.appendChild(topSection);

    const tabsHeader = targetDocument.createElement("div");
    tabsHeader.className = "ccxp-lite-landing-tabs-header";
    tabsHeader.appendChild(tabNavigation);

    const supportLinks = buildLandingSupportLinks(targetDocument, serviceLink, cannotLoginLink);
    if (supportLinks) {
      tabsHeader.appendChild(supportLinks);
    }

    if (serviceLink) {
      collapseLegacyServiceRow(serviceLink);
    }

    if (cannotLoginLink) {
      collapseLegacyCannotLoginLink(cannotLoginLink);
    }

    tabsSection.appendChild(tabsHeader);
    tabContents.forEach((tabContent) => {
      collapseLegacyThreeColumnRows(tabContent);
      tabsSection.appendChild(tabContent);
    });

    wireLandingTabs(targetDocument, tabNavigation, tabContents);

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

  function wireLandingTabs(targetDocument, tabNavigation, tabContents) {
    if (!tabNavigation || !Array.isArray(tabContents) || tabContents.length === 0) {
      return;
    }

    const tabButtons = Array.from(tabNavigation.querySelectorAll("button, a[href^='#'], [role='tab']"));
    if (tabButtons.length === 0) {
      return;
    }

    const tabPanels = tabContents.map((panel, index) => {
      panel.id = panel.id || `ccxp-lite-tabpanel-${index + 1}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("tabindex", "0");
      return panel;
    });

    const resolvePanelByLegacyTarget = (button) => {
      const directControl = button.getAttribute("aria-controls");
      if (directControl) {
        return tabPanels.find((panel) => panel.id === directControl) || null;
      }

      const href = String(button.getAttribute("href") || "").trim();
      if (href.startsWith("#")) {
        const hashId = href.slice(1);
        const fromHash = tabPanels.find((panel) => panel.id === hashId);
        if (fromHash) {
          return fromHash;
        }
      }

      const legacyTarget = extractLegacyTabTarget(button);
      if (!legacyTarget) {
        return null;
      }

      return tabPanels.find((panel) => panel.id === legacyTarget) || null;
    };

    const buttonPanelMap = tabButtons.map((button, index) => {
      const panel = resolvePanelByLegacyTarget(button) || tabPanels[index] || null;
      return { button, panel };
    }).filter((entry) => Boolean(entry.panel));

    if (buttonPanelMap.length === 0) {
      return;
    }

    tabNavigation.setAttribute("role", "tablist");
    tabNavigation.setAttribute("aria-label", "Portal sections");

    const uniquePanels = Array.from(new Set(buttonPanelMap.map((entry) => entry.panel)));

    buttonPanelMap.forEach((entry, index) => {
      const { button, panel } = entry;
      const tabId = button.id || `ccxp-lite-tab-${index + 1}`;
      button.id = tabId;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panel.id);
      button.setAttribute("aria-selected", "false");
      button.setAttribute("tabindex", "-1");
      if (button.tagName === "BUTTON") {
        button.type = "button";
      }

      panel.setAttribute("aria-labelledby", tabId);
      panel.hidden = true;
      panel.style.display = "none";
    });

    uniquePanels.forEach((panel) => {
      panel.hidden = true;
      panel.style.display = "none";
    });

    const getActiveIndex = () => {
      const byButtonClass = buttonPanelMap.findIndex(({ button }) => button.classList.contains("active"));
      if (byButtonClass >= 0) {
        return byButtonClass;
      }

      const byPanelVisibility = buttonPanelMap.findIndex(({ panel }) => panel.style.display !== "none" && !panel.hidden);
      if (byPanelVisibility >= 0) {
        return byPanelVisibility;
      }

      return 0;
    };

    const activateTabAt = (targetIndex, options = {}) => {
      const safeIndex = Math.max(0, Math.min(targetIndex, buttonPanelMap.length - 1));

      buttonPanelMap.forEach((entry, index) => {
        const isActive = index === safeIndex;
        entry.button.classList.toggle("active", isActive);
        entry.button.setAttribute("aria-selected", isActive ? "true" : "false");
        entry.button.setAttribute("tabindex", isActive ? "0" : "-1");
        entry.panel.hidden = !isActive;
        entry.panel.style.display = isActive ? "block" : "none";
      });

      if (options.focusButton) {
        buttonPanelMap[safeIndex].button.focus();
      }
    };

    buttonPanelMap.forEach((entry, index) => {
      const { button } = entry;

      button.addEventListener("click", (event) => {
        event.preventDefault();
        activateTabAt(index);
      });

      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          activateTabAt((index + 1) % buttonPanelMap.length, { focusButton: true });
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          activateTabAt((index - 1 + buttonPanelMap.length) % buttonPanelMap.length, { focusButton: true });
        } else if (event.key === "Home") {
          event.preventDefault();
          activateTabAt(0, { focusButton: true });
        } else if (event.key === "End") {
          event.preventDefault();
          activateTabAt(buttonPanelMap.length - 1, { focusButton: true });
        }
      });
    });

    activateTabAt(getActiveIndex());
  }

  function extractLegacyTabTarget(button) {
    const onclickValue = String(button.getAttribute("onclick") || "");
    const targetMatch = onclickValue.match(/['\"]([^'\"]+)['\"]/);
    return targetMatch ? targetMatch[1] : "";
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
    const tables = Array.from(targetDocument.querySelectorAll("table"));

    const preferred = tables.find((table) => {
      if (table.closest(".tabcontent")) {
        return false;
      }

      const heading = table.querySelector(".board_item");
      if (!heading) {
        return false;
      }

      const headingText = normalizeAnnouncementHeading(heading.textContent);
      return headingText === "系統公告" || headingText === "system notice";
    });

    if (preferred) {
      return preferred;
    }

    return tables.find((table) => {
      const heading = table.querySelector(".board_item");
      if (!heading) {
        return false;
      }

      const headingText = normalizeAnnouncementHeading(heading.textContent);
      return headingText === "系統公告" || headingText === "system notice";
    }) || null;
  }

  function normalizeAnnouncementHeading(rawText) {
    return String(rawText || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function findUtilityLinksTable(targetDocument) {
    const anchor = targetDocument.querySelector(
      "a[href*='ccc.site.nthu.edu.tw'], a[href*='aisccc.site.nthu.edu.tw'], a[href*='nthu-en.site.nthu.edu.tw']"
    );
    return anchor ? anchor.closest("table") : null;
  }

  function findServiceLink(targetDocument) {
    const anchor = targetDocument.querySelector("a[href*='inquire_cpr.html']");
    return anchor ? (anchor.closest("div") || anchor) : null;
  }

  function findCannotLoginLink(targetDocument, utilityLinksTable) {
    const isCannotLoginAnchor = (anchor) => {
      if (!anchor) {
        return false;
      }

      const href = String(anchor.getAttribute("href") || "").toLowerCase();
      if (href.includes("inquire_cpr.html") || href.includes("forget.php")) {
        return true;
      }

      return isCannotLoginLabel(anchor.textContent);
    };

    if (!utilityLinksTable) {
      const fallbackAnchor = targetDocument.querySelector("a[href*='forget.php'], a[href*='inquire_cpr.html']");
      return fallbackAnchor && isCannotLoginAnchor(fallbackAnchor) ? fallbackAnchor : null;
    }

    const anchors = Array.from(utilityLinksTable.querySelectorAll("a[href]"));
    const fromUtility = anchors.find((anchor) => isCannotLoginAnchor(anchor));
    if (fromUtility) {
      return fromUtility;
    }

    const fallbackAnchor = targetDocument.querySelector("a[href*='forget.php'], a[href*='inquire_cpr.html']");
    return fallbackAnchor && isCannotLoginAnchor(fallbackAnchor) ? fallbackAnchor : null;
  }

  function isCannotLoginLabel(label) {
    const normalized = String(label || "")
      .replace(/\s+/g, "")
      .toLowerCase();

    return normalized.includes("無法登入")
      || normalized.includes("无法登入")
      || normalized.includes("cannotlogin")
      || normalized.includes("can'tlogin")
      || normalized.includes("cantlogin");
  }

  function buildServicePhoneLink(targetDocument, serviceLinkNode) {
    if (!serviceLinkNode) {
      return null;
    }

    const sourceAnchor = serviceLinkNode.matches("a[href]")
      ? serviceLinkNode
      : serviceLinkNode.querySelector("a[href]");

    return buildLandingSupportLink(targetDocument, sourceAnchor, "服務電話", "phone");
  }

  function buildCannotLoginLink(targetDocument, sourceAnchor) {
    if (!sourceAnchor) {
      return null;
    }

    const labelText = String(sourceAnchor.textContent || "").trim() || "無法登入";
    return buildLandingSupportLink(targetDocument, sourceAnchor, labelText, "external");
  }

  function buildLandingSupportLink(targetDocument, sourceAnchor, labelText, iconType) {
    if (!sourceAnchor) {
      return null;
    }

    const anchor = targetDocument.createElement("a");
    anchor.className = "ccxp-lite-landing-service-link";
    anchor.href = sourceAnchor.href;
    anchor.target = sourceAnchor.target || "_blank";
    anchor.rel = "noopener noreferrer";
    if (iconType === "phone") {
      anchor.appendChild(createLandingPhoneIcon(targetDocument));
    } else {
      anchor.appendChild(createLandingExternalLinkIcon(targetDocument));
    }

    const label = targetDocument.createElement("span");
    label.textContent = labelText;
    anchor.appendChild(label);

    return anchor;
  }

  function buildLandingSupportLinks(targetDocument, serviceLinkNode, cannotLoginAnchor) {
    const servicePhoneLink = buildServicePhoneLink(targetDocument, serviceLinkNode);
    const cannotLoginLink = buildCannotLoginLink(targetDocument, cannotLoginAnchor);

    if (!servicePhoneLink && !cannotLoginLink) {
      return null;
    }

    const wrap = targetDocument.createElement("div");
    wrap.className = "ccxp-lite-landing-support-links";

    if (servicePhoneLink) {
      wrap.appendChild(servicePhoneLink);
    }

    if (cannotLoginLink) {
      wrap.appendChild(cannotLoginLink);
    }

    return wrap;
  }

  function collapseLegacyServiceRow(serviceLinkNode) {
    if (!serviceLinkNode) {
      return;
    }

    const sourceAnchor = serviceLinkNode.matches("a[href]")
      ? serviceLinkNode
      : serviceLinkNode.querySelector("a[href*='inquire_cpr.html'], a[href]");

    if (!sourceAnchor) {
      return;
    }

    const sourceRow = sourceAnchor.closest("tr");
    if (!sourceRow) {
      removeNode(sourceAnchor.closest("div") || sourceAnchor);
      return;
    }

    const previousRow = sourceRow.previousElementSibling;
    const nextRow = sourceRow.nextElementSibling;

    removeNode(sourceRow);

    if (isLikelySpacerRow(previousRow)) {
      removeNode(previousRow);
    }

    if (isLikelySpacerRow(nextRow)) {
      removeNode(nextRow);
    }
  }

  function collapseLegacyCannotLoginLink(cannotLoginAnchor) {
    if (!cannotLoginAnchor) {
      return;
    }

    const sourceAnchor = cannotLoginAnchor.matches("a[href]")
      ? cannotLoginAnchor
      : cannotLoginAnchor.closest("a[href]");

    if (!sourceAnchor) {
      return;
    }

    removeAdjacentLegacyBreak(sourceAnchor, "previous");
    removeAdjacentLegacyBreak(sourceAnchor, "next");
    removeNode(sourceAnchor);
  }

  function removeAdjacentLegacyBreak(node, direction) {
    const sibling = direction === "previous"
      ? node.previousSibling
      : node.nextSibling;

    if (!sibling) {
      return;
    }

    if (sibling.nodeType === Node.TEXT_NODE) {
      const normalizedText = String(sibling.textContent || "").replace(/\u00a0/g, " ").trim();
      if (normalizedText.length === 0) {
        removeNode(sibling);
      }
      return;
    }

    if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === "BR") {
      removeNode(sibling);
    }
  }

  function buildHeaderUtilityLinks(targetDocument, utilityLinksTable, excludedAnchor) {
    if (!utilityLinksTable) {
      return null;
    }

    const excludedHref = excludedAnchor
      ? String(excludedAnchor.getAttribute("href") || "")
      : "";

    const anchors = Array.from(utilityLinksTable.querySelectorAll("a[href]"))
      .filter((anchor) => anchor !== excludedAnchor)
      .filter((anchor) => {
        const href = String(anchor.getAttribute("href") || "");
        return href && href !== excludedHref && !href.toLowerCase().includes("inquire_cpr.html");
      })
      .filter((anchor) => anchor.textContent && anchor.textContent.trim().length > 0)
      .slice(0, 3);

    if (anchors.length === 0) {
      return null;
    }

    const nav = targetDocument.createElement("nav");
    nav.className = "ccxp-lite-landing-utility";
    nav.setAttribute("aria-label", "External links");

    anchors.forEach((sourceAnchor, index) => {
      const anchor = targetDocument.createElement("a");
      anchor.href = sourceAnchor.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.className = "ccxp-lite-landing-utility-link";
      anchor.textContent = sourceAnchor.textContent.trim();
      anchor.appendChild(createLandingExternalLinkIcon(targetDocument));
      nav.appendChild(anchor);

      if (index < anchors.length - 1) {
        const separator = targetDocument.createElement("span");
        separator.className = "ccxp-lite-landing-utility-separator";
        separator.textContent = "|";
        nav.appendChild(separator);
      }
    });

    return nav;
  }

  function createLandingExternalLinkIcon(targetDocument) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "ccxp-lite-landing-link-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    ["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"].forEach((pathData) => {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.appendChild(path);
    });

    return icon;
  }

  function createLandingPhoneIcon(targetDocument) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "ccxp-lite-landing-phone-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.19 19a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L8 9.93a16 16 0 0 0 6.07 6.07l1.5-1.25a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92z"
    );
    icon.appendChild(path);

    return icon;
  }

  function collapseLegacyUtilityRow(utilityLinksTable) {
    if (!utilityLinksTable) {
      return;
    }

    const sourceCell = utilityLinksTable.closest("td");
    if (!sourceCell) {
      return;
    }

    const sourceRow = sourceCell.closest("tr");
    if (!sourceRow) {
      return;
    }

    removeNode(sourceCell);

    const rowCells = Array.from(sourceRow.children).filter((node) => node.tagName === "TD");
    rowCells.forEach((cell) => {
      if (isLegacySpacerCell(cell)) {
        removeNode(cell);
      }
    });

    const remainingCells = Array.from(sourceRow.children).filter((node) => node.tagName === "TD");
    if (remainingCells.length === 1) {
      remainingCells[0].setAttribute("width", "100%");
      remainingCells[0].style.width = "100%";
    }
  }

  function isLikelySpacerRow(row) {
    if (!row || row.tagName !== "TR") {
      return false;
    }

    const cells = Array.from(row.children).filter((node) => node.tagName === "TD");
    if (cells.length === 0) {
      return false;
    }

    const hasInteractiveContent = cells.some((cell) => cell.querySelector("a, button, input, select, textarea, table, iframe"));
    if (hasInteractiveContent) {
      return false;
    }

    const text = cells
      .map((cell) => String(cell.textContent || "").replace(/\u00a0/g, " "))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length > 0) {
      return false;
    }

    const rowHeight = String(row.getAttribute("height") || "").trim();
    const cellHasHeight = cells.some((cell) => String(cell.getAttribute("height") || "").trim().length > 0);

    return rowHeight.length > 0 || cellHasHeight;
  }

  function isLegacySpacerCell(cell) {
    if (!cell) {
      return false;
    }

    const widthText = String(cell.getAttribute("width") || "").trim().toLowerCase();
    const normalizedText = String(cell.textContent || "").replace(/\u00a0/g, " ").trim();

    if ((widthText === "3%" || widthText === "3") && normalizedText.length === 0) {
      return true;
    }

    return normalizedText.length === 0 && cell.querySelector("table, iframe, form, input, button, a") === null;
  }

  function collapseLegacyThreeColumnRows(rootNode) {
    if (!rootNode) {
      return;
    }

    const rows = Array.from(rootNode.querySelectorAll("tr"));

    rows.forEach((row) => {
      if (shouldSkipLegacyRowCollapse(row)) {
        return;
      }

      const cells = Array.from(row.children).filter((node) => node.tagName === "TD");
      if (cells.length < 2) {
        return;
      }

      const leftCell = cells.find((cell) => isLegacyWideLeftCell(cell));
      const rightCell = cells.find((cell) => isLegacyRightPanelCell(cell));

      if (!leftCell || !rightCell) {
        return;
      }

      if (!isLikelyEmptyCell(leftCell)) {
        return;
      }

      const spacerCell = cells.find((cell) => isLegacySpacerCell(cell) || normalizeLegacyWidth(cell.getAttribute("width") || cell.style.width) === "3%");

      removeNode(leftCell);
      removeNode(spacerCell);

      rightCell.removeAttribute("width");
      rightCell.style.width = "100%";
      rightCell.style.minWidth = "0";
      rightCell.colSpan = Math.max(1, Number(rightCell.colSpan || 1));

      Array.from(row.children)
        .filter((node) => node.tagName === "TD")
        .forEach((cell) => {
          if (cell !== rightCell) {
            cell.removeAttribute("width");
          }
        });
    });
  }

  function isLegacyWideLeftCell(cell) {
    if (!cell) {
      return false;
    }

    const widthText = normalizeLegacyWidth(cell.getAttribute("width") || cell.style.width);
    const styleText = String(cell.getAttribute("style") || "").toLowerCase();
    return widthText === "60%" && styleText.includes("min-width") && styleText.includes("30em");
  }

  function isLegacyRightPanelCell(cell) {
    if (!cell) {
      return false;
    }

    const widthText = normalizeLegacyWidth(cell.getAttribute("width") || cell.style.width);
    return widthText === "35%";
  }

  function isLikelyEmptyCell(cell) {
    if (!cell) {
      return false;
    }

    const normalizedText = String(cell.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (normalizedText.length > 0) {
      return false;
    }

    return cell.querySelector("img, iframe, form, input, button, select, textarea, a, object, embed, video, audio, table, div, span, ul, ol, p") === null;
  }

  function shouldSkipLegacyRowCollapse(row) {
    if (!row) {
      return true;
    }

    const table = row.closest("table");
    if (!table) {
      return false;
    }

    if (table.classList.contains("ccxp-lite-announcement-table")) {
      return true;
    }

    if (table.querySelector(".board_item, .board_subject, .board_0, .board_1")) {
      return true;
    }

    return false;
  }

  function normalizeLegacyWidth(rawValue) {
    return String(rawValue || "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function enhancePasswordVisibilityToggle(targetDocument, rootNode) {
    const passwordFields = Array.from(rootNode.querySelectorAll("input[name='passwd'], input[type='password']:not([name='passwd2'])"));
    const seen = new Set();

    passwordFields.forEach((field) => {
      if (!field || seen.has(field) || field.dataset.ccxpLitePasswordToggle === "true") {
        return;
      }

      seen.add(field);
      field.type = "password";
      removeRedundantPasswordLabelEyeIcon(field);

      const wrapper = targetDocument.createElement("span");
      wrapper.className = "ccxp-lite-password-field";

      if (!field.parentNode) {
        return;
      }

      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);

      const toggleButton = targetDocument.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = "ccxp-lite-password-toggle";
      toggleButton.setAttribute("aria-label", "Show password");
      toggleButton.appendChild(createPasswordVisibilityIcon(targetDocument, false));

      toggleButton.addEventListener("click", () => {
        const isHidden = field.type !== "text";
        field.type = isHidden ? "text" : "password";
        toggleButton.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
        toggleButton.replaceChildren(createPasswordVisibilityIcon(targetDocument, isHidden));
      });

      wrapper.appendChild(toggleButton);
      field.dataset.ccxpLitePasswordToggle = "true";
    });
  }

  function removeRedundantPasswordLabelEyeIcon(passwordField) {
    if (!passwordField) {
      return;
    }

    const inlineScope = passwordField.closest("form") || passwordField.parentElement;
    if (inlineScope) {
      const legacyInlineToggles = Array.from(inlineScope.querySelectorAll("svg#showPassword, svg#hidePassword, svg[onclick*='togglePassword']"));

      legacyInlineToggles.forEach((node) => {
        const relation = node.compareDocumentPosition(passwordField);
        const isBeforeField = Boolean(relation & Node.DOCUMENT_POSITION_FOLLOWING);

        if (isBeforeField) {
          node.remove();
        }
      });
    }

    const row = passwordField.closest("tr");
    if (!row || row.dataset.ccxpLitePasswordLabelCleaned === "true") {
      return;
    }

    const labelCell = row.querySelector("th, td");
    if (!labelCell) {
      return;
    }

    const labelText = String(labelCell.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    const isPasswordLabel = /(密碼|password)/i.test(labelText);

    if (isPasswordLabel) {
      Array.from(labelCell.querySelectorAll("svg")).forEach((node) => node.remove());

      Array.from(labelCell.querySelectorAll("a, button, span, i")).forEach((node) => {
        const text = String(node.textContent || "")
          .replace(/\s+/g, " ")
          .trim();
        const hasOnlyIconChild = node.querySelector("svg, img, i") !== null;

        if (!text && hasOnlyIconChild) {
          node.remove();
        }
      });
    }

    const eyePattern = /(eye|show|hide|visible|visibility|view|顯示|隱藏|密碼)/i;
    const candidates = Array.from(labelCell.querySelectorAll("img, svg, i, span, a, button"));

    candidates.forEach((node) => {
      const hints = [
        node.getAttribute("alt"),
        node.getAttribute("title"),
        node.getAttribute("aria-label"),
        node.getAttribute("class"),
        node.getAttribute("src"),
        node.textContent
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      if (hints.includes("👁") || eyePattern.test(hints)) {
        node.remove();
      }
    });

    row.dataset.ccxpLitePasswordLabelCleaned = "true";
  }

  function normalizeLoginFormLayout(rootNode) {
    const fields = Array.from(rootNode.querySelectorAll("form input"))
      .filter((field) => {
        const inputType = (field.getAttribute("type") || "text").toLowerCase();
        if (["hidden", "submit", "button", "image", "checkbox", "radio", "file"].includes(inputType)) {
          return false;
        }

        return Boolean(field.closest("tr"));
      });

    fields.forEach((field) => {
      const row = field.closest("tr");
      if (!row || row.dataset.ccxpLiteLoginRow === "true") {
        return;
      }

      row.classList.add("ccxp-lite-login-field-row");
      row.dataset.ccxpLiteLoginRow = "true";

      const table = row.closest("table");
      if (table) {
        table.classList.add("ccxp-lite-login-form-table");
      }
    });
  }

  function removeLoginResetControls(rootNode) {
    const resetControls = Array.from(rootNode.querySelectorAll("form input[type='reset'], form button[type='reset']"));

    resetControls.forEach((controlNode) => {
      removeNode(controlNode);
    });
  }

  function forceCaptchaLabelDisplay(rootNode) {
    const captchaLabelPattern = /(驗證碼|captcha)/i;
    const spans = Array.from(rootNode.querySelectorAll("span"));

    spans.forEach((spanNode) => {
      const labelText = String(spanNode.textContent || "").replace(/\s+/g, " ").trim();
      if (!labelText || !captchaLabelPattern.test(labelText)) {
        return;
      }

      spanNode.style.display = "block";
    });
  }

  function replaceLoginFormImageButtons(targetDocument, rootNode) {
    const imageSubmitInputs = Array.from(rootNode.querySelectorAll("form input[type='image']"));

    imageSubmitInputs.forEach((inputNode) => {
      if (inputNode.dataset.ccxpLiteImageButtonReplaced === "true") {
        return;
      }

      if (isVerificationAudioControl(inputNode)) {
        const audioButton = createAudioIconButtonFromImageInput(targetDocument, inputNode);
        inputNode.replaceWith(audioButton);
        audioButton.dataset.ccxpLiteImageButtonReplaced = "true";
        return;
      }

      if (isAdjacentLoginClearControl(inputNode)) {
        removeNode(inputNode);
        return;
      }

      const label = resolveLegacyImageButtonLabel(inputNode);
      if (!label) {
        return;
      }

      if (isClearActionLabel(label)) {
        removeNode(inputNode);
        return;
      }

      const button = targetDocument.createElement("button");
      button.type = "submit";
      button.className = "button ccxp-lite-image-action-button";
      button.textContent = label;

      if (inputNode.id) {
        button.id = inputNode.id;
      }

      if (inputNode.name) {
        button.name = inputNode.name;
      }

      if (inputNode.title) {
        button.title = inputNode.title;
      }

      if (inputNode.className) {
        button.className = `${button.className} ${inputNode.className}`.trim();
      }

      if (inputNode.disabled) {
        button.disabled = true;
      }

      ["onclick", "formaction", "formmethod", "formenctype", "formtarget", "tabindex"].forEach((attributeName) => {
        const value = inputNode.getAttribute(attributeName);
        if (value) {
          button.setAttribute(attributeName, value);
        }
      });

      if (inputNode.hasAttribute("formnovalidate")) {
        button.setAttribute("formnovalidate", "");
      }

      inputNode.replaceWith(button);
      button.dataset.ccxpLiteImageButtonReplaced = "true";
    });

    const imageAnchors = Array.from(rootNode.querySelectorAll("form a > img[alt]"));
    imageAnchors.forEach((imageNode) => {
      const anchor = imageNode.closest("a");
      if (!anchor || anchor.dataset.ccxpLiteImageButtonReplaced === "true") {
        return;
      }

      if (isVerificationAudioControl(imageNode)) {
        anchor.classList.add("ccxp-lite-audio-icon-link");
        anchor.setAttribute("aria-label", resolveLegacyImageButtonLabel(imageNode) || "Play verification audio");
        anchor.replaceChildren(createAudioIcon(targetDocument));
        anchor.dataset.ccxpLiteImageButtonReplaced = "true";
        return;
      }

      if (isAdjacentLoginClearControl(imageNode)) {
        removeNode(anchor);
        return;
      }

      const label = resolveLegacyImageButtonLabel(imageNode);
      if (!label) {
        return;
      }

      if (isClearActionLabel(label)) {
        removeNode(anchor);
        return;
      }

      anchor.classList.add("ccxp-lite-image-link-button");
      anchor.replaceChildren(targetDocument.createTextNode(label));
      anchor.dataset.ccxpLiteImageButtonReplaced = "true";
    });
  }

  function alignCaptchaMediaRow(targetDocument, rootNode) {
    const captchaImages = Array.from(rootNode.querySelectorAll("img[src*='auth_img.php']"));

    captchaImages.forEach((captchaImage) => {
      const host = captchaImage.parentElement;
      if (!host) {
        return;
      }

      const audioControl = host.querySelector(".ccxp-lite-audio-icon-button, .ccxp-lite-audio-icon-link");
      if (!audioControl) {
        return;
      }

      const rowNode = captchaImage.closest("tr");
      if (rowNode) {
        rowNode.classList.add("ccxp-lite-captcha-row");
      }

      let mediaRow = host.querySelector(":scope > .ccxp-lite-captcha-media-row");
      if (!mediaRow) {
        mediaRow = targetDocument.createElement("span");
        mediaRow.className = "ccxp-lite-captcha-media-row";
        host.insertBefore(mediaRow, captchaImage);
      }

      if (captchaImage.parentNode !== mediaRow) {
        mediaRow.appendChild(captchaImage);
      }

      if (audioControl.parentNode !== mediaRow) {
        mediaRow.appendChild(audioControl);
      }
    });
  }

  function resolveLegacyImageButtonLabel(node) {
    if (!node) {
      return "";
    }

    const explicitAlt = normalizeLegacyButtonLabel(node.getAttribute("alt"));
    if (explicitAlt) {
      return explicitAlt;
    }

    if (node.tagName && node.tagName.toLowerCase() === "input") {
      const parentForm = node.form;
      const pairedImage = parentForm
        ? parentForm.querySelector(`img[alt][src='${cssEscape(node.getAttribute("src") || "")}]`)
        : null;
      const pairedAlt = normalizeLegacyButtonLabel(pairedImage && pairedImage.getAttribute("alt"));
      if (pairedAlt) {
        return pairedAlt;
      }
    }

    const titleLabel = normalizeLegacyButtonLabel(node.getAttribute("title"));
    if (titleLabel) {
      return titleLabel;
    }

    return "";
  }

  function normalizeLegacyButtonLabel(rawLabel) {
    return String(rawLabel || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isClearActionLabel(label) {
    const normalized = String(label || "")
      .replace(/\s+/g, "")
      .toLowerCase();

    return normalized.includes("清除")
      || normalized.includes("clear")
      || normalized.includes("重填")
      || normalized.includes("reset");
  }

  function isVerificationAudioControl(node) {
    if (!node) {
      return false;
    }

    const row = node.closest("tr");
    if (row && row.querySelector("input[name='passwd2']")) {
      return true;
    }

    const hintText = [
      node.getAttribute("alt"),
      node.getAttribute("title"),
      node.getAttribute("src"),
      node.getAttribute("onclick")
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    return /(voice|audio|sound|speak|listen|語音|朗讀|播放)/.test(hintText);
  }

  function isAdjacentLoginClearControl(node) {
    if (!node) {
      return false;
    }

    const row = node.closest("tr");
    if (!row || row.querySelector("input[name='passwd2']")) {
      return false;
    }

    if (isClearLikeControl(node)) {
      return true;
    }

    const controls = collectLegacyActionControls(row);
    if (controls.length < 2) {
      return false;
    }

    const loginIndex = controls.findIndex((controlNode) => isLoginLikeControl(controlNode));
    const currentIndex = controls.findIndex((controlNode) => controlNode === node || controlNode.contains(node));

    if (loginIndex < 0 || currentIndex < 0 || currentIndex <= loginIndex) {
      return false;
    }

    const isTwoImagePair = controls.length === 2
      && controls.every((controlNode) => isImageActionControl(controlNode));

    return isTwoImagePair;
  }

  function collectLegacyActionControls(row) {
    return Array.from(row.querySelectorAll("input[type='image'], input[type='submit'], input[type='reset'], button, a > img"))
      .filter((node) => {
        if (node.matches("a > img")) {
          return true;
        }

        const type = String(node.getAttribute("type") || "").toLowerCase();
        if (node.tagName === "BUTTON" && !type) {
          return true;
        }

        return ["image", "submit", "reset", "button"].includes(type);
      });
  }

  function isImageActionControl(node) {
    if (!node) {
      return false;
    }

    if (node.matches("a > img")) {
      return true;
    }

    return String(node.getAttribute("type") || "").toLowerCase() === "image";
  }

  function isLoginLikeControl(node) {
    const hints = extractControlHints(node);
    return /(登入|login|sign\s*-?\s*in|submit)/i.test(hints);
  }

  function isClearLikeControl(node) {
    const type = String(node.getAttribute("type") || "").toLowerCase();
    if (type === "reset") {
      return true;
    }

    const hints = extractControlHints(node);
    return /(清除|重填|clear|reset)/i.test(hints);
  }

  function extractControlHints(node) {
    const anchor = node.matches("a > img") ? node.closest("a") : null;

    return [
      node.getAttribute("alt"),
      node.getAttribute("title"),
      node.getAttribute("name"),
      node.getAttribute("id"),
      node.getAttribute("value"),
      node.getAttribute("src"),
      node.getAttribute("onclick"),
      node.textContent,
      anchor && anchor.getAttribute("href"),
      anchor && anchor.getAttribute("onclick"),
      anchor && anchor.textContent
    ]
      .map((value) => String(value || ""))
      .join(" ")
      .toLowerCase();
  }

  function createAudioIconButtonFromImageInput(targetDocument, inputNode) {
    const button = targetDocument.createElement("button");
    button.type = "button";
    button.className = "ccxp-lite-audio-icon-button";
    button.appendChild(createAudioIcon(targetDocument));

    const label = resolveLegacyImageButtonLabel(inputNode) || "Play verification audio";
    button.setAttribute("aria-label", label);
    button.title = label;

    if (inputNode.id) {
      button.id = inputNode.id;
    }

    if (inputNode.className) {
      button.className = `${button.className} ${inputNode.className}`.trim();
    }

    if (inputNode.disabled) {
      button.disabled = true;
    }

    ["onclick", "tabindex"].forEach((attributeName) => {
      const value = inputNode.getAttribute(attributeName);
      if (value) {
        button.setAttribute(attributeName, value);
      }
    });

    return button;
  }

  function createAudioIcon(targetDocument) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    ["M11 5 6 9H2v6h4l5 4z", "M15.5 8.5a5 5 0 0 1 0 7", "M18.5 5.5a9 9 0 0 1 0 13"].forEach((pathData) => {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.appendChild(path);
    });

    return icon;
  }

  function cssEscape(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
  }

  function createPasswordVisibilityIcon(targetDocument, visible) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    if (visible) {
      [
        "M10.733 5.076A10.744 10.744 0 0 1 12 5c4.596 0 8.51 2.934 9.938 7a10.454 10.454 0 0 1-1.077 2.167",
        "M14.084 14.158a3 3 0 0 1-4.242-4.242",
        "M17.479 17.499A10.75 10.75 0 0 1 12 19c-4.596 0-8.51-2.934-9.938-7a10.525 10.525 0 0 1 4.423-5.29",
        "M2 2l20 20"
      ].forEach((pathData) => {
        const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        icon.appendChild(path);
      });
    } else {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0");
      icon.appendChild(path);

      const circle = targetDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "3");
      icon.appendChild(circle);
    }

    return icon;
  }

  attachAndApply();
})();
