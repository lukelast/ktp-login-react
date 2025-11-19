import { getAuthConfig } from "../config";
import { User } from "./types";

export const AuthService = {
    login: async (idToken: string): Promise<User | null> => {
        try {
            const config = getAuthConfig();
            const loginRes = await fetch(config.auth.endpoints.login, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            if (loginRes.ok) {
                const loginData = await loginRes.json();
                if (loginData.user) {
                    return loginData.user;
                } else {
                    console.error("Login succeeded but no user data returned");
                    return null;
                }
            } else {
                console.error("Backend login failed");
                return null;
            }
        } catch (error) {
            console.error("Error logging in:", error);
            return null;
        }
    },

    logout: async (): Promise<void> => {
        try {
            const config = getAuthConfig();
            await fetch(config.auth.endpoints.logout, { method: "POST" });
        } catch (error) {
            console.error("Error logging out:", error);
        }
    },
};
