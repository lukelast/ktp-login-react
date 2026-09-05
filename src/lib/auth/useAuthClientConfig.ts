import { useEffect, useState } from "react";
import { type AuthClientConfig, getAuthClientConfig } from "../config";

interface Settled {
  /** The load this outcome belongs to; an outcome from an earlier attempt reads as loading. */
  load: Promise<AuthClientConfig>;
  config: AuthClientConfig | null;
  error: string | null;
}

/**
 * The backend-owned auth config for pages that need it (the login page: which providers to
 * offer, whether the dev login exists). Loaded lazily so it stays off the signed-in page-load
 * path. Exactly one of `loading`, `config` and `error` is set; `retry` starts a fresh load.
 */
export const useAuthClientConfig = () => {
  const [load, setLoad] = useState(() => getAuthClientConfig());
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    let active = true;
    load.then(
      (config) => {
        if (active) setSettled({ load, config, error: null });
      },
      (error: unknown) => {
        if (active) {
          setSettled({
            load,
            config: null,
            error: error instanceof Error ? error.message : "Unable to load sign-in configuration",
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [load]);

  const outcome = settled?.load === load ? settled : null;
  return {
    loading: outcome === null,
    config: outcome?.config ?? null,
    error: outcome?.error ?? null,
    retry: () => setLoad(getAuthClientConfig()),
  };
};
