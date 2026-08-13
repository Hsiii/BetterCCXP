(function registerCcxpLiteMainSections(globalScope: typeof globalThis) {
  const { CCXP_LITE: namespace } = globalScope;
  if (!namespace) {
    return;
  }
  const TOGGLE_CLASS = "ccxp-lite-section-toggle";
  const MARKER_CLASS = "ccxp-lite-section-toggle-marker";
  const LABEL_CLASS = "ccxp-lite-section-toggle-label";
  const ENHANCED_ATTRIBUTE = "data-ccxp-lite-section-toggle";
  const HIDDEN_ATTRIBUTE = "data-ccxp-lite-section-hidden";

  // CCXP marks section bands with .class1, but it reuses that class for column header rows as well.
  // Only a row holding a single spanning cell introduces a section, so the structure rather than
  // the class decides what is collapsible.
  function isSectionHeaderRow(row: HTMLTableRowElement) {
    if (!row.classList.contains("class1")) {
      return false;
    }
    if (row.cells.length !== 1) {
      return false;
    }
    return row.cells[0].hasAttribute("colspan");
  }

  function collectSectionRows(
    rows: readonly HTMLTableRowElement[],
    headerIndex: number,
  ): readonly HTMLTableRowElement[] {
    const sectionRows: HTMLTableRowElement[] = [];
    for (let index = headerIndex + 1; index < rows.length; index++) {
      const row = rows[index];
      if (isSectionHeaderRow(row)) {
        break;
      }
      sectionRows.push(row);
    }
    return sectionRows;
  }

  // The markup indents the band with leading <br> tags; keeping them would open the toggle with a
  // blank first line.
  function trimLeadingBreaks(cell: HTMLTableCellElement) {
    let node = cell.firstChild;
    while (node) {
      const isBreak = node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "BR";
      const isBlankText =
        node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() === "";
      if (!isBreak && !isBlankText) {
        break;
      }
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
  }

  function setSectionExpanded(
    button: HTMLButtonElement,
    sectionRows: readonly HTMLTableRowElement[],
    expanded: boolean,
  ) {
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    for (const row of sectionRows) {
      if (expanded) {
        row.removeAttribute(HIDDEN_ATTRIBUTE);
      } else {
        row.setAttribute(HIDDEN_ATTRIBUTE, "true");
      }
    }
  }

  function enhanceSectionHeader(
    targetDocument: Document,
    header: HTMLTableRowElement,
    sectionRows: readonly HTMLTableRowElement[],
  ) {
    // A band with nothing under it only adds noise, so it is hidden rather than turned into a
    // toggle that opens onto nothing.
    if (sectionRows.length === 0) {
      header.setAttribute(HIDDEN_ATTRIBUTE, "true");
      header.setAttribute(ENHANCED_ATTRIBUTE, "true");
      return;
    }
    const cell = header.cells[0];
    header.setAttribute(ENHANCED_ATTRIBUTE, "true");
    trimLeadingBreaks(cell);

    const button = targetDocument.createElement("button");
    button.type = "button";
    button.className = TOGGLE_CLASS;

    const marker = targetDocument.createElement("span");
    marker.className = MARKER_CLASS;
    marker.setAttribute("aria-hidden", "true");

    // Moving the original nodes keeps the heading text as the button's accessible name, so no
    // separate label string is needed.
    const label = targetDocument.createElement("span");
    label.className = LABEL_CLASS;
    while (cell.firstChild) {
      label.append(cell.firstChild);
    }

    button.append(label, marker);
    cell.append(button);

    setSectionExpanded(button, sectionRows, false);
    button.addEventListener("click", () => {
      setSectionExpanded(button, sectionRows, button.getAttribute("aria-expanded") !== "true");
    });
  }

  // Some listings end with a heading whose table was rendered without a single row, which leaves a
  // stray caption over nothing. The heading only goes when it sits directly on top of that table.
  function hideEmptyTable(table: HTMLTableElement) {
    if (table.rows.length > 0) {
      return;
    }
    table.setAttribute(HIDDEN_ATTRIBUTE, "true");
    const heading = table.previousElementSibling;
    if (heading?.tagName === "P") {
      heading.setAttribute(HIDDEN_ATTRIBUTE, "true");
    }
  }

  function enhanceCollapsibleSections(targetDocument: Document) {
    for (const table of targetDocument.querySelectorAll("table")) {
      hideEmptyTable(table);
      const rows = [...table.rows];
      for (const [index, header] of rows.entries()) {
        if (!isSectionHeaderRow(header) || header.hasAttribute(ENHANCED_ATTRIBUTE)) {
          continue;
        }
        enhanceSectionHeader(targetDocument, header, collectSectionRows(rows, index));
      }
    }
  }

  namespace.mainSections = {
    enhanceCollapsibleSections,
  };
})(globalThis);
