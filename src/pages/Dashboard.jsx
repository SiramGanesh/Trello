import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

function OrgIcon({ title }) {
    const initial = (title || "?").trim().charAt(0).toUpperCase();
    return <div className="org-card-icon">{initial}</div>;
}

export default function Dashboard() {
    const { signout, user } = useAuth();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // new-org form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const orgsRes = await api.listOrganizations();
            setOrgs(orgsRes.organizations || []);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function onCreateOrg(e) {
        e.preventDefault();
        setCreating(true);
        setErr("");
        try {
            await api.createOrganization(title, description);
            setTitle("");
            setDescription("");
            await load();
        } catch (e) {
            setErr(e.message);
        } finally {
            setCreating(false);
        }
    }

    const initial = (user?.username || "?").charAt(0).toUpperCase();

    return (
        <div className="page">
            <header className="topbar">
                <div className="topbar-brand">
                    <div className="auth-logo">T</div>
                    <span>Trello</span>
                </div>
                <div className="spacer" />
                <div className="user-chip">
                    <div className="user-avatar">{initial}</div>
                    <span>{user?.username}</span>
                </div>
                <button onClick={signout} className="ghost">Sign out</button>
            </header>

            <main className="container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Your workspaces</h1>
                        <p className="page-subtitle">
                            {orgs.length === 0
                                ? "Create your first organization to get started"
                                : `${orgs.length} organization${orgs.length === 1 ? "" : "s"}`}
                        </p>
                    </div>
                </div>

                {err && <div className="error">{err}</div>}

                <section className="card">
                    <h2>New organization</h2>
                    <form onSubmit={onCreateOrg} className="row-form">
                        <input
                            placeholder="Org title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <input
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <button type="submit" className="primary" disabled={creating}>
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </form>
                </section>

                <section className="card">
                    <h2>
                        Organizations
                        <span className="count-pill">{orgs.length}</span>
                    </h2>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">⏳</div>
                            <p className="muted">Loading your workspaces...</p>
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <p className="muted">No organizations yet — create one above to get started.</p>
                        </div>
                    ) : (
                        <div className="org-grid">
                            {orgs.map((org) => (
                                <Link key={org._id} to={`/org/${org._id}`} className="org-card">
                                    <OrgIcon title={org.title} />
                                    <h3 className="org-card-title">{org.title}</h3>
                                    <p className="org-card-desc">
                                        {org.description || "No description yet."}
                                    </p>
                                    <div className="org-card-meta">
                                        <span className="admin">
                                            {org.admin?.username || "?"}
                                        </span>
                                        <span>Open →</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
