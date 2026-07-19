import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import OrgDetail from "./pages/OrgDetail";
import BoardDetail from "./pages/BoardDetail";
import "./App.css";

const router = createBrowserRouter([
    {
        path: "/",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
    },
    {
        path: "/signin",
        element: <Signin />
    },
    {
        path: "/signup",
        element: <Signup />
    },
    {
        path: "/org/:orgId",
        element: <ProtectedRoute><OrgDetail /></ProtectedRoute>
    },
    {
        path: "/board/:boardId",
        element: <ProtectedRoute><BoardDetail /></ProtectedRoute>
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]);

export default function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />
        </AuthProvider>
    );
}
