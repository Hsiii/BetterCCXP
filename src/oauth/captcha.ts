(function bootstrapCcxpLiteOauthCaptcha(globalScope: typeof globalThis) {
  const { CCXP_LITE: namespace } = globalScope as Window & typeof globalThis;
  const loginCaptcha = namespace?.loginCaptcha;
  const shared = namespace?.shared;
  if (!loginCaptcha) {
    return;
  }
  const targetDocument = globalScope.document;
  if (!isOauthAuthorizePage(targetDocument)) {
    return;
  }
  shared?.trackPageView?.(targetDocument, {
    page_surface: "oauth_authorize",
  });
  loginCaptcha.attachCaptchaAutofill(targetDocument, "oauth");
})(globalThis);

function isOauthAuthorizePage(targetDocument: Document) {
  return (
    targetDocument.location.hostname.toLowerCase() === "oauth.ccxp.nthu.edu.tw" &&
    /\/v\d+(?:\.\d+)?\/authorize\.php$/i.test(targetDocument.location.pathname)
  );
}
