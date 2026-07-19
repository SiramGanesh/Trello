import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }
    return children;
}
