import { useState } from "react";
import { Plus, Trash2, Check, ClipboardList } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "border-l-emerald-400" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", bar: "border-l-amber-400" },
  high: { label: "สูง", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", bar: "border-l-red-400" },
};
const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย",
  active: "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", leaving: false },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium", leaving: false },
    { id: 3, text: "อ่านหนังสือ 20 หน้า", done: true, priority: "low", leaving: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [nextId, setNextId] = useState(4);

  const addTodo = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [{ id: nextId, text: t, done: false, priority, leaving: false }, ...prev]);
    setNextId((n) => n + 1);
    setText("");
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setTodos((prev) => prev.filter((t) => t.id !== id)), 300);
  };

  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] } : t
      )
    );

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    const t = editText.trim();
    if (editingId !== null) {
      if (t) setTodos((prev) => prev.map((x) => (x.id === editingId ? { ...x, text: t } : x)));
      else remove(editingId);
    }
    setEditingId(null);
  };

  const clearCompleted = () => {
    const ids = todos.filter((t) => t.done).map((t) => t.id);
    setTodos((prev) => prev.map((t) => (t.done ? { ...t, leaving: true } : t)));
    setTimeout(() => setTodos((prev) => prev.filter((t) => !ids.includes(t.id))), 300);
  };

  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.filter((t) => t.done).length;
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">รายการสิ่งที่ต้องทำ</h1>
          <p className="mt-1 text-sm text-gray-500">จัดการงานของคุณให้เป็นระเบียบ</p>
        </header>

        {/* Add form */}
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">ความสำคัญ:</span>
            {ORDER.map((p) => {
              const active = priority === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ring-1 transition ${
                    active ? PRIORITIES[p].badge + " font-medium" : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${PRIORITIES[p].dot}`} />
                  {PRIORITIES[p].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter tabs */}
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
          {visible.map((todo) => (
            <li
              key={todo.id}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                todo.leaving ? "max-h-0 -translate-x-4 opacity-0" : "max-h-28 opacity-100"
              }`}
            >
              <div
                className={`mb-2 flex items-center gap-3 rounded-xl border-l-4 bg-white px-3 py-3 shadow-sm transition hover:shadow-md sm:px-4 ${PRIORITIES[todo.priority].bar}`}
              >
                <button
                  onClick={() => toggle(todo.id)}
                  aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition focus:outline-none focus:ring-2 focus:ring-gray-300 ${
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
                      onDoubleClick={() => startEdit(todo)}
                      title="ดับเบิลคลิกเพื่อแก้ไข"
                      className={`block cursor-text select-none break-words transition-colors ${
                        todo.done ? "text-gray-400 line-through" : "text-gray-800"
                      }`}
                    >
                      {todo.text}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => cyclePriority(todo.id)}
                  title="คลิกเพื่อเปลี่ยนความสำคัญ"
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition hover:opacity-80 ${PRIORITIES[todo.priority].badge}`}
                >
                  {PRIORITIES[todo.priority].label}
                </button>

                <button
                  onClick={() => remove(todo.id)}
                  aria-label="ลบงาน"
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <ClipboardList size={36} className="mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">{EMPTY_TEXT[filter]}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between px-1 text-sm">
          <span className="text-gray-600">เหลือ {remaining} งานที่ต้องทำ</span>
          <button
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="rounded-lg px-3 py-1.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ล้างงานที่เสร็จแล้ว ({completedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
