import { describe, expect, test, vi } from "vitest";

import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireValue,
} from "../helpers/module-loader.js";

async function initializeFavorites(api: CcxpLiteSidebarFavorites) {
  await new Promise<void>((resolve) => {
    api.initializeFavorites(resolve);
  });
}

function storeFavoriteIds(
  window: { localStorage: Storage },
  api: CcxpLiteSidebarFavorites,
  ids: readonly string[],
) {
  window.localStorage.setItem(
    api.FAVORITES_STORAGE_KEY,
    JSON.stringify({ version: 1, updatedAt: 1, ids }),
  );
}

describe("sidebar favorites", () => {
  test("migrates scoped localStorage favorites into canonical extension storage", async () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");
    let persistedFavorites: unknown;
    window.chrome.runtime.sendMessage = ((
      message: { key?: string; value?: unknown },
      done?: () => void,
    ) => {
      persistedFavorites = message.key === api.FAVORITES_STORAGE_KEY ? message.value : undefined;
      done?.();
    }) as typeof window.chrome.runtime.sendMessage;
    const linkItem: CcxpLiteSidebarLinkItem = {
      id: api.createLinkId({ label: "Semester Grades", href: "/grades", target: "main" }),
      label: "Semester Grades",
      href: "/grades",
      target: "main",
    };
    storeFavoriteIds(window, api, [linkItem.id]);

    await initializeFavorites(api);

    expect(api.isFavoriteLink(linkItem)).toBe(true);

    api.toggleFavoriteLink(linkItem);
    expect(persistedFavorites).toMatchObject({
      version: 1,
      ids: [],
    });
  });

  test("handles blocked localStorage reads and still notifies subscribers on write", async () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");
    const callback = vi.fn();
    const localStorageGetItem = vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    Object.defineProperty(window.top, "localStorage", {
      configurable: true,
      get() {
        return window.localStorage;
      },
    });

    window.chrome.storage.local.get = ((
      _keys: readonly string[] | undefined,
      done: (result: Readonly<Record<string, unknown>>) => void,
    ) => {
      done({
        [api.FAVORITES_STORAGE_KEY]: {
          version: 1,
          updatedAt: 1,
          ids: [api.createLinkId({ label: "Grades", href: "/grades", target: "main" })],
        },
      });
    }) as typeof window.chrome.storage.local.get;

    await new Promise<void>((resolve) => {
      api.initializeFavorites(() => {
        callback(undefined);
        resolve();
      });
    });

    expect(api.areFavoritesLoaded()).toBe(true);

    callback.mockClear();
    api.toggleFavoriteLink({ id: "grades", label: "Grades", href: "/grades", target: "main" });
    expect(callback).toHaveBeenCalled();
    localStorageGetItem.mockRestore();
  });

  test("syncs across extension storage changes without crashing on invalid payloads", async () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");
    let storageListener:
      | ((
          changes: Readonly<Record<string, chrome.storage.StorageChange>>,
          areaName: chrome.storage.AreaName,
        ) => void)
      | undefined;
    const addListener = vi
      .spyOn(window.chrome.storage.onChanged, "addListener")
      .mockImplementation(
        (
          callback: (
            changes: Readonly<Record<string, chrome.storage.StorageChange>>,
            areaName: chrome.storage.AreaName,
          ) => void,
        ) => {
          storageListener = callback;
        },
      );
    await initializeFavorites(api);
    const listener = requireValue(storageListener, "storage listener");
    const linkItem: CcxpLiteSidebarLinkItem = {
      id: api.createLinkId({ label: "Grades", href: "/grades", target: "main" }),
      label: "Grades",
      href: "/grades",
      target: "main",
    };

    listener(
      {
        [api.FAVORITES_STORAGE_KEY]: {
          oldValue: undefined,
          newValue: {
            version: 1,
            updatedAt: 1,
            ids: [linkItem.id],
          },
        },
      },
      "local",
    );
    expect(api.isFavoriteLink(linkItem)).toBe(true);

    listener(
      {
        [api.FAVORITES_STORAGE_KEY]: {
          oldValue: undefined,
          newValue: "{invalid",
        },
      },
      "local",
    );
    expect(api.isFavoriteLink(linkItem)).toBe(false);
    addListener.mockRestore();
  });

  test("matches versioned favorites even when menu depth changes", async () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");
    const currentLink = {
      id: api.createLinkId({
        label: "Apply now",
        pathSegments: ["Student services", "Select courses", "Apply now"],
        target: "main",
      }),
      legacyId: api.createLegacyLinkId({
        label: "Apply now",
        href: "/courses/apply",
        target: "main",
      }),
      label: "Apply now",
      pathSegments: ["Student services", "Select courses", "Apply now"],
      href: "/courses/apply",
      target: "main",
    };
    const savedFavoriteId = api.createLinkId({
      label: "Apply now",
      pathSegments: ["Student services", "Apply now"],
      target: "main",
    });

    storeFavoriteIds(window, api, [savedFavoriteId]);
    await initializeFavorites(api);

    expect(api.isFavoriteLink(currentLink)).toBe(true);
  });

  test("creates the same favorite id regardless of tree depth for the same route", () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");

    expect(
      api.createLinkId({
        label: "Apply now",
        href: "/courses/apply",
        pathSegments: ["Student services", "Apply now"],
        target: "main",
      }),
    ).toBe(
      api.createLinkId({
        label: "Apply now",
        href: "/courses/apply",
        pathSegments: ["Student services", "Select courses", "Apply now"],
        target: "main",
      }),
    );
  });

  test("matches pinned folders even when a menu gains an intermediate layer", async () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");
    const currentBlock: CcxpLiteSidebarBlock = {
      id: "section-student-services",
      favoriteId: api.createBlockId({
        label: "Student services",
        pathSegments: ["Student services", "Select courses"],
        parentCategoryId: "category-planning-and-enrollment",
      }),
      label: "Student services",
      pathSegments: ["Student services", "Select courses"],
      parentCategoryId: "category-planning-and-enrollment",
      links: [],
      kind: "block",
    };
    const savedFavoriteId = api.createBlockId({
      label: "Student services",
      pathSegments: ["Student services"],
      parentCategoryId: "category-planning-and-enrollment",
    });

    storeFavoriteIds(window, api, [savedFavoriteId]);
    await initializeFavorites(api);

    expect(api.isFavoriteBlock(currentBlock)).toBe(true);
  });

  test("matches stored v3 favorites across login sessions when volatile route values change", async () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");
    const currentLink = {
      id: api.createLinkId({
        label: "Transcript",
        href: "/JH/8/R/6.3/JH8R63001.php?ACIXSTORE=new-session",
        target: "main",
        clickLinkArgs: {
          name: "%A6%A8%C1Z%ACd%B8%DF",
          url: "/JH/8/R/6.3/JH8R63001.php",
        },
      }),
      legacyId: api.createLegacyLinkId({
        label: "Transcript",
        href: "/JH/8/R/6.3/JH8R63001.php?ACIXSTORE=new-session",
        target: "main",
        clickLinkArgs: {
          name: "%A6%A8%C1Z%ACd%B8%DF",
          url: "/JH/8/R/6.3/JH8R63001.php",
        },
      }),
      label: "Transcript",
      href: "/JH/8/R/6.3/JH8R63001.php?ACIXSTORE=new-session",
      target: "main",
      clickLinkArgs: {
        name: "%A6%A8%C1Z%ACd%B8%DF",
        url: "/JH/8/R/6.3/JH8R63001.php",
      },
    };
    const savedFavoriteId =
      "v3||Transcript||/JH/8/R/6.3/JH8R63001.php?ACIXSTORE=old-session||main||%A6%A8%C1Z%ACd%B8%DF::/JH%2F8%2FR%2F6.3%2FJH8R63001.php";

    storeFavoriteIds(window, api, [savedFavoriteId]);
    await initializeFavorites(api);

    expect(api.isFavoriteLink(currentLink)).toBe(true);
  });

  test("writes canonical v3 favorite ids without volatile session parameters", () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);

    const api = requireValue(window.CCXP_LITE.sidebarFavorites, "sidebarFavorites");

    expect(
      api.createLinkId({
        label: "Transcript",
        href: "/JH/8/R/6.3/JH8R63001.php?ACIXSTORE=old-session",
        target: "main",
        clickLinkArgs: {
          name: "%A6%A8%C1Z%ACd%B8%DF",
          url: "/JH%2F8%2FR%2F6.3%2FJH8R63001.php",
        },
      }),
    ).toBe(
      "v3||Transcript||/JH/8/R/6.3/JH8R63001.php||main||%A6%A8%C1Z%ACd%B8%DF::/JH%2F8%2FR%2F6.3%2FJH8R63001.php",
    );
  });
});
