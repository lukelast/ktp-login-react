/**
 * Recovers from a deploy landing under an open tab.
 *
 * Vite gives every chunk a content hash in its file name, and a Cloud Run deploy replaces the whole
 * image, so a tab that loaded the previous build and then lazily imports a chunk (a `React.lazy`
 * route, or the Firebase SDK this library loads on sign-in) gets a 404. Vite reports that as a
 * cancelable `vite:preloadError` event on `window`; this listener cancels it and reloads the page,
 * which fetches the current index.html and the chunks it references.
 *
 * A sessionStorage marker keyed by URL limits the reload to one per page load, so a server that is
 * genuinely broken surfaces the error on the second attempt instead of reloading forever. The
 * marker survives exactly one reload: it is consumed when this function runs on the new page.
 *
 * Call once at startup, next to `initializeAuthLibrary()`. Returns a function that removes the
 * listener. No-op outside a browser.
 */
export function installPreloadErrorReload(): () => void {
  if (typeof window === "undefined") return () => {};

  const alreadyReloadedForThisUrl = consumeMarker();
  const onPreloadError = (event: Event) => {
    if (alreadyReloadedForThisUrl) return;
    event.preventDefault();
    setMarker();
    window.location.reload();
  };
  window.addEventListener(PRELOAD_ERROR_EVENT, onPreloadError);
  return () => window.removeEventListener(PRELOAD_ERROR_EVENT, onPreloadError);
}

/** Vite's preload helper dispatches this when a dynamic import or one of its dependencies fails. */
export const PRELOAD_ERROR_EVENT = "vite:preloadError";

const MARKER_KEY = "ktp-login-react:preload-error-reloaded";

const consumeMarker = (): boolean => {
  try {
    const marked = window.sessionStorage.getItem(MARKER_KEY) === window.location.href;
    window.sessionStorage.removeItem(MARKER_KEY);
    return marked;
  } catch {
    // Storage disabled (private mode quirks, sandboxed frames): guard cannot work, so never reload.
    return true;
  }
};

const setMarker = (): void => {
  window.sessionStorage.setItem(MARKER_KEY, window.location.href);
};
