(function bootstrapCcxpLite() {
  const { shared, sidebar } = window.CCXP_LITE;
  const { TOKENS, STRINGS, ensureThemeDocument, createBrandImage, createBrandCopy, moveChildNodes, removeNode, isDocumentComplete } = shared;

  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const FRAMESET_COLUMNS = "288,*";
  const FRAMESET_ROWS = "0,*";

  let attempts = 0;

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
    attachFrameListener(frames.nav, () => sidebar.simplifySidebar(frames.nav, retry));
    attachFrameListener(frames.main, () => simplifyMainFrame(frames.main));
    removeHeader(frames.top);
    sidebar.simplifySidebar(frames.nav, retry);
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
  }

  function isLandingPage(targetDocument) {
    const pathName = ((targetDocument.location && targetDocument.location.pathname) || "").toLowerCase();
    const isSupportedPath = /\/ccxp\/inquire\/(?:index\.php)?\/?$/.test(pathName);

    if (!isSupportedPath) {
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

    form.dataset.ccxpLiteValidationBound = "true";
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
