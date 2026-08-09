import React, { useState, useEffect, useMemo } from "react";
import { Wallet, CalendarDays, Lightbulb, Plus, Trash2, Clock, MapPin, Tag } from "lucide-react";

const API_BASE = "https://secretary-bot-backend-production.up.railway.app/api";

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

const EXPENSE_TAGS = ["餐飲", "交通", "生活", "娛樂", "醫療", "其他"];

const CATEGORY_COLORS = {
  "餐飲": { bg: "#f5d4a3", text: "#8b6f47" },
  "交通": { bg: "#a3d4f5", text: "#476b8b" },
  "生活": { bg: "#f5a3d4", text: "#8b4770" },
  "娛樂": { bg: "#d4a3f5", text: "#704a8b" },
  "醫療": { bg: "#a3f5c4", text: "#47894b" },
  "其他": { bg: "#e8e4dc", text: "#6b6b6b" },
};

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

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#D9D5C7",
      padding: "40px 16px",
      fontFamily: "'Noto Sans TC', 'Segoe UI', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700;900&family=Noto+Sans+TC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        * { box-sizing: border-box; }
        
        .phone-frame {
          position: relative;
          background: #1c1c1c;
          border-radius: 44px;
          padding: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          width: 360px;
          height: 720px;
          overflow: hidden;
        }
        
        .phone-frame::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 112px;
          height: 24px;
          background: #1c1c1c;
          border-radius: 0 0 32px 32px;
          z-index: 10;
        }
        
        .phone-inner {
          width: 100%;
          height: 100%;
          background: #fffbf0;
          border-radius: 36px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .status-bar {
          padding: 6px 16px;
          font-size: 12px;
          color: #232323;
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono';
          padding-top: 20px;
        }
        
        .header {
          padding: 12px 16px;
          border-bottom: 1px dashed #d4ccc5;
        }
        
        .header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #2c2c2a;
          margin: 0;
          font-family: 'Noto Serif TC';
        }
        
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .tab-bar {
          display: flex;
          border-top: 1px dashed #d4ccc5;
          background: #F5F3EC;
        }
        
        .tab-btn {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          transition: color 0.2s;
          color: #9b9686;
        }
        
        .tab-btn.active {
          color: #232323;
        }
      `}</style>

      <div className="phone-frame">
        <div className="phone-inner">
          <div className="status-bar">
            <span>{new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
            <span>個人秘書</span>
          </div>

          <div className="header">
            <h1>{CATS[tab].label}</h1>
          </div>

          <div className="content">
            {tab === "finance" ? (
              <FinancePanel />
            ) : tab === "schedule" ? (
              <SchedulePanel />
            ) : (
              <IdeaPanel />
            )}
          </div>

          <div className="tab-bar">
            {Object.entries(CATS).map(([key, c]) => {
              const Icon = c.icon;
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`tab-btn ${active ? "active" : ""}`}
                  style={{ color: active ? c.color : "#9b9686" }}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                  <span>{c.label}</span>
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: active ? c.color : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== 記帳頁面 ==================== */
function FinancePanel() {
  const [expenseType, setExpenseType] = useState("支出");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_TAGS[0]);
  const [amount, setAmount] = useState("0");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  function handleNumberClick(num) {
    if (amount === "0") {
      setAmount(String(num));
    } else {
      setAmount(amount + String(num));
    }
  }

  function handleDecimal() {
    if (!amount.includes(".")) {
      setAmount(amount + ".");
    }
  }

  function handleAC() {
    setAmount("0");
  }

  async function handleRecord() {
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
          note: note.trim() || selectedCategory,
          category: selectedCategory,
          date: date,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setAmount("0");
        setNote("");
        setDate(todayStr());
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 訊息提示 */}
      {message && (
        <div style={{
          padding: "10px 12px",
          backgroundColor: message.includes("✅") ? "#e8f5e9" : "#ffebee",
          borderRadius: "6px",
          fontSize: "12px",
          color: message.includes("✅") ? "#2e7d32" : "#c62828",
          textAlign: "center"
        }}>
          {message}
        </div>
      )}

      {/* 支出/收入 切換 */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setExpenseType("支出")}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: expenseType === "支出" ? "#e8c4d0" : "#f5f1ea",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            color: expenseType === "支出" ? "#8b5a5a" : "#9b9686",
            cursor: "pointer"
          }}
        >
          支出
        </button>
        <button
          onClick={() => setExpenseType("收入")}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: expenseType === "收入" ? "#d0e8d0" : "#f5f1ea",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            color: expenseType === "收入" ? "#5a8b5a" : "#9b9686",
            cursor: "pointer"
          }}
        >
          收入
        </button>
      </div>

      {/* 日期選擇 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "14px", color: "#888" }}>📅</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: "white",
            border: "0.5px solid #d4ccc5",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#2c2c2a",
            fontFamily: "inherit"
          }}
        />
      </div>

      {/* 分類標籤 */}
      <div>
        <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px 0", fontWeight: "500" }}>分類</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {EXPENSE_TAGS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "10px",
                backgroundColor: selectedCategory === cat ? CATEGORY_COLORS[cat].bg : "#f5f1ea",
                border: selectedCategory === cat ? `2px solid ${CATEGORY_COLORS[cat].text}` : "1px solid #e8e4dc",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500",
                color: selectedCategory === cat ? CATEGORY_COLORS[cat].text : "#9b9686",
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 說明/備註 */}
      <div>
        <label style={{ display: "block", fontSize: "12px", color: "#888", margin: "0 0 6px 0", fontWeight: "500" }}>說明</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="輸入項目備註"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "white",
            border: "0.5px solid #d4ccc5",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#2c2c2a",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* 金額顯示 */}
      <div style={{
        backgroundColor: "white",
        border: "0.5px solid #d4ccc5",
        borderRadius: "8px",
        padding: "12px 16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "16px", color: "#888" }}>$</span>
          <span style={{ fontSize: "28px", fontWeight: "600", color: "#2c2c2a" }}>{amount}</span>
          <button
            onClick={handleAC}
            style={{
              padding: "6px 12px",
              backgroundColor: "#b8d4c8",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              color: "#4a6b5a",
              cursor: "pointer"
            }}
          >
            AC
          </button>
        </div>
      </div>

      {/* 計算器 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {/* 第一行 */}
        <button onClick={() => handleNumberClick(7)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>7</button>
        <button onClick={() => handleNumberClick(8)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>8</button>
        <button onClick={() => handleNumberClick(9)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>9</button>
        <button style={{ padding: "14px", backgroundColor: "#b4a7d6", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#5a5a7a", cursor: "pointer" }}>÷</button>

        {/* 第二行 */}
        <button onClick={() => handleNumberClick(4)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>4</button>
        <button onClick={() => handleNumberClick(5)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>5</button>
        <button onClick={() => handleNumberClick(6)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>6</button>
        <button style={{ padding: "14px", backgroundColor: "#b4a7d6", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#5a5a7a", cursor: "pointer" }}>×</button>

        {/* 第三行 */}
        <button onClick={() => handleNumberClick(1)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>1</button>
        <button onClick={() => handleNumberClick(2)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>2</button>
        <button onClick={() => handleNumberClick(3)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>3</button>
        <button style={{ padding: "14px", backgroundColor: "#b4a7d6", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#5a5a7a", cursor: "pointer" }}>−</button>

        {/* 第四行 */}
        <button onClick={() => handleNumberClick(0)} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>0</button>
        <button onClick={handleDecimal} style={{ padding: "14px", backgroundColor: "#e8c4d0", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "#8b5a5a", cursor: "pointer" }}>.</button>
        <button onClick={handleRecord} style={{ gridColumn: "span 2", padding: "14px", backgroundColor: "#5eb3d6", border: "none", borderRadius: "6px", fontSize: "18px", fontWeight: "600", color: "white", cursor: "pointer" }}>=</button>
      </div>

      {/* 記錄按鈕 */}
      <button
        onClick={handleRecord}
        disabled={loading}
        style={{
          width: "100%",
          padding: "16px",
          backgroundColor: "#5eb3d6",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          color: "white",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? "記錄中..." : "記錄"}
      </button>
    </div>
  );
}

/* ==================== 行程頁面 ==================== */
function SchedulePanel() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("09:00");
  const [place, setPlace] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {message && <div style={{ padding: "10px", backgroundColor: "#f5f1ea", borderRadius: "6px", fontSize: "12px", color: "#8b5a5a" }}>{message}</div>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="要做什麼事？" disabled={loading} style={{ padding: "10px", border: "0.5px solid #d4ccc5", borderRadius: "6px", fontSize: "14px" }} />
      <div style={{ display: "flex", gap: "8px" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading} style={{ flex: 1, padding: "10px", border: "0.5px solid #d4ccc5", borderRadius: "6px", fontSize: "12px" }} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={loading} style={{ flex: 1, padding: "10px", border: "0.5px solid #d4ccc5", borderRadius: "6px", fontSize: "12px" }} />
      </div>
      <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="地點（選填）" disabled={loading} style={{ padding: "10px", border: "0.5px solid #d4ccc5", borderRadius: "6px", fontSize: "14px" }} />
      <button onClick={submit} disabled={loading} style={{ padding: "12px", backgroundColor: "#5eb3d6", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "新增中..." : "加入行程"}</button>
      <div>
        {schedules.length === 0 && <p style={{ fontSize: "12px", color: "#9b9686", textAlign: "center", padding: "16px 0" }}>還沒有排定的行程</p>}
        {schedules.map((e) => (
          <div key={e.id} style={{ padding: "10px", borderBottom: "0.5px solid #e8e4dc", fontSize: "12px" }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "500", color: "#2c2c2a" }}>{e.title}</p>
            <p style={{ margin: "0", color: "#888", fontSize: "11px" }}>{fmtDate(e.startTime)} {e.startTime?.split("T")[1]?.slice(0, 5)}</p>
            {e.place && <p style={{ margin: "2px 0 0 0", color: "#888", fontSize: "11px" }}>📍 {e.place}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 靈感頁面 ==================== */
function IdeaPanel() {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {message && <div style={{ padding: "10px", backgroundColor: "#f5f1ea", borderRadius: "6px", fontSize: "12px", color: "#8b5a5a" }}>{message}</div>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="寫下任何浮現的想法…" disabled={loading} rows={3} style={{ padding: "10px", border: "0.5px solid #d4ccc5", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", resize: "none" }} />
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="標籤（選填）" disabled={loading} style={{ flex: 1, padding: "10px", border: "0.5px solid #d4ccc5", borderRadius: "6px", fontSize: "14px" }} />
        <button onClick={submit} disabled={loading} style={{ padding: "10px 16px", backgroundColor: "#5eb3d6", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>+</button>
      </div>
      <div>
        {ideas.length === 0 && <p style={{ fontSize: "12px", color: "#9b9686", textAlign: "center", padding: "16px 0" }}>靈感稍縱即逝，先記下來吧</p>}
        {ideas.map((e) => (
          <div key={e.id} style={{ padding: "10px", borderBottom: "0.5px solid #e8e4dc", fontSize: "12px" }}>
            <p style={{ margin: "0 0 4px 0", color: "#2c2c2a" }}>{e.content}</p>
            <p style={{ margin: "0", color: "#888", fontSize: "11px" }}>
              {e.tags && e.tags.length > 0 && `🏷️ ${e.tags[0]} · `}
              {fmtDate(e.date)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}