/* ═══════════════════════════════════════════════
   components/KpiCard.js
   ═══════════════════════════════════════════════ */

function KpiCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div className={`kpi-card${onClick?" clickable":""}`} onClick={onClick}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value" style={{color}}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub&&<div className="kpi-sub">{sub}</div>}
    </div>
  );
}
