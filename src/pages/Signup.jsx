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
            <form className="auth-card" onSubmit={onSubmit}>
                <h1>Sign up</h1>
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
                    {busy ? "Creating..." : "Create account"}
                </button>
                <p className="muted">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </p>
            </form>
        </div>
    );
}
