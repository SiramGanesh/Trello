import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Signup() {
    const { signup } = useAuth();
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            await signup(username, password);
            nav("/signin");
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

                <h2>Create your account</h2>
                <p className="auth-subtitle">Start organizing your work in minutes</p>

                <form onSubmit={onSubmit}>
                    {err && <div className="error">{err}</div>}
                    <label>Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="pick a username"
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
                        {busy ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="auth-foot">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
