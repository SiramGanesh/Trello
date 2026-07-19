import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const COLUMNS = [
    { key: "todo", label: "To Do" },
    { key: "inprogress", label: "In Progress" },
    { key: "done", label: "Done" },
];

function PriorityIcon({ priority }) {
    const map = { low: "▼", medium: "■", high: "▲" };
    return <span style={{ marginRight: 4, opacity: 0.7 }}>{map[priority] || "■"}</span>;
}

export default function BoardDetail() {
    const { boardId } = useParams();
    const { user } = useAuth();
    const [issues, setIssues] = useState([]);
    const [err, setErr] = useState("");

    // new issue form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [assignedTo, setAssignedTo] = useState("");
    const [creating, setCreating] = useState(false);

    async function load() {
        try {
            const data = await api.getIssues({ boardId });
            setIssues(data.issues || []);
        } catch (e) {
            setErr(e.message);
        }
    }

    useEffect(() => {
        load();
    }, [boardId]);

    async function onCreateIssue(e) {
        e.preventDefault();
        setCreating(true);
        setErr("");
        try {
            await api.createIssue({
                title,
                description,
                boardId,
                priority,
                assignedTo: assignedTo || undefined,
            });
            setTitle("");
            setDescription("");
            setAssignedTo("");
            await load();
        } catch (e) {
            setErr(e.message);
        } finally {
            setCreating(false);
        }
    }

    async function moveIssue(issue, direction) {
        const order = ["todo", "inprogress", "done"];
        const idx = order.indexOf(issue.status);
        const next = order[idx + direction];
        if (!next) return;
        try {
            await api.updateIssue({ issueId: issue._id, status: next });
            await load();
        } catch (e) {
            setErr(e.message);
        }
    }

    async function deleteIssue(issue) {
        if (!confirm(`Delete "${issue.title}"?`)) return;
        try {
            await api.deleteIssue(issue._id);
            await load();
        } catch (e) {
            setErr(e.message);
        }
    }

    if (err && issues.length === 0) {
        return (
            <div className="page">
                <header className="topbar">
                    <Link to="/" className="back">← Dashboard</Link>
                    <h1>Board</h1>
                </header>
                <main className="container">
                    <div className="error">{err}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="back">← Dashboard</Link>
                <h1>Board</h1>
                <div className="spacer" />
                <div className="user-chip">
                    <div className="user-avatar">{(user?.username || "?").charAt(0).toUpperCase()}</div>
                    <span>{user?.username}</span>
                </div>
            </header>

            <main className="container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Kanban Board</h1>
                        <p className="page-subtitle">
                            {issues.length === 0
                                ? "Add your first issue to get started"
                                : `${issues.length} issue${issues.length === 1 ? "" : "s"} across ${COLUMNS.length} columns`}
                        </p>
                    </div>
                </div>

                {err && <div className="error">{err}</div>}

                <section className="card">
                    <h2>New issue</h2>
                    <form onSubmit={onCreateIssue} className="stack-form">
                        <input
                            placeholder="Issue title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                        <div className="row-form">
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="low">Low priority</option>
                                <option value="medium">Medium priority</option>
                                <option value="high">High priority</option>
                            </select>
                            <input
                                placeholder="Assign to (username)"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            />
                            <button type="submit" className="primary" disabled={creating}>
                                {creating ? "Adding..." : "Add issue"}
                            </button>
                        </div>
                    </form>
                </section>

                <div className="kanban">
                    {COLUMNS.map((col) => {
                        const colIssues = issues.filter((i) => i.status === col.key);
                        return (
                            <div key={col.key} className={`kanban-col ${col.key}`}>
                                <div className="kanban-col-header">
                                    <h3 className="kanban-col-title">
                                        <span className="kanban-col-dot" />
                                        {col.label}
                                    </h3>
                                    <span className="badge">{colIssues.length}</span>
                                </div>

                                {colIssues.length === 0 ? (
                                    <div className="kanban-empty">No issues here</div>
                                ) : (
                                    colIssues.map((i) => {
                                        const assigneeInitial = (i.assignedTo?.username || "?").charAt(0).toUpperCase();
                                        return (
                                            <div key={i._id} className="issue-card">
                                                <div className="issue-title">{i.title}</div>
                                                {i.description && (
                                                    <p className="issue-desc">{i.description}</p>
                                                )}

                                                <div className="issue-meta">
                                                    <div className="issue-meta-left">
                                                        <span className={`pill p-${i.priority}`}>
                                                            <PriorityIcon priority={i.priority} />
                                                            {i.priority}
                                                        </span>
                                                        {i.assignedTo && (
                                                            <span className="assignee-chip">
                                                                <div className="member-avatar">{assigneeInitial}</div>
                                                                {i.assignedTo.username}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="issue-actions">
                                                        <button
                                                            className="ghost icon"
                                                            onClick={() => moveIssue(i, -1)}
                                                            disabled={i.status === "todo"}
                                                            title="Move left"
                                                        >
                                                            ←
                                                        </button>
                                                        <button
                                                            className="ghost icon"
                                                            onClick={() => moveIssue(i, 1)}
                                                            disabled={i.status === "done"}
                                                            title="Move right"
                                                        >
                                                            →
                                                        </button>
                                                        {i.createdBy?.username === user?.username && (
                                                            <button
                                                                className="ghost danger icon"
                                                                onClick={() => deleteIssue(i)}
                                                                title="Delete"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
