import { useState } from "react";
import { Plus, Trash2, Check, ClipboardList, Search, CalendarDays, X } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "border-l-emerald-400" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", bar: "border-l-amber-400" },
  high: { label: "สูง", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", bar: "border-l-red-400" },
};
const ORDER = ["low", "medium", "high"];

const CATS = {
  work: { label: "งาน", tag: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  personal: { label: "ส่วนตัว", tag: "bg-purple-50 text-purple-700 ring-purple-200", dot: "bg-purple-500" },
  shopping: { label: "ช้อปปิ้ง", tag: "bg-pink-50 text-pink-700 ring-pink-200", dot: "bg-pink-500" },
  health: { label: "สุขภาพ", tag: "bg-teal-50 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
};

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];
const EMPTY_TEXT = {
  all: "ไม่พบงาน ลองเพิ่มงานใหม่หรือเปลี่ยนตัวกรอง",
  active: "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const offset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const fmt = (s) => new Date(s + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });

function dueBadge(todo, today) {
  if (!todo.due) return null;
  const base = "bg-gray-100 text-gray-600 ring-gray-200";
  if (todo.done) return { cls: base, text: fmt(todo.due) };
  if (todo.due < today) return { cls: "bg-red-50 text-red-700 ring-red-200", text: `เลยกำหนด ${fmt(todo.due)}` };
  if (todo.due === today) return { cls: "bg-yellow-50 text-yellow-800 ring-yellow-300", text: "วันนี้" };
  return { cls: base, text: fmt(todo.due) };
}

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", category: "work", due: offset(-1) },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium", category: "shopping", due: offset(0) },
    { id: 3, text: "นัดตรวจสุขภาพประจำปี", done: false, priority: "medium", category: "health", due: offset(5) },
    { id: 4, text: "อ่านหนังสือ 20 หน้า", done: true, priority: "low", category: "personal", due: "" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [nextId, setNextId] = useState(5);

  const today = iso(new Date());

  const addTodo = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((p) => [{ id: nextId, text: t, done: false, priority, category, due }, ...p]);
    setNextId((n) => n + 1);
    setText("");
    setDue("");
  };
  const toggle = (id) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeIds = (ids) => {
    setTodos((p) => p.map((t) => (ids.includes(t.id) ? { ...t, leaving: true } : t)));
    setTimeout(() => setTodos((p) => p.filter((t) => !ids.includes(t.id))), 300);
  };
  const cyclePriority = (id) =>
    setTodos((p) =>
      p.map((t) => (t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t))
    );
  const saveEdit = () => {
    const t = editText.trim();
    if (editingId !== null) {
      if (t) setTodos((p) => p.map((x) => (x.id === editingId ? { ...x, text: t } : x)));
      else removeIds([editingId]);
    }
    setEditingId(null);
  };

  // Stats
  const total = todos.length;
  const doneN = todos.filter((t) => t.done).length;
  const overdueN = todos.filter((t) => !t.done && t.due && t.due < today).length;
  const activeN = total - doneN - overdueN;
  const pct = total ? Math.round((doneN / total) * 100) : 0;
  const remaining = total - doneN;
  const segments = [
    { n: doneN, color: "#10b981", label: "เสร็จแล้ว" },
    { n: activeN, color: "#60a5fa", label: "กำลังทำ" },
    { n: overdueN, color: "#ef4444", label: "เลยกำหนด" },
  ];
  let acc = 0;

  const visible = todos.filter(
    (t) =>
      (filter === "all" || (filter === "active" ? !t.done : t.done)) &&
      (catFilter === "all" || t.category === catFilter) &&
      t.text.toLowerCase().includes(query.trim().toLowerCase())
  );

  const catBtn = (key, label, dot, count) => (
    <button
      key={key}
      onClick={() => setCatFilter(key)}
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
        catFilter === key ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className="flex items-center gap-2">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className={`text-xs ${catFilter === key ? "text-gray-300" : "text-gray-400"}`}>{count}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">รายการสิ่งที่ต้องทำ</h1>
          <p className="mt-1 text-sm text-gray-500">จัดการงานของคุณให้เป็นระเบียบ</p>
        </header>

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-4 lg:w-60">
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <h2 className="mb-3 text-sm font-medium text-gray-900">หมวดหมู่</h2>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {catBtn("all", "ทั้งหมด", null, total)}
                {Object.entries(CATS).map(([k, c]) =>
                  catBtn(k, c.label, c.dot, todos.filter((t) => t.category === k).length)
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-md">
              <h2 className="mb-3 text-sm font-medium text-gray-900">สถิติ</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0">
                  <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
                    <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                    {total > 0 &&
                      segments.map((s) => {
                        const len = (s.n / total) * 100;
                        const el = (
                          <circle
                            key={s.label}
                            cx="21" cy="21" r="15.9155" fill="none"
                            stroke={s.color} strokeWidth="5"
                            strokeDasharray={`${len} ${100 - len}`}
                            strokeDashoffset={-acc}
                          />
                        );
                        acc += len;
                        return len > 0 ? el : null;
                      })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-gray-900">
                    {pct}%
                  </div>
                </div>
                <div className="min-w-0 space-y-1 text-xs text-gray-600">
                  <p className="text-sm text-gray-900">ทั้งหมด {total} งาน</p>
                  {segments.map((s) => (
                    <p key={s.label} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label} {s.n}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
                />
                <button
                  onClick={addTodo}
                  disabled={!text.trim()}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={18} />
                  <span>เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {Object.entries(CATS).map(([k, c]) => (
                    <option key={k} value={k}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">ความสำคัญ:</span>
                {ORDER.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ring-1 transition ${
                      priority === p ? PRIORITIES[p].badge + " font-medium" : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${PRIORITIES[p].dot}`} />
                    {PRIORITIES[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div className="mb-3 flex rounded-xl bg-gray-200/60 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm transition ${
                    filter === f.key ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <ul>
              {visible.map((todo) => {
                const db = dueBadge(todo, today);
                return (
                  <li
                    key={todo.id}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      todo.leaving ? "max-h-0 -translate-x-4 opacity-0" : "max-h-36 opacity-100"
                    }`}
                  >
                    <div className={`mb-2 flex items-start gap-3 rounded-xl border-l-4 bg-white px-3 py-3 shadow-sm transition hover:shadow-md sm:px-4 ${PRIORITIES[todo.priority].bar}`}>
                      <button
                        onClick={() => toggle(todo.id)}
                        aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                          todo.done ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white hover:border-gray-500"
                        }`}
                      >
                        {todo.done && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === todo.id ? (
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => { setEditingId(todo.id); setEditText(todo.text); }}
                            title="ดับเบิลคลิกเพื่อแก้ไข"
                            className={`block cursor-text select-none break-words transition-colors ${
                              todo.done ? "text-gray-400 line-through" : "text-gray-800"
                            }`}
                          >
                            {todo.text}
                          </span>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <button
                            onClick={() => cyclePriority(todo.id)}
                            title="คลิกเพื่อเปลี่ยนความสำคัญ"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition hover:opacity-80 ${PRIORITIES[todo.priority].badge}`}
                          >
                            {PRIORITIES[todo.priority].label}
                          </button>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${CATS[todo.category].tag}`}>
                            {CATS[todo.category].label}
                          </span>
                          {db && (
                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${db.cls}`}>
                              <CalendarDays size={12} />
                              {db.text}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeIds([todo.id])}
                        aria-label="ลบงาน"
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {visible.length === 0 && (
              <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
                <ClipboardList size={36} className="mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">{EMPTY_TEXT[filter]}</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between px-1 text-sm">
              <span className="text-gray-600">เหลือ {remaining} งานที่ต้องทำ</span>
              <button
                onClick={() => removeIds(todos.filter((t) => t.done).map((t) => t.id))}
                disabled={doneN === 0}
                className="rounded-lg px-3 py-1.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                ล้างงานที่เสร็จแล้ว ({doneN})
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
