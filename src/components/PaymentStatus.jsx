/**
 * PaymentStatus — displays a Paid / Pending / Not Required badge.
 *
 * Usage:
 *   <PaymentStatus status={appointment.paymentStatus} fee={appointment.consultationFee} />
 *
 * paymentStatus values (from backend):
 *   "PAID"        → green  ✅ Paid
 *   "PENDING"     → amber  ⏳ Pending
 *   null/undefined → grey  — Not Required
 */
export default function PaymentStatus({ status, fee, size = "sm" }) {
  const map = {
    PAID: {
      label: "✅ Paid",
      bg: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
    PENDING: {
      label: "⏳ Pending",
      bg: "#fef9c3",
      color: "#854d0e",
      border: "1px solid #fde047",
    },
    FAILED: {
      label: "❌ Failed",
      bg: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fca5a5",
    },
  };

  const config = map[status] || {
    label: "— Not Required",
    bg: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
  };

  const fontSize = size === "xs" ? 11 : size === "sm" ? 12 : 13;
  const padding  = size === "xs" ? "3px 8px" : size === "sm" ? "4px 10px" : "6px 14px";

  return (
    <span
      title={fee ? `$${(fee / 100).toFixed(2)} NZD` : undefined}
      style={{
        display: "inline-block",
        background: config.bg,
        color: config.color,
        border: config.border,
        borderRadius: 999,
        padding,
        fontSize,
        fontWeight: 700,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {config.label}
      {status === "PAID" && fee ? ` · $${(fee / 100).toFixed(2)}` : ""}
    </span>
  );
}
