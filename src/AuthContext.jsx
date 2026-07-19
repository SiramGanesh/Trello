import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const username = localStorage.getItem("username");
        return username ? { username } : null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) localStorage.setItem("token", token);
        else {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
        }
    }, [token]);

    async function signin(username, password) {
        setLoading(true);
        try {
            const res = await api.signin(username, password);
            setToken(res.token);
            setUser({ username });
            localStorage.setItem("token", res.token);
            localStorage.setItem("username", username);
            return res;
        } finally {
            setLoading(false);
        }
    }

    async function signup(username, password) {
        setLoading(true);
        try {
            const res = await api.signup(username, password);
            return res;
        } finally {
            setLoading(false);
        }
    }

    function signout() {
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ token, user, setUser, loading, signin, signup, signout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
