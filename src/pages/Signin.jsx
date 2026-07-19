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
            <form className="auth-card" onSubmit={onSubmit}>
                <h1>Sign in</h1>
                {err && <div className="error">{err}</div>}
                <label>
                    Username
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={busy}>
                    {busy ? "Signing in..." : "Sign in"}
                </button>
                <p className="muted">
                    New here? <Link to="/signup">Create an account</Link>
                </p>
            </form>
        </div>
    );
}
