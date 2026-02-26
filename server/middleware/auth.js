import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// ✅ Check if user is logged in
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

// ✅ Check role (DOCTOR / ADMIN / PATIENT)
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    next();
  };
}