// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installPreloadErrorReload, PRELOAD_ERROR_EVENT } from "./preloadError";

const reload = vi.fn();
let uninstall: () => void = () => {};

beforeEach(() => {
  reload.mockReset();
  window.sessionStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, href: "http://localhost/p/page", reload },
  });
});

afterEach(() => {
  uninstall();
});

const firePreloadError = (): Event => {
  const event = new Event(PRELOAD_ERROR_EVENT, { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe("installPreloadErrorReload", () => {
  it("cancels the first preload error and reloads the page", () => {
    uninstall = installPreloadErrorReload();

    const event = firePreloadError();

    expect(event.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload again for the same URL after the reload", () => {
    uninstall = installPreloadErrorReload();
    firePreloadError();
    uninstall();

    // The reloaded page installs the listener afresh and hits the same error.
    uninstall = installPreloadErrorReload();
    const event = firePreloadError();

    expect(event.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again once a page has loaded cleanly after the guarded reload", () => {
    uninstall = installPreloadErrorReload();
    firePreloadError();
    uninstall();

    // Reloaded page: marker consumed, no error this time.
    uninstall = installPreloadErrorReload();
    uninstall();

    // A later navigation to the same URL hits a new deploy.
    uninstall = installPreloadErrorReload();
    firePreloadError();

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("still reloads for a different URL", () => {
    uninstall = installPreloadErrorReload();
    firePreloadError();
    uninstall();

    window.location.href = "http://localhost/p/other";
    uninstall = installPreloadErrorReload();
    firePreloadError();

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("stops listening when uninstalled", () => {
    installPreloadErrorReload()();

    const event = firePreloadError();

    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
