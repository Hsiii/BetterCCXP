(function initializeCcxpLiteStaffHistory(globalScope: typeof globalThis) {
  if (!/^\/ccxp\/inquire\/pe\/3\/3000\/pe30003\.php$/i.test(globalScope.location.pathname)) {
    return;
  }

  interface StaffGrid {
    dataSource: {
      pageSize: (() => number | undefined) & ((value: number) => void);
    };
    resize: (force: boolean) => void;
  }

  const page = globalScope as typeof globalThis & {
    jQuery?: (element: Element) => { data: (name: string) => StaffGrid | undefined };
    __ccxpLiteStaffHistoryCleanup?: () => void;
  };
  page.__ccxpLiteStaffHistoryCleanup?.();
  const pending = new Set(["grid", "grid_pre"]);
  const observers: ResizeObserver[] = [];
  const frames = new Set<number>();
  let retryTimer: number | undefined;
  let attempts = 0;

  function watchGrid(element: HTMLElement, grid: StaffGrid) {
    const pageSize = grid.dataSource.pageSize();
    // The host enables pagination but omits dataSource.pageSize. Preserve any valid size already
    // selected by the user or configured by the host.
    if (pageSize === undefined || !Number.isFinite(pageSize) || pageSize <= 0) {
      grid.dataSource.pageSize(10);
    }

    let previousWidth = 0;
    let previousHeight = 0;
    let scheduled = false;
    const resizeVisibleGrid = () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      const frame = globalScope.requestAnimationFrame(() => {
        frames.delete(frame);
        scheduled = false;
        const { width, height } = element.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
          previousWidth = 0;
          previousHeight = 0;
          return;
        }
        if (width === previousWidth && height === previousHeight) {
          return;
        }
        previousWidth = width;
        previousHeight = height;
        grid.resize(true);
      });
      frames.add(frame);
    };
    const observer = new ResizeObserver(resizeVisibleGrid);
    observer.observe(element);
    observers.push(observer);
    resizeVisibleGrid();
  }

  function attach() {
    attempts++;
    for (const id of pending) {
      const element = document.querySelector<HTMLElement>(`#${id}`);
      const grid = element && page.jQuery?.(element).data("kendoGrid");
      if (element && grid) {
        watchGrid(element, grid);
        pending.delete(id);
      }
    }
    // Wait for slow host initialization without leaving a permanent poller.
    if (pending.size > 0 && attempts < 40) {
      retryTimer = globalScope.setTimeout(attach, 250, undefined);
    }
  }

  function cleanup() {
    globalScope.clearTimeout(retryTimer);
    for (const observer of observers) {
      observer.disconnect();
    }
    for (const frame of frames) {
      globalScope.cancelAnimationFrame(frame);
    }
    globalScope.removeEventListener("pagehide", onPageHide);
  }

  function onPageHide(event: PageTransitionEvent) {
    if (!event.persisted) {
      cleanup();
    }
  }

  page.__ccxpLiteStaffHistoryCleanup = cleanup;
  globalScope.addEventListener("pagehide", onPageHide);
  attach();
})(globalThis);
