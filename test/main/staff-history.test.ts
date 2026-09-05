import { describe, expect, test, vi } from "vitest";

import { createTestWindow, loadModules } from "../helpers/module-loader.js";

function setup(sizes: ReadonlyArray<number | undefined> = [undefined, 50]) {
  const { window } = createTestWindow(
    '<div id="grid"></div><div id="grid_pre"></div>',
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/3/3000/PE30003.php",
  );
  const widgets = sizes.map((initialSize) => {
    let size = initialSize;
    return {
      dataSource: {
        pageSize: vi.fn((value?: number) => {
          if (value !== undefined) {
            size = value;
          }
          return size;
        }),
      },
      resize: vi.fn(),
    };
  });
  let visible = false;
  let ready = true;
  const frames = new Map<number, FrameRequestCallback>();
  const timers = new Map<number, () => void>();
  let nextId = 0;
  const observers: Array<{ callback: () => void; disconnect: ReturnType<typeof vi.fn> }> = [];
  const scope = window as unknown as Record<string, unknown>;
  scope.jQuery = (element: Element) => ({
    data: () => (ready ? widgets[element.id === "grid" ? 0 : 1] : undefined),
  });
  scope.ResizeObserver = class {
    disconnect = vi.fn();
    callback: () => void;
    observe = vi.fn();
    constructor(callback: () => void) {
      this.callback = callback;
      observers.push(this);
    }
  };
  scope.requestAnimationFrame = (callback: FrameRequestCallback) => {
    nextId++;
    const id = nextId;
    frames.set(id, callback);
    return id;
  };
  scope.cancelAnimationFrame = (id: number) => frames.delete(id);
  scope.setTimeout = (callback: () => void) => {
    nextId++;
    const id = nextId;
    timers.set(id, callback);
    return id;
  };
  scope.clearTimeout = (id: number) => timers.delete(id);
  const document = window.document as unknown as Document;
  const getBounds = () => ({ width: visible ? 900 : 0, height: visible ? 300 : 0 }) as DOMRect;
  for (const element of document.querySelectorAll("div")) {
    element.getBoundingClientRect = getBounds;
  }
  const load = () => {
    loadModules(window, ["src/staff-history/page.ts"]);
  };
  const flushFrames = () => {
    for (const [id, onFrame] of frames) {
      frames.delete(id);
      onFrame(0);
    }
  };
  return {
    window,
    widgets,
    observers,
    timers,
    frames,
    load,
    flushFrames,
    setVisible(value: boolean) {
      visible = value;
      for (const observer of observers) {
        observer.callback();
      }
      flushFrames();
    },
    setReady(value: boolean) {
      ready = value;
    },
  };
}

describe("Staff History grid initialization", () => {
  test("repairs missing pagination while preserving a valid user page size", () => {
    const state = setup();
    state.load();
    expect(state.widgets[0]?.dataSource.pageSize).toHaveBeenCalledWith(10);
    expect(state.widgets[1]?.dataSource.pageSize).not.toHaveBeenCalledWith(10);
  });

  test("resizes on opening and reopening without looping for unchanged dimensions", () => {
    const state = setup();
    state.load();
    state.flushFrames();
    expect(state.widgets[0]?.resize).not.toHaveBeenCalled();
    state.setVisible(true);
    expect(state.widgets[0]?.resize).toHaveBeenCalledTimes(1);
    state.setVisible(true);
    expect(state.widgets[0]?.resize).toHaveBeenCalledTimes(1);
    state.setVisible(false);
    state.setVisible(true);
    expect(state.widgets[0]?.resize).toHaveBeenCalledTimes(2);
  });

  test("waits for host widgets, then stops polling", () => {
    const state = setup();
    state.setReady(false);
    state.load();
    expect(state.observers).toHaveLength(0);
    state.setReady(true);
    for (const [id, callback] of state.timers) {
      state.timers.delete(id);
      callback();
    }
    expect(state.observers).toHaveLength(2);
    expect(state.timers.size).toBe(0);
  });

  test("reinjection cleans up old observers and pending animation frames", () => {
    const state = setup();
    state.load();
    const oldObservers = [...state.observers];
    state.load();
    for (const observer of oldObservers) {
      expect(observer.disconnect).toHaveBeenCalledOnce();
    }
    expect(state.frames.size).toBe(2);
    expect(
      state.widgets[0]?.dataSource.pageSize.mock.calls.filter((args) => args[0] === 10),
    ).toHaveLength(1);
  });
});
