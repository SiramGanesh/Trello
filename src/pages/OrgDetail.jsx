import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function OrgDetail() {
    const { orgId } = useParams();
    const { user } = useAuth();
    const [org, setOrg] = useState(null);
    const [boards, setBoards] = useState([]);
    const [usernames, setUsernames] = useState([]);
    const [err, setErr] = useState("");

    // add member form
    const [memberUsername, setMemberUsername] = useState("");
    const [adding, setAdding] = useState(false);

    // new board form
    const [boardTitle, setBoardTitle] = useState("");
    const [boardDesc, setBoardDesc] = useState("");
    const [creating, setCreating] = useState(false);

    async function load() {
        try {
            const [orgRes, boardRes] = await Promise.all([
                api.getOrganization(orgId),
                api.getBoards(orgId),
            ]);
            setOrg(orgRes.organization);
            setBoards(boardRes.boards || []);
        } catch (e) {
            setErr(e.message);
        }
    }

    // Best-effort fetch for username autocomplete; failure is non-fatal.
    useEffect(() => {
        api.listUsers()
            .then((res) => setUsernames((res.users || []).map((u) => u.username)))
            .catch(() => setUsernames([]));
    }, []);

    useEffect(() => {
        load();
    }, [orgId]);

    async function onAddMember(e) {
        e.preventDefault();
        setAdding(true);
        setErr("");
        try {
            await api.addMember(orgId, memberUsername);
            setMemberUsername("");
            await load();
        } catch (e) {
            setErr(e.message);
        } finally {
            setAdding(false);
        }
    }

    async function onRemoveMember(username) {
        if (!confirm(`Remove ${username}?`)) return;
        try {
            await api.removeMember(orgId, username);
            await load();
        } catch (e) {
            setErr(e.message);
        }
    }

    const isAdmin = org?.admin?.username === user?.username;

    async function onCreateBoard(e) {
        e.preventDefault();
        setCreating(true);
        setErr("");
        try {
            await api.createBoard(boardTitle, boardDesc, orgId);
            setBoardTitle("");
            setBoardDesc("");
            await load();
        } catch (e) {
            setErr(e.message);
        } finally {
            setCreating(false);
        }
    }

    if (err && !org) return <div className="page container"><div className="error">{err}</div></div>;
    if (!org) return <div className="page container muted">Loading...</div>;

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="back">← Dashboard</Link>
                <h1>{org.title}</h1>
            </header>

            <main className="container">
                {err && <div className="error">{err}</div>}

                <section className="card">
                    <h2>Description</h2>
                    <p className="muted">{org.description || "No description."}</p>
                </section>

                {isAdmin && (
                    <section className="card">
                        <h2>Members ({org.members?.length || 0})</h2>
                        <ul className="member-list">
                            <li>
                                <span>{org.admin?.username} (admin)</span>
                            </li>
                            {(org.members || []).map((m) => (
                                <li key={m._id || m.id}>
                                    <span>{m.username} (member)</span>
                                    <button
                                        className="ghost danger"
                                        onClick={() => onRemoveMember(m.username)}
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <form onSubmit={onAddMember} className="row-form">
                            <input
                                list="username-suggestions"
                                placeholder="Username to add"
                                value={memberUsername}
                                onChange={(e) => setMemberUsername(e.target.value)}
                                required
                            />
                            <datalist id="username-suggestions">
                                {usernames.map((u) => (
                                    <option key={u} value={u} />
                                ))}
                            </datalist>
                            <button type="submit" disabled={adding}>
                                {adding ? "Adding..." : "Add member"}
                            </button>
                        </form>
                    </section>
                )}

                <section className="card">
                    <h2>Boards ({boards.length})</h2>
                    {boards.length === 0 ? (
                        <p className="muted">No boards yet.</p>
                    ) : (
                        <ul className="board-list">
                            {boards.map((b) => (
                                <li key={b._id}>
                                    <Link to={`/board/${b._id}`}>{b.title}</Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {isAdmin ? (
                        <form onSubmit={onCreateBoard} className="row-form">
                            <input
                                placeholder="New board title"
                                value={boardTitle}
                                onChange={(e) => setBoardTitle(e.target.value)}
                                required
                            />
                            <input
                                placeholder="Description (optional)"
                                value={boardDesc}
                                onChange={(e) => setBoardDesc(e.target.value)}
                            />
                            <button type="submit" disabled={creating}>
                                {creating ? "Creating..." : "Create board"}
                            </button>
                        </form>
                    ) : (<></>)}
                </section>
            </main>
        </div>
    );
}
