import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

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

    return (
        <div className="page">
            <header className="topbar">
                <h1>Trello</h1>
                <div className="spacer" />
                <span className="muted">Hi{user?.username ? `, ${user.username}` : ""}</span>
                <button onClick={signout} className="ghost">
                    Sign out
                </button>
            </header>

            <main className="container">
                <section className="card">
                    <h2>Create an organization</h2>
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
                        <button type="submit" disabled={creating}>
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </form>
                    {err && <div className="error">{err}</div>}
                </section>

                <section className="card">
                    <h2>Organizations</h2>
                    {loading ? (
                        <p className="muted">Loading...</p>
                    ) : orgs.length === 0 ? (
                        <p className="muted">
                            You don't belong to any organization yet. Create one above.
                        </p>
                    ) : (
                        <div className="org-list">
                            {orgs.map((org) => (
                                <Link key={org._id} to={`/org/${org._id}`} className="org-row">
                                    <span className="org-title">{org.title}</span>
                                    <span className="muted small">
                                        by {org.admin?.username || "?"}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
