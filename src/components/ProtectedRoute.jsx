import { Navigate } from "react-router-dom";

/**
 * allowedRoles can be a single string or an array
 * e.g. allowedRoles="DOCTOR"
 *      allowedRoles={["DOCTOR", "PATIENT"]}
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role check
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(user.role)) {
      // Redirect to their own dashboard instead of a blank 403
      if (user.role === "DOCTOR")  return <Navigate to="/doctor"  replace />;
      if (user.role === "PATIENT") return <Navigate to="/patient" replace />;
      if (user.role === "ADMIN")   return <Navigate to="/admin"   replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
