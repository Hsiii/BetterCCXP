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
    const rebuiltAnnouncementTable = buildAnnouncementTableFromHtml(targetDocument, announcementTable);
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
    replaceLoginFormImageButtons(targetDocument, loginSection);
    enhancePasswordVisibilityToggle(targetDocument, loginSection);

    removeNode(findCalendarTable(loginSection));
    removeNode(loginSection.querySelector("#twcaseal")?.closest("table"));

    headerSection.appendChild(brandSection);
    if (languageLinks) {
      headerSection.appendChild(langSection);
    }

    const utilityHeaderLinks = buildHeaderUtilityLinks(targetDocument, utilityLinks);
    if (utilityHeaderLinks) {
      if (languageLinks) {
        headerSection.insertBefore(utilityHeaderLinks, langSection);
      } else {
        headerSection.appendChild(utilityHeaderLinks);
      }

      removeNode(utilityLinks);
    }

    topSection.appendChild(headerSection);
    topSection.appendChild(loginSection);
    shell.appendChild(topSection);

    tabsSection.appendChild(tabNavigation);
    tabContents.forEach((tabContent) => {
      tabsSection.appendChild(tabContent);
    });

    if (serviceLink) {
      serviceLink.classList.add("ccxp-lite-landing-service");
      tabsSection.appendChild(serviceLink);
    }

    shell.appendChild(tabsSection);

    if (rebuiltAnnouncementTable) {
      noticesSection.appendChild(rebuiltAnnouncementTable);
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

  function buildAnnouncementTableFromHtml(targetDocument, sourceTable) {
    if (!sourceTable) {
      return null;
    }

    const titleText = resolveAnnouncementTitle(sourceTable);
    const sourceRows = Array.from(sourceTable.querySelectorAll("tr"));
    const headerSourceRow = sourceRows.find((row) => row.querySelector(".board_subject") || row.matches(".board_subject"));
    const dataSourceRows = sourceRows.filter((row) => isAnnouncementDataRow(row));

    if (!headerSourceRow && dataSourceRows.length === 0) {
      const fallback = sourceTable.cloneNode(true);
      fallback.classList.add("ccxp-lite-announcement-table");
      return fallback;
    }

    const table = targetDocument.createElement("table");
    table.className = "ccxp-lite-announcement-table";

    if (titleText) {
      const caption = targetDocument.createElement("caption");
      caption.className = "ccxp-lite-announcement-title";
      caption.textContent = titleText;
      table.appendChild(caption);
    }

    const headerCellSources = getAnnouncementCells(headerSourceRow || dataSourceRows[0]);
    if (headerCellSources.length > 0) {
      const thead = targetDocument.createElement("thead");
      const headerRow = targetDocument.createElement("tr");
      headerCellSources.forEach((sourceCell, index) => {
        const headerCell = targetDocument.createElement("th");
        copyCellMarkup(sourceCell, headerCell);
        headerCell.classList.add(index === 0 ? "ccxp-lite-announcement-col-date" : "ccxp-lite-announcement-col-content");
        headerRow.appendChild(headerCell);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
    }

    const tbody = targetDocument.createElement("tbody");
    const bodyRows = headerSourceRow ? dataSourceRows : dataSourceRows.slice(1);
    bodyRows.forEach((sourceRow, rowIndex) => {
      const cells = getAnnouncementCells(sourceRow);
      if (cells.length === 0) {
        return;
      }

      const bodyRow = targetDocument.createElement("tr");
      bodyRow.className = rowIndex % 2 === 0 ? "ccxp-lite-announcement-row-even" : "ccxp-lite-announcement-row-odd";
      cells.forEach((sourceCell, index) => {
        const bodyCell = targetDocument.createElement("td");
        copyCellMarkup(sourceCell, bodyCell);
        bodyCell.classList.add(index === 0 ? "ccxp-lite-announcement-col-date" : "ccxp-lite-announcement-col-content");
        bodyRow.appendChild(bodyCell);
      });
      tbody.appendChild(bodyRow);
    });

    table.appendChild(tbody);
    return table;
  }

  function resolveAnnouncementTitle(sourceTable) {
    const headingNode = sourceTable.querySelector(".board_item");
    if (headingNode && headingNode.textContent) {
      return headingNode.textContent.replace(/\s+/g, " ").trim();
    }

    return "系統公告";
  }

  function isAnnouncementDataRow(row) {
    if (!row) {
      return false;
    }

    if (row.querySelector(".board_0, .board_1") || row.matches(".board_0, .board_1")) {
      return true;
    }

    const cells = getAnnouncementCells(row);
    if (cells.length < 2) {
      return false;
    }

    return cells.some((cell) => Boolean(cell.querySelector("a")))
      || /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(row.textContent || "");
  }

  function getAnnouncementCells(row) {
    if (!row) {
      return [];
    }

    return Array.from(row.children)
      .filter((node) => node && (node.tagName === "TD" || node.tagName === "TH"));
  }

  function copyCellMarkup(sourceCell, targetCell) {
    if (!sourceCell || !targetCell) {
      return;
    }

    targetCell.innerHTML = sourceCell.innerHTML;
    const colspan = sourceCell.getAttribute("colspan");
    if (colspan) {
      targetCell.setAttribute("colspan", colspan);
    }
    const rowspan = sourceCell.getAttribute("rowspan");
    if (rowspan) {
      targetCell.setAttribute("rowspan", rowspan);
    }
    const align = sourceCell.getAttribute("align");
    if (align) {
      targetCell.setAttribute("align", align);
    }
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

  function buildHeaderUtilityLinks(targetDocument, utilityLinksTable) {
    if (!utilityLinksTable) {
      return null;
    }

    const anchors = Array.from(utilityLinksTable.querySelectorAll("a[href]"))
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

  function enhancePasswordVisibilityToggle(targetDocument, rootNode) {
    const passwordFields = Array.from(rootNode.querySelectorAll("input[name='passwd'], input[type='password']:not([name='passwd2'])"));
    const seen = new Set();

    passwordFields.forEach((field) => {
      if (!field || seen.has(field) || field.dataset.ccxpLitePasswordToggle === "true") {
        return;
      }

      seen.add(field);
      field.type = "password";

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

  function normalizeLoginFormLayout(rootNode) {
    const fields = Array.from(rootNode.querySelectorAll("input[name='account'], input[name='passwd'], input[name='passwd2']"));

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

  function replaceLoginFormImageButtons(targetDocument, rootNode) {
    const imageSubmitInputs = Array.from(rootNode.querySelectorAll("form input[type='image']"));

    imageSubmitInputs.forEach((inputNode) => {
      if (inputNode.dataset.ccxpLiteImageButtonReplaced === "true") {
        return;
      }

      const label = resolveLegacyImageButtonLabel(inputNode);
      if (!label) {
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

      const label = resolveLegacyImageButtonLabel(imageNode);
      if (!label) {
        return;
      }

      anchor.classList.add("ccxp-lite-image-link-button");
      anchor.replaceChildren(targetDocument.createTextNode(label));
      anchor.dataset.ccxpLiteImageButtonReplaced = "true";
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
