(function bootstrapCcxpLiteInquireCaptcha(globalScope: typeof globalThis) {
  const { CCXP_LITE: namespace } = globalScope as Window & typeof globalThis;
  const loginCaptcha = namespace?.loginCaptcha;
  const loginLocale = namespace?.loginLocale;
  const shared = namespace?.shared;
  if (!loginCaptcha || !loginLocale) {
    return;
  }
  const targetDocument = globalScope.document;
  if (!isInquireCaptchaPage(targetDocument, loginLocale)) {
    return;
  }
  shared?.trackPageView?.(targetDocument, {
    page_surface: "inquire",
  });
  loginCaptcha.attachCaptchaAutofill(targetDocument, "inquire");
})(globalThis);

function isInquireCaptchaPage(targetDocument: Document, loginLocale: CcxpLiteLoginLocale) {
  if (loginLocale.isLoginPage(targetDocument)) {
    return false;
  }
  const hostName = targetDocument.location.hostname.toLowerCase();
  if (hostName !== "www.ccxp.nthu.edu.tw" && hostName !== "ccxp.nthu.edu.tw") {
    return false;
  }
  const pathName = targetDocument.location.pathname.toLowerCase();
  if (!pathName.includes("/ccxp/inquire/")) {
    return false;
  }
  return true;
}
