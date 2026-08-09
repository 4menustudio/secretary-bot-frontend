import React, { useState, useEffect, useMemo } from "react";
import { Wallet, CalendarDays, Lightbulb, Plus, Trash2, Clock, MapPin, Tag } from "lucide-react";

// 後端 API 基礎網址（本機開發用 localhost:5000）
const API_BASE = "http://localhost:5000/api";

const CATS = {
  finance: {
    label: "記帳",
    color: "#5C6F4E",
    soft: "#E7ECDD",
    icon: Wallet,
  },
  schedule: {
    label: "行程",
    color: "#2B3A55",
    soft: "#DEE3EC",
    icon: CalendarDays,
  },
  idea: {
    label: "靈感",
    color: "#B0791F",
    soft: "#F1E4C8",
    icon: Lightbulb,
  },
};

const EXPENSE_TAGS = ["餐飲", "交通", "生活", "娛樂", "其他"];

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${w})`;
}

export default function App() {
  const [tab, setTab] = useState("finance");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="min-h-screen w-full bg-[#EDEAE0] font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700;900&family=Noto+Sans+TC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .font-display { font-family: 'Noto Serif TC', serif; }
        .font-body { font-family: 'Noto Sans TC', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .stamp {
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        @keyframes pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pop-in { animation: pop 0.18s ease-out; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c9c4b3; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#EDEAE0] border-b border-dashed border-[#c9c4b3] px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#8a8474] font-mono">DAILY LOG</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#232323] leading-tight">
              {CATS[tab].label}
            </h1>
          </div>
          <div
            className="stamp w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center rotate-[-8deg]"
            style={{ backgroundColor: CATS[tab].color }}
          >
            {React.createElement(CATS[tab].icon, { size: 28, color: "#fff", strokeWidth: 2.2 })}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 py-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-yellow-800">{message}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {tab === "finance" ? (
          <FinancePanel setMessage={setMessage} setLoading={setLoading} loading={loading} />
        ) : tab === "schedule" ? (
          <SchedulePanel setMessage={setMessage} setLoading={setLoading} loading={loading} />
        ) : (
          <IdeaPanel setMessage={setMessage} setLoading={setLoading} loading={loading} />
        )}
      </div>

      {/* Tab bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-[#c9c4b3] bg-[#F5F3EC] shadow-lg">
        {Object.entries(CATS).map(([key, c]) => {
          const Icon = c.icon;
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex flex-col items-center gap-1 py-3 sm:py-4 transition-colors hover:opacity-80"
              style={{ color: active ? c.color : "#9b9686" }}
            >
              <Icon size={24} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[11px] sm:text-xs font-medium">{c.label}</span>
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: active ? c.color : "transparent" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 記帳 ---------- */
function FinancePanel({ setMessage, loading, setLoading }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(EXPENSE_TAGS[0]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const res = await fetch(`${API_BASE}/expenses`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error("取得支出失敗：", err);
    }
  }

  async function submit() {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setMessage("❌ 請輸入正確的金額");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: val,
          note: note.trim() || category,
          category,
          date: todayStr(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setAmount("");
        setNote("");
        setTimeout(() => setMessage(""), 3000);
        fetchExpenses();
      } else {
        setMessage(`❌ 錯誤：${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ 網路錯誤：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const monthTotal = useMemo(
    () => expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [expenses]
  );

  return (
    <div>
      <div className="bg-white/70 rounded-xl px-4 py-3 mb-4 border border-[#c9c4b3]">
        <p className="text-[11px] text-[#8a8474] font-mono tracking-wide">本月支出</p>
        <p className="font-mono font-bold text-2xl text-[#232323] border-b-2 border-[#232323] inline-block pb-0.5">
          NT$ {monthTotal.toLocaleString()}
        </p>
      </div>

      <div className="bg-white rounded-xl p-3 mb-4 border border-[#c9c4b3] space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額"
            disabled={loading}
            className="w-24 font-mono text-sm rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none focus:border-[#5C6F4E] disabled:opacity-50"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="項目備註"
            disabled={loading}
            className="flex-1 text-sm rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none focus:border-[#5C6F4E] disabled:opacity-50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {EXPENSE_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setCategory(t)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full border disabled:opacity-50"
              style={{
                borderColor: category === t ? "#5C6F4E" : "#d8d3c2",
                backgroundColor: category === t ? "#E7ECDD" : "transparent",
                color: category === t ? "#5C6F4E" : "#8a8474",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1 bg-[#5C6F4E] text-white text-sm font-medium rounded-lg py-2 mt-1 disabled:opacity-50"
        >
          <Plus size={15} /> {loading ? "記錄中..." : "記一筆"}
        </button>
      </div>

      <ul className="space-y-2">
        {expenses.length === 0 && <EmptyState text="還沒有任何記帳紀錄" />}
        {expenses.map((e) => (
          <li key={e.id} className="pop-in flex items-center justify-between bg-white rounded-lg border border-[#e3dfd0] px-3 py-2">
            <div className="flex items-center gap-2.5">
              <span className="stamp w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "#5C6F4E" }}>
                {e.category?.slice(0, 1)}
              </span>
              <div>
                <p className="text-sm text-[#232323]">{e.note}</p>
                <p className="text-[10px] text-[#8a8474] font-mono">{fmtDate(e.date)} · {e.category}</p>
              </div>
            </div>
            <span className="font-mono text-sm font-semibold text-[#232323]">${e.amount?.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 行程 ---------- */
function SchedulePanel({ setMessage, loading, setLoading }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("09:00");
  const [place, setPlace] = useState("");
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    try {
      const res = await fetch(`${API_BASE}/schedules`);
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error("取得行程失敗：", err);
    }
  }

  async function submit() {
    if (!title.trim()) {
      setMessage("❌ 請輸入事項");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date,
          time,
          place: place.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setTitle("");
        setPlace("");
        setDate(todayStr());
        setTime("09:00");
        setTimeout(() => setMessage(""), 3000);
        fetchSchedules();
      } else {
        setMessage(`❌ 錯誤：${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ 網路錯誤：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl p-3 mb-4 border border-[#c9c4b3] space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="要做什麼事？"
          disabled={loading}
          className="w-full text-sm rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none focus:border-[#2B3A55] disabled:opacity-50"
        />
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading} className="flex-1 font-mono text-xs rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none disabled:opacity-50" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={loading} className="flex-1 font-mono text-xs rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none disabled:opacity-50" />
        </div>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="地點（選填）"
          disabled={loading}
          className="w-full text-sm rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none focus:border-[#2B3A55] disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1 bg-[#2B3A55] text-white text-sm font-medium rounded-lg py-2 mt-1 disabled:opacity-50"
        >
          <Plus size={15} /> {loading ? "新增中..." : "加入行程"}
        </button>
      </div>

      <ul className="space-y-2">
        {schedules.length === 0 && <EmptyState text="還沒有排定的行程" />}
        {schedules.map((e) => (
          <li key={e.id} className="pop-in flex items-center justify-between bg-white rounded-lg border border-[#e3dfd0] px-3 py-2">
            <div className="flex items-center gap-2.5">
              <div className="text-center w-10">
                <p className="font-mono text-[10px] text-[#8a8474]">{fmtDate(e.startTime)?.slice(0, 4)}</p>
                <p className="font-mono text-xs font-bold text-[#2B3A55] flex items-center justify-center gap-0.5">
                  <Clock size={10} />{e.startTime?.split("T")[1]?.slice(0, 5)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#232323]">{e.title}</p>
                {e.place && (
                  <p className="text-[10px] text-[#8a8474] flex items-center gap-0.5">
                    <MapPin size={10} />{e.place}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 靈感 ---------- */
function IdeaPanel({ setMessage, loading, setLoading }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    try {
      const res = await fetch(`${API_BASE}/ideas`);
      const data = await res.json();
      if (data.success) {
        setIdeas(data.ideas || []);
      }
    } catch (err) {
      console.error("取得靈感失敗：", err);
    }
  }

  async function submit() {
    if (!text.trim()) {
      setMessage("❌ 請輸入靈感內容");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          tag: tag.trim(),
          date: todayStr(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setText("");
        setTag("");
        setTimeout(() => setMessage(""), 3000);
        fetchIdeas();
      } else {
        setMessage(`❌ 錯誤：${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ 網路錯誤：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl p-3 mb-4 border border-[#c9c4b3] space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="寫下任何浮現的想法…"
          disabled={loading}
          rows={3}
          className="w-full text-sm rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none focus:border-[#B0791F] resize-none disabled:opacity-50"
        />
        <div className="flex gap-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="標籤（選填）"
            disabled={loading}
            className="flex-1 text-sm rounded-lg border border-[#d8d3c2] px-2 py-2 outline-none focus:border-[#B0791F] disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center justify-center gap-1 bg-[#B0791F] text-white text-sm font-medium rounded-lg px-4 disabled:opacity-50"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {ideas.length === 0 && <EmptyState text="靈感稍縱即逝，先記下來吧" />}
        {ideas.map((e) => (
          <li key={e.id} className="pop-in bg-white rounded-lg border border-[#e3dfd0] px-3 py-2.5">
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm text-[#232323] leading-snug flex-1">{e.content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {e.tags && e.tags.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1E4C8] text-[#B0791F] flex items-center gap-0.5">
                  <Tag size={9} />{e.tags[0]}
                </span>
              )}
              <span className="text-[10px] text-[#8a8474] font-mono">{fmtDate(e.date)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-10">
      <p className="text-[13px] text-[#a29c8a]">{text}</p>
    </div>
  );
}
