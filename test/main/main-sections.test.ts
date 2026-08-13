import { describe, expect, test } from "vitest";
import {
  createTestWindow,
  loadModules,
  requireElement,
  requireValue,
  sharedModulePaths,
} from "../helpers/module-loader.js";

const mainSectionModulePaths = [...sharedModulePaths, "src/main/sections.ts"];

function createSectionHtml() {
  return `<!doctype html>
<html lang="zh">
  <head></head>
  <body>
    <table>
      <tr class="class1"><td colspan="12"><br>Dimension I</td></tr>
      <tr class="class2"><td>Course No.</td><td>Course Title</td></tr>
      <tr id="course-1"><td>11510GEC 110301</td><td>Value and Practice</td></tr>
      <tr class="class1"><td colspan="12">Dimension II</td></tr>
      <tr id="course-2"><td>11510GEC 110800</td><td>Selections from the Xunzi</td></tr>
    </table>
  </body>
</html>`;
}

function loadSections(html: string) {
  const { window } = createTestWindow(
    html,
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/JH/6/6.2/6.2.F/JH62f002.php",
  );
  loadModules(window, mainSectionModulePaths);
  const { enhanceCollapsibleSections } = requireValue(
    window.CCXP_LITE.mainSections,
    "mainSections",
  );
  const document = window.document as Document;
  enhanceCollapsibleSections(document);
  return { window, document };
}

describe("main sections", () => {
  test("collapses each section behind a toggle and reveals it again on click", () => {
    const { document } = loadSections(createSectionHtml());

    const toggles = [...document.querySelectorAll<HTMLButtonElement>(".ccxp-lite-section-toggle")];
    expect(toggles).toHaveLength(2);
    expect(toggles.map((toggle) => toggle.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
    ]);

    // The heading text stays inside the button so it remains the accessible name.
    expect(toggles[0]?.textContent).toContain("Dimension I");

    const columnHeader = requireElement(
      document.querySelector<HTMLTableRowElement>("tr.class2"),
      "column header row",
    );
    const firstCourse = requireElement(
      document.querySelector<HTMLTableRowElement>("#course-1"),
      "first course row",
    );
    const secondCourse = requireElement(
      document.querySelector<HTMLTableRowElement>("#course-2"),
      "second course row",
    );

    // A section owns every row up to the next section header, including the column header that
    // belongs to it.
    expect(columnHeader.dataset.ccxpLiteSectionHidden).toBe("true");
    expect(firstCourse.dataset.ccxpLiteSectionHidden).toBe("true");
    expect(secondCourse.dataset.ccxpLiteSectionHidden).toBe("true");

    requireValue(toggles[0], "first toggle").click();

    expect(toggles[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(columnHeader.dataset.ccxpLiteSectionHidden).toBeUndefined();
    expect(firstCourse.dataset.ccxpLiteSectionHidden).toBeUndefined();
    // Expanding one section leaves the others untouched.
    expect(secondCourse.dataset.ccxpLiteSectionHidden).toBe("true");

    requireValue(toggles[0], "first toggle").click();
    expect(toggles[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(firstCourse.dataset.ccxpLiteSectionHidden).toBe("true");
  });

  test("leaves column header rows and repeated runs alone", () => {
    const { document } = loadSections(`<!doctype html>
<html lang="zh">
  <head></head>
  <body>
    <table>
      <tr class="class1"><td>Course No.</td><td>Course Title</td></tr>
      <tr id="course-1"><td>11510GEC 110301</td><td>Value and Practice</td></tr>
    </table>
  </body>
</html>`);

    // .class1 is also used for column headers; only a single spanning cell marks a collapsible
    // section, so this table gains no toggle at all.
    expect(document.querySelectorAll(".ccxp-lite-section-toggle")).toHaveLength(0);
    expect(
      requireElement(document.querySelector<HTMLTableRowElement>("#course-1"), "course row").dataset
        .ccxpLiteSectionHidden,
    ).toBeUndefined();
  });

  test("hides a section band that has no rows under it", () => {
    const { document } = loadSections(`<!doctype html>
<html lang="zh">
  <head></head>
  <body>
    <table>
      <tr class="class1" id="empty-band"><td colspan="12">Legacy curriculum</td></tr>
      <tr class="class1" id="filled-band"><td colspan="12">Dimension I</td></tr>
      <tr id="course-1"><td>11510GEC 110301</td><td>Value and Practice</td></tr>
    </table>
  </body>
</html>`);

    const emptyBand = requireElement(
      document.querySelector<HTMLTableRowElement>("#empty-band"),
      "empty band",
    );
    expect(emptyBand.dataset.ccxpLiteSectionHidden).toBe("true");
    expect(emptyBand.querySelector(".ccxp-lite-section-toggle")).toBeNull();

    // The band that does own rows is still turned into a toggle.
    const filledBand = requireElement(
      document.querySelector<HTMLTableRowElement>("#filled-band"),
      "filled band",
    );
    expect(filledBand.dataset.ccxpLiteSectionHidden).toBeUndefined();
    expect(filledBand.querySelector(".ccxp-lite-section-toggle")).not.toBeNull();
  });

  test("hides an empty table together with the heading above it", () => {
    const { document } = loadSections(`<!doctype html>
<html lang="zh">
  <head></head>
  <body>
    <p id="kept-heading">Core GE courses</p>
    <table id="filled-table">
      <tr id="course-1"><td>11510GEC 110301</td><td>Value and Practice</td></tr>
    </table>
    <p id="stray-heading">Legacy curriculum</p>
    <table id="empty-table"></table>
  </body>
</html>`);

    const hidden = (selector: string) =>
      requireElement(document.querySelector<HTMLElement>(selector), selector).dataset
        .ccxpLiteSectionHidden;

    expect(hidden("#empty-table")).toBe("true");
    expect(hidden("#stray-heading")).toBe("true");

    // A heading whose table still has rows is left alone.
    expect(hidden("#kept-heading")).toBeUndefined();
    expect(hidden("#filled-table")).toBeUndefined();
  });

  test("does not enhance the same section twice", () => {
    const { window, document } = loadSections(createSectionHtml());
    const { enhanceCollapsibleSections } = requireValue(
      window.CCXP_LITE.mainSections,
      "mainSections",
    );

    enhanceCollapsibleSections(document);
    enhanceCollapsibleSections(document);

    expect(document.querySelectorAll(".ccxp-lite-section-toggle")).toHaveLength(2);
  });
});
