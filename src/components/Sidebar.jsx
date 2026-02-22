import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ items = [] }) {
  const location = useLocation();

  return (
    <aside style={styles.aside}>
      <div style={styles.heading}>Menu</div>
      <div style={styles.list}>
        {items.map((it) => {
          const active = location.pathname === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              style={{
                ...styles.item,
                ...(active ? styles.active : {}),
              }}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

const styles = {
  aside: {
    width: 240,
    borderRight: "1px solid #e8e8e8",
    padding: 16,
    minHeight: "calc(100vh - 60px)",
  },
  heading: { fontWeight: 700, marginBottom: 12 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  item: {
    textDecoration: "none",
    color: "#222",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
  },
  active: {
    border: "1px solid #222",
    background: "#f5f5f5",
    fontWeight: 700,
  },
};