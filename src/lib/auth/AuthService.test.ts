import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { initializeAuthLibrary } from "../config";
import { AuthService } from "./AuthService";

const fetchMock = vi.fn();

const testUser = {
  userId: "user-1",
  email: "test@example.com",
  nameFull: "Test User",
  nameFirst: "Test",
  roles: ["user"],
  extra: null,
};

beforeAll(() => {
  vi.stubGlobal("fetch", fetchMock);
  initializeAuthLibrary({
    firebase: { apiKey: "test-key", projectId: "test-project" },
    auth: {
      enabledProviders: [],
      routes: { afterLogin: "/dashboard" },
    },
  });
});

afterEach(() => {
  fetchMock.mockReset();
});

describe("AuthService.login", () => {
  it("returns the backend user on success", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ user: testUser }), { status: 200 }));

    await expect(AuthService.login("id-token")).resolves.toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ idToken: "id-token" }),
      }),
    );
  });

  it("rejects on an error status", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(AuthService.login("id-token")).rejects.toThrow("500");
  });

  it("rejects when the response carries no user", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await expect(AuthService.login("id-token")).rejects.toThrow("no user data");
  });

  it("rejects when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await expect(AuthService.login("id-token")).rejects.toThrow("network down");
  });
});

describe("AuthService.logout", () => {
  it("resolves on a 204 and requests keepalive", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(AuthService.logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/logout",
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
  });

  it("rejects on an error status", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(AuthService.logout()).rejects.toThrow("500");
  });

  it("rejects when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await expect(AuthService.logout()).rejects.toThrow("network down");
  });
});
