"use client";

import { useState, useEffect } from "react";

type EventType = {
  id: number;
  title: string;
  time: string;
  place?: string;
  road?: string;
};

type DayType = {
  id: number;
  date: string;
  firstTeamName: string;
  secondTeamName: string;
  boards: {
    first: EventType[];
    second: EventType[];
  };
};

export default function Page() {
  const [days, setDays] = useState<DayType[]>([]);
  const [dragged, setDragged] = useState<{ event: EventType; dayId: number } | null>(null);

  const [editing, setEditing] = useState<{
    dayId: number;
    type: "date" | "team1" | "team2" | "time" | "title" | "place" | "road";
    eventId?: number;
  } | null>(null);

  const [editValue, setEditValue] = useState("");

  const STORAGE_KEY = "danceOpsData";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDays(JSON.parse(saved));
      } catch {
        setInitialData();
      }
    } else {
      setInitialData();
    }
  }, []);

  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    }
  }, [days]);

  function setInitialData() {
    setDays([
      {
        id: 1,
        date: "21 ИЮНЯ",
        firstTeamName: "Я Воробушки",
        secondTeamName: "Лев и новенькие",
        boards: {
          first: [{ id: 1, title: "Название выступления", time: "17:30", place: "Место проведения", road: "Время в пути" }],
          second: [{ id: 2, title: "Название выступления", time: "18:00", place: "Место проведения" }],
        },
      },
    ]);
  }

  // ==================== EDITING ====================
  function startEditing(dayId: number, type: any, currentValue: string, eventId?: number) {
    setEditing({ dayId, type, eventId });
    setEditValue(currentValue);
  }

  function saveEdit() {
    if (!editing) return;
    // ... (тот же saveEdit что был раньше)
    setDays((prev) =>
      prev.map((day) => {
        if (day.id !== editing.dayId) return day;

        if (editing.type === "date") return { ...day, date: editValue.trim() || day.date };
        if (editing.type === "team1") return { ...day, firstTeamName: editValue.trim() || day.firstTeamName };
        if (editing.type === "team2") return { ...day, secondTeamName: editValue.trim() || day.secondTeamName };

        return {
          ...day,
          boards: {
            ...day.boards,
            first: day.boards.first.map((e) =>
              e.id === editing.eventId ? { ...e, [editing.type]: editValue.trim() || undefined } : e
            ),
            second: day.boards.second.map((e) =>
              e.id === editing.eventId ? { ...e, [editing.type]: editValue.trim() || undefined } : e
            ),
          },
        };
      })
    );

    setEditing(null);
    setEditValue("");
  }

  // CRUD функции (addDay, addEvent, deleteEvent, onDrop) — оставил без изменений
  function addDay() {
    const date = prompt("Введите дату");
    if (!date) return;
    setDays((prev) => [...prev, { id: Date.now(), date, firstTeamName: "Я Воробушки", secondTeamName: "Лев и новенькие", boards: { first: [], second: [] } }]);
  }

  function addEvent(dayId: number, team: "first" | "second") {
    const title = prompt("Название события");
    if (!title) return;
    const time = prompt("Время");
    if (!time) return;
    const place = prompt("Место") || undefined;

    const newEvent: EventType = { id: Date.now(), title, time, place };
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? { ...day, boards: { ...day.boards, [team]: [...day.boards[team], newEvent] } }
          : day
      )
    );
  }

  function deleteEvent(dayId: number, team: "first" | "second", eventId: number) {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? { ...day, boards: { ...day.boards, [team]: day.boards[team].filter((e) => e.id !== eventId) } }
          : day
      )
    );
  }

  function onDrop(dayId: number, team: "first" | "second") {
    if (!dragged) return;
    setDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const first = day.boards.first.filter((e) => e.id !== dragged.event.id);
        const second = day.boards.second.filter((e) => e.id !== dragged.event.id);

        return {
          ...day,
          boards: {
            first: team === "first" ? [...first, dragged.event] : first,
            second: team === "second" ? [...second, dragged.event] : second,
          },
        };
      })
    );
    setDragged(null);
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];
    const teamName = team === "first" ? day.firstTeamName : day.secondTeamName;
    const teamType = team === "first" ? "team1" : "team2";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(day.id, team)}
        style={{
          flex: 1,
          minHeight: 700,
          background: "#ffffff",
          borderRadius: 24,
          padding: 24,
          border: "1px solid #e5e5e5",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Название состава */}
        <div
          onClick={() => startEditing(day.id, teamType, teamName)}
          style={{
            display: "inline-block",
            background: "#1e2937",
            color: "white",
            borderRadius: 16,
            padding: "12px 26px",
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 32,
            cursor: "pointer",
          }}
        >
          {editing?.dayId === day.id && editing.type === teamType ? (
            <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: 22, fontWeight: 700 }} />
          ) : (
            teamName
          )}
        </div>

        <button onClick={() => addEvent(day.id, team)} style={{ float: "right", border: "none", background: "#4f46e5", color: "white", borderRadius: 12, padding: "12px 20px", cursor: "pointer", fontSize: 18 }}>
          +
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 32, clear: "both" }}>
          {items.map((event, index) => (
            <div key={event.id}>
              {/* Карточка события */}
              <div
                draggable
                onDragStart={() => setDragged({ event, dayId: day.id })}
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: 24,
                  cursor: "grab",
                  border: "2px solid #e0e7ff",
                  boxShadow: "0 8px 25px rgba(79, 70, 229, 0.09)",
                  position: "relative",
                }}
              >
                <button onClick={() => deleteEvent(day.id, team, event.id)} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "6px 10px" }}>
                  🗑
                </button>

                <div onClick={() => startEditing(day.id, "time", event.time, event.id)} style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, cursor: "pointer" }}>
                  {editing?.eventId === event.id && editing.type === "time" ? <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus style={{ fontSize: 30, fontWeight: 800, border: "none", background: "transparent", outline: "none", width: "100%" }} /> : event.time}
                </div>

                <div onClick={() => startEditing(day.id, "place", event.place || "", event.id)} style={{ fontSize: 16.5, color: "#334155", marginBottom: 12, fontWeight: 600, cursor: "pointer" }}>
                  {editing?.eventId === event.id && editing.type === "place" ? <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus placeholder="Место проведения" style={{ width: "100%", border: "none", background: "transparent", outline: "none" }} /> : event.place ? `📍 ${event.place}` : <span style={{ color: "#94a3b8" }}>+ добавить место</span>}
                </div>

                <div onClick={() => startEditing(day.id, "title", event.title, event.id)} style={{ fontSize: 20, lineHeight: 1.4, fontWeight: 600, cursor: "pointer" }}>
                  {editing?.eventId === event.id && editing.type === "title" ? <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus style={{ fontSize: 20, fontWeight: 600, border: "none", background: "transparent", outline: "none", width: "100%" }} /> : event.title}
                </div>
              </div>

              {/* Road */}
              {index !== items.length - 1 && (
                <div onClick={() => startEditing(day.id, "road", event.road || "", event.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24, cursor: "pointer" }}>
                  {/* road блок */}
                  {editing?.eventId === event.id && editing.type === "road" ? (
                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus style={{ background: "#fef3c7", border: "2px solid #f59e0b", color: "#b45309", padding: "8px 24px", borderRadius: 999, fontWeight: 700, fontSize: 16 }} />
                  ) : event.road && event.road !== "Время в пути" ? (
                    <div style={{ background: "#f59e0b", color: "white", padding: "8px 24px", borderRadius: 999, fontWeight: 700 }}>{event.road}</div>
                  ) : (
                    <div style={{ background: "#fef3c7", color: "#d97706", padding: "8px 24px", borderRadius: 999, fontWeight: 600, border: "2px dashed #fbbf24" }}>+ время в пути</div>
                  )}
                  <div style={{ width: 3, height: 70, background: "#fcd34d", margin: "10px 0" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e2937", margin: 0 }}>🎭 Dance Ops</h1>
        <button onClick={addDay} style={{ padding: "12px 20px", borderRadius: 14, border: "none", background: "#4f46e5", color: "white", fontWeight: 600, cursor: "pointer" }}>
          + Добавить дату
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>
        {days.map((day) => (
          <div key={day.id}>
            {/* Дата */}
            <div
              onClick={() => startEditing(day.id, "date", day.date)}
              style={{
                display: "inline-block",
                background: "#1e2937",
                color: "white",
                borderRadius: 16,
                padding: "12px 28px",
                fontWeight: 800,
                fontSize: 30,
                marginBottom: 24,
                cursor: "pointer",
              }}
            >
              {editing?.dayId === day.id && editing.type === "date" ? (
                <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: 30, fontWeight: 800 }} />
              ) : (
                day.date
              )}
            </div>

            {/* Колонки */}
            <div style={{
              display: "flex",
              flexDirection: window.innerWidth < 900 ? "column" : "row", // Простой способ
              gap: 24,
            }}>
              {renderColumn(day, "first")}
              {renderColumn(day, "second")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
