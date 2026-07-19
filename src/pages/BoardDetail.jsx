import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const COLUMNS = [
    { key: "todo", label: "To Do" },
    { key: "inprogress", label: "In Progress" },
    { key: "done", label: "Done" },
];

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

    if (err) return <div className="page container"><div className="error">{err}</div></div>;

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="back">← Dashboard</Link>
                <h1>Board</h1>
            </header>

            <main className="container">
                <section className="card">
                    <h2>Create issue</h2>
                    <form onSubmit={onCreateIssue} className="stack-form">
                        <input
                            placeholder="Title"
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
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            <input
                                placeholder="Assign to (username)"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            />
                            <button type="submit" disabled={creating}>
                                {creating ? "Creating..." : "Add issue"}
                            </button>
                        </div>
                    </form>
                </section>

                <div className="kanban">
                    {COLUMNS.map((col) => {
                        const colIssues = issues.filter((i) => i.status === col.key);
                        return (
                            <div key={col.key} className="kanban-col">
                                <h3>
                                    {col.label}{" "}
                                    <span className="badge">{colIssues.length}</span>
                                </h3>
                                {colIssues.length === 0 ? (
                                    <p className="muted small">No issues</p>
                                ) : (
                                    colIssues.map((i) => (
                                        <div key={i._id} className="issue-card">
                                            <div className="issue-title">{i.title}</div>
                                            {i.description && (
                                                <p className="muted small">
                                                    {i.description}
                                                </p>
                                            )}
                                            <div className="issue-meta">
                                                <span className={`pill p-${i.priority}`}>
                                                    {i.priority}
                                                </span>
                                                {i.assignedTo && (
                                                    <span className="muted small">
                                                        @{i.assignedTo.username}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="issue-actions">
                                                <button
                                                    className="ghost"
                                                    onClick={() => moveIssue(i, -1)}
                                                    disabled={i.status === "todo"}
                                                >
                                                    ←
                                                </button>
                                                <button
                                                    className="ghost"
                                                    onClick={() => moveIssue(i, 1)}
                                                    disabled={i.status === "done"}
                                                >
                                                    →
                                                </button>
                                                {i.createdBy?.username === user?.username && (
                                                    <button
                                                        className="ghost danger"
                                                        onClick={() => deleteIssue(i)}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
