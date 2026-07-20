// Simple fetch wrapper. Reads token from localStorage; throws on non-2xx.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3010";

function getToken() {
    return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        // empty body
    }

    if (!res.ok) {
        const message = (data && data.message) || `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export const api = {
    // auth
    signup: (username, password) => request("/signup", { method: "POST", body: { username, password } }),
    signin: (username, password) => request("/signin", { method: "POST", body: { username, password } }),

    // orgs
    listOrganizations: () => request("/organizations"),
    createOrganization: (title, description) =>
        request("/organization", { method: "POST", body: { title, description } }),
    getOrganization: (organizationId) =>
        request(`/organization?organizationId=${encodeURIComponent(organizationId)}`),
    addMember: (organizationId, memberUsername) =>
        request("/add-member-to-organization", {
            method: "POST",
            body: { organizationId, memberUsername },
        }),
    removeMember: (organizationId, memberUsername) =>
        request("/members", {
            method: "DELETE",
            body: { organizationId, memberUsername },
        }),

    // users
    listUsers: () => request("/users"),

    // boards
    createBoard: (title, description, organizationId) =>
        request("/board", { method: "POST", body: { title, description, organizationId } }),
    getBoards: (organizationId) => {
        const q = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
        return request(`/boards${q}`);
    },

    // issues
    createIssue: (payload) => request("/issue", { method: "POST", body: payload }),
    getIssues: ({ boardId, organizationId, status } = {}) => {
        const params = new URLSearchParams();
        if (boardId) params.set("boardId", boardId);
        if (organizationId) params.set("organizationId", organizationId);
        if (status) params.set("status", status);
        const q = params.toString() ? `?${params.toString()}` : "";
        return request(`/issues${q}`);
    },
    updateIssue: (payload) => request("/issues", { method: "PUT", body: payload }),
    deleteIssue: (issueId) => request("/issue", { method: "DELETE", body: { issueId } }),
};
