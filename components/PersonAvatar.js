/* ═══════════════════════════════════════════════
   components/PersonAvatar.js
   ═══════════════════════════════════════════════ */

function PersonAvatar({ name, color, size=36, fontSize=13 }) {
  return (
    <div style={{
      width:size,height:size,borderRadius:"50%",
      background:color+"28",border:`2px solid ${color}`,
      color,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize,flexShrink:0,
      letterSpacing:"-0.02em",userSelect:"none",
    }}>{personInitials(name)}</div>
  );
}
