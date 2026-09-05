import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AuthService } from "./AuthService";

const fetchMock = vi.fn();

const testUser = {
  userId: "user-1",
  email: "test@example.com",
  nameFull: "Test User",
  nameFirst: "Test",
  roles: ["user"],
};

beforeAll(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
});

describe("AuthService.session", () => {
  it("returns the user the cookie identifies", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ user: testUser }), { status: 200 }));

    await expect(AuthService.session()).resolves.toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/session",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("method");
  });

  it("resolves null when there is no session", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(AuthService.session()).resolves.toBeNull();
  });

  it("rejects a server error with the status attached", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(AuthService.session()).rejects.toMatchObject({
      name: "AuthBackendError",
      status: 500,
      isAuthRejection: false,
    });
  });

  it("rejects when a 200 carries no user", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await expect(AuthService.session()).rejects.toThrow("no user data");
  });
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

  it("rejects a server error with the status attached, not flagged as an auth rejection", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(AuthService.login("id-token")).rejects.toMatchObject({
      name: "AuthBackendError",
      status: 500,
      isAuthRejection: false,
    });
  });

  it("flags a credential refusal as an auth rejection", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(AuthService.login("id-token")).rejects.toMatchObject({
      name: "AuthBackendError",
      status: 401,
      isAuthRejection: true,
    });
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
