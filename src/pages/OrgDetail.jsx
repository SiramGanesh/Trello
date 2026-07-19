import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

function Avatar({ username }) {
    const initial = (username || "?").charAt(0).toUpperCase();
    return <div className="member-avatar">{initial}</div>;
}

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
    if (!org) return (
        <div className="page container">
            <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <p className="muted">Loading organization...</p>
            </div>
        </div>
    );

    const initial = (org.title || "?").charAt(0).toUpperCase();

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="back">← Dashboard</Link>
                <h1>{org.title}</h1>
                <div className="spacer" />
                <div className="user-chip">
                    <div className="user-avatar">{(user?.username || "?").charAt(0).toUpperCase()}</div>
                    <span>{user?.username}</span>
                </div>
            </header>

            <main className="container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">{org.title}</h1>
                        <p className="page-subtitle">
                            {org.description || "No description provided."}
                        </p>
                    </div>
                </div>

                {err && <div className="error">{err}</div>}

                {isAdmin && (
                    <section className="card">
                        <h2>
                            Members
                            <span className="count-pill">{org.members?.length || 0}</span>
                        </h2>
                        <ul className="member-list">
                            <li>
                                <div className="member-info">
                                    <Avatar username={org.admin?.username} />
                                    <div>
                                        <div className="member-name">{org.admin?.username}</div>
                                        <div className="member-role admin">Admin</div>
                                    </div>
                                </div>
                            </li>
                            {(org.members || []).map((m) => (
                                <li key={m._id || m.id}>
                                    <div className="member-info">
                                        <Avatar username={m.username} />
                                        <div>
                                            <div className="member-name">{m.username}</div>
                                            <div className="member-role">Member</div>
                                        </div>
                                    </div>
                                    <button
                                        className="ghost danger icon"
                                        onClick={() => onRemoveMember(m.username)}
                                        title={`Remove ${m.username}`}
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <form onSubmit={onAddMember} className="row-form">
                            <input
                                list="username-suggestions"
                                placeholder="Add member by username"
                                value={memberUsername}
                                onChange={(e) => setMemberUsername(e.target.value)}
                                required
                            />
                            <datalist id="username-suggestions">
                                {usernames.map((u) => (
                                    <option key={u} value={u} />
                                ))}
                            </datalist>
                            <button type="submit" className="primary" disabled={adding}>
                                {adding ? "Adding..." : "Add member"}
                            </button>
                        </form>
                    </section>
                )}

                <section className="card">
                    <h2>
                        Boards
                        <span className="count-pill">{boards.length}</span>
                    </h2>

                    {boards.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🗂️</div>
                            <p className="muted">No boards yet — create the first one below.</p>
                        </div>
                    ) : (
                        <ul className="board-list">
                            {boards.map((b) => (
                                <li key={b._id}>
                                    <Link to={`/board/${b._id}`} className="board-link">
                                        <div className="board-link-title">{b.title}</div>
                                        <div className="board-link-desc">
                                            {b.description || "No description"}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {isAdmin && (
                        <form onSubmit={onCreateBoard} className="row-form" style={{ marginTop: 16 }}>
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
                            <button type="submit" className="primary" disabled={creating}>
                                {creating ? "Creating..." : "Create board"}
                            </button>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
}
