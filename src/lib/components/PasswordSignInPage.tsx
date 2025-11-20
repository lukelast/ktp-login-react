import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmail } from "../firebase/firebase";
import { getAuthConfig } from "../config";

export const PasswordSignInPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const config = getAuthConfig();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await signInWithEmail(email, password);
            navigate(config.auth.routes.afterLogin);
        } catch (error: unknown) {
            console.error("Login failed:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Login failed";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="ktp-page">
                <div className="ktp-card">
                    <div className="ktp-loading-content">
                        <div className="ktp-spinner"></div>
                        <p className="ktp-loading-text">Signing in...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ktp-page">
            <div className="ktp-card">
                <h1 className="ktp-title">Sign in</h1>
                <p className="ktp-subtitle">Enter your email and password to sign in</p>

                <div className="ktp-content ktp-space-y-4">
                    <form onSubmit={handleLogin} className="ktp-space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                required
                                className="ktp-input"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                className="ktp-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="ktp-btn-primary"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="ktp-links ktp-space-y-4">
                        <div>
                            <Link
                                to={config.auth.routes.resetPassword}
                                className="ktp-link"
                            >
                                Reset your password
                            </Link>
                        </div>
                        <div>
                            <Link
                                to={config.auth.routes.signup}
                                className="ktp-link"
                            >
                                Create a new account with email
                            </Link>
                        </div>
                        <div>
                            <Link to={config.auth.routes.login} className="ktp-link">
                                Back to login
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="ktp-error">
                            <div className="ktp-error-text">{error}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
