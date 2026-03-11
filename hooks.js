/* ═══════════════════════════════════════════════
   HOOKS.JS — hooks customizados
   ═══════════════════════════════════════════════ */

function useTheme() {
  const [dark, setDark] = useState(() => {
    const s = localStorage.getItem("fin-theme");
    return s ? s === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const html = document.documentElement;
    const meta = document.getElementById("meta-theme-color");
    if (dark) { html.classList.remove("light"); meta?.setAttribute("content","#06060f"); }
    else       { html.classList.add("light");    meta?.setAttribute("content","#f0f2f8"); }
    localStorage.setItem("fin-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, () => setDark(d => !d)];
}

function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}
