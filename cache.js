/* ═══════════════════════════════════════════════
   CACHE.JS — persistência no localStorage
   ═══════════════════════════════════════════════ */

const CACHE_KEY   = "fin-dash-v2";
const CACHE_LIMIT = 6 * 1024 * 1024;

function loadPeople() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.people) ? data.people : [];
  } catch(e) { return []; }
}

function savePeople(people) {
  try {
    const payload = JSON.stringify({ people, updatedAt: Date.now() });
    if (payload.length > CACHE_LIMIT) return { ok: false, reason: "big" };
    localStorage.setItem("fin-dash-v2", payload);
    return { ok: true };
  } catch(e) { return { ok: false, reason: "error" }; }
}

function addOrReplacePerson(person) {
  const people = loadPeople();
  const idx = people.findIndex(p => p.name.toLowerCase() === person.name.toLowerCase());
  if (idx >= 0) people[idx] = person; else people.push(person);
  return savePeople(people);
}

function mergePersonFiles(name, newTransactions, newFileNames) {
  const people = loadPeople();
  const idx = people.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  if (idx < 0) return { ok: false, reason: "not_found" };
  const existing = people[idx];
  const existingKeys = new Set(existing.transactions.map(t => `${t.date}|${t.title}|${t.amount}`));
  const unique = newTransactions.filter(t => !existingKeys.has(`${t.date}|${t.title}|${t.amount}`));
  existing.transactions = [...existing.transactions, ...unique];
  existing.fileNames = [...new Set([...(existing.fileNames || []), ...newFileNames])];
  existing.savedAt = Date.now();
  people[idx] = existing;
  return savePeople(people);
}

function removePerson(name) {
  const people = loadPeople().filter(p => p.name.toLowerCase() !== name.toLowerCase());
  savePeople(people);
}
