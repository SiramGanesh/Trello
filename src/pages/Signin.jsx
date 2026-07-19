import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Signin() {
    const { signin } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            await signin(username, password);
            const from = loc.state?.from?.pathname || "/";
            nav(from, { replace: true });
        } catch (e) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo">T</div>
                    <div className="auth-brand-text">
                        <h1>Trello</h1>
                        <p>Plan. Track. Ship.</p>
                    </div>
                </div>

                <h2>Welcome back</h2>
                <p className="auth-subtitle">Sign in to your workspace</p>

                <form onSubmit={onSubmit}>
                    {err && <div className="error">{err}</div>}
                    <label>Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your username"
                        autoFocus
                        required
                    />
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <button type="submit" className="primary" disabled={busy}>
                        {busy ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-foot">
                    New here? <Link to="/signup">Create an account</Link>
                </p>
            </div>
        </div>
    );
}
