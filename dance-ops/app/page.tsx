"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EventType = {
  id: number;
  title: string;
  time: string;
  place?: string;
  road?: string;
  team?: "first" | "second";
  day_id?: number;
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
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 🔐 AUTH
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");

  const [dragged, setDragged] = useState<{ event: EventType; dayId: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

  // Inline editing для дня и составов
  const [editingDayId, setEditingDayId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<"date" | "firstTeamName" | "secondTeamName" | null>(null);
  const [editValue, setEditValue] = useState("");

  const [editForm, setEditForm] = useState({
    title: "",
    time: "",
    place: "",
    road: "",
  });

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("dance_auth");
    if (saved === "true") setIsAuthed(true);
  }, []);

  useEffect(() => {
    if (!isClient || !isAuthed) return;
    loadData();
  }, [isClient, isAuthed]);

  function handleLogin() {
    if (password === "1733") {
      setIsAuthed(true);
      localStorage.setItem("dance_auth", "true");
    } else {
      alert("Неверный пароль");
    }
  }

  async function loadData() {
    const { data: daysData } = await supabase.from("days").select("*");
    const { data: eventsData } = await supabase.from("events").select("*");

    const formatted: DayType[] = (daysData || []).map((day: any) => ({
      id: day.id,
      date: day.date,
      firstTeamName: day.first_team_name,
      secondTeamName: day.second_team_name,
      boards: {
        first: (eventsData || []).filter((e: any) => e.day_id === day.id && e.team === "first"),
        second: (eventsData || []).filter((e: any) => e.day_id === day.id && e.team === "second"),
      },
    }));

    setDays(formatted);
  }

  // ==================== INLINE EDIT ====================
  function startDayEdit(dayId: number, field: "date" | "firstTeamName" | "secondTeamName", currentValue: string) {
    setEditingDayId(dayId);
    setEditingField(field);
    setEditValue(currentValue);
  }

  async function saveDayEdit() {
    if (!editingDayId || !editingField) return;

    const updateData: any = {};
    if (editingField === "date") updateData.date = editValue;
    if (editingField === "firstTeamName") updateData.first_team_name = editValue;
    if (editingField === "secondTeamName") updateData.second_team_name = editValue;

    await supabase.from("days").update(updateData).eq("id", editingDayId);

    setEditingDayId(null);
    setEditingField(null);
    await loadData();
  }

  // ==================== CRUD ====================
  async function addDay() {
    const value = prompt("Введите дату:");
    if (!value) return;

    const { data } = await supabase
      .from("days")
      .insert([{ date: value, first_team_name: "Я Воробушки", second_team_name: "Лев и новенькие" }])
      .select()
      .single();

    await loadData();
    if (data) setSelectedDayId(data.id);
  }

  async function addEvent(dayId: number, team: "first" | "second") {
    await supabase.from("events").insert([{
      title: "Новое выступление",
      time: "18:00",
      place: "",
      road: "",
      day_id: dayId,
      team,
    }]);
    await loadData();
  }

  async function deleteEvent(id: number) {
    await supabase.from("events").delete().eq("id", id);
    await loadData();
  }

  function startEdit(event: EventType) {
    setEditingEvent(event);
    setEditForm({
      title: event.title || "",
      time: event.time || "",
      place: event.place || "",
      road: event.road || "",
    });
  }

  async function saveEdit() {
    if (!editingEvent) return;
    await supabase
      .from("events")
      .update({
        title: editForm.title,
        time: editForm.time,
        place: editForm.place,
        road: editForm.road,
      })
      .eq("id", editingEvent.id);

    setEditingEvent(null);
    await loadData();
  }

  async function quickRoad(event: EventType) {
    const value = prompt("Время в пути:");
    if (!value) return;
    await supabase.from("events").update({ road: value }).eq("id", event.id);
    await loadData();
  }

  async function onDrop(dayId: number, team: "first" | "second") {
    if (!dragged) return;
    await supabase.from("events").update({ day_id: dayId, team }).eq("id", dragged.event.id);
    setDragged(null);
    await loadData();
  }

  // ==================== RENDER ====================
  function renderEvent(event: EventType, dayId: number) {
    return (
      <div key={event.id} style={{ marginBottom: 16 }}>
        <div
          draggable
          onDragStart={() => setDragged({ event, dayId })}
          onClick={() => startEdit(event)}
          style={{
            padding: "18px 20px",
            border: "1px solid #e0e7ff",
            borderRadius: 16,
            background: "#ffffff",
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
            cursor: "grab",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1e2937" }}>{event.time}</div>
            <div style={{ fontSize: 18.5, fontWeight: 600, marginTop: 4 }}>{event.title}</div>
            {event.place && <div style={{ fontSize: 15.5, color: "#475569", marginTop: 6 }}>📍 {event.place}</div>}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); quickRoad(event); }} style={{ fontSize: 22 }}>🚗</button>
            <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} style={{ fontSize: 22 }}>🗑</button>
          </div>
        </div>

        {event.road && (
          <div style={{ marginLeft: 24, marginTop: 8, color: "#f59e0b", fontWeight: 600 }}>
            → {event.road}
          </div>
        )}
      </div>
    );
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];
    const teamName = team === "first" ? day.firstTeamName : day.secondTeamName;
    const teamField = team === "first" ? "firstTeamName" : "secondTeamName";

    return (
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: 24,
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}>
        <div
          onClick={() => startDayEdit(day.id, teamField, teamName)}
          style={{
            fontSize: 23,
            fontWeight: 700,
            padding: "14px 24px",
            background: "#1e2937",
            color: "white",
            borderRadius: 16,
            marginBottom: 24,
            cursor: "pointer",
          }}
        >
          {editingDayId === day.id && editingField === teamField ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveDayEdit}
              onKeyDown={(e) => e.key === "Enter" && saveDayEdit()}
              autoFocus
              style={{ background: "transparent", border: "none", color: "white", fontSize: 23, fontWeight: 700 }}
            />
          ) : (
            teamName
          )}
        </div>

        <button onClick={() => addEvent(day.id, team)} style={{ float: "right", fontSize: 24 }}>➕</button>

        <div style={{ clear: "both", display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((event) => renderEvent(event, day.id))}
        </div>
      </div>
    );
  }

  if (!isClient) return <div style={{ padding: 40 }}>Загрузка...</div>;
  if (!isAuthed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: 32, background: "#111827", borderRadius: 20, border: "1px solid #334155" }}>
          <h2 style={{ color: "white", textAlign: "center", marginBottom: 24 }}>🎭 Dance Ops</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            style={{ width: "100%", padding: 14, borderRadius: 12, background: "#1e2937", color: "white", border: "1px solid #475569", marginBottom: 16 }}
          />
          <button onClick={handleLogin} style={{ width: "100%", padding: 14, background: "#4f46e5", color: "white", border: "none", borderRadius: 12, fontWeight: 700 }}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  const selectedDay = days.find(d => d.id === selectedDayId);

  if (!selectedDay) {
    return (
      <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
        <h1 style={{ textAlign: "center", marginBottom: 32 }}>🎭 Dance Ops</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {days.map(day => (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              style={{
                padding: 24,
                borderRadius: 16,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                fontSize: 18,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              {day.date}
            </button>
          ))}
          <button onClick={addDay} style={{ padding: 24, borderRadius: 16, background: "#f1f5f9", fontSize: 24 }}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", background: "#f8fafc", minHeight: "100vh" }}>
      <button onClick={() => setSelectedDayId(null)} style={{ marginBottom: 20, fontSize: 18 }}>← Назад к датам</button>

      {/* Дата */}
      <div
        onClick={() => startDayEdit(selectedDay.id, "date", selectedDay.date)}
        style={{
          display: "inline-block",
          background: "#1e2937",
          color: "white",
          borderRadius: 18,
          padding: "14px 32px",
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
          cursor: "pointer",
        }}
      >
        {editingDayId === selectedDay.id && editingField === "date" ? (
          <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveDayEdit} onKeyDown={(e) => e.key === "Enter" && saveDayEdit()} autoFocus style={{ background: "transparent", border: "none", color: "white", fontSize: 32, fontWeight: 800 }} />
        ) : (
          selectedDay.date
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {renderColumn(selectedDay, "first")}
        {renderColumn(selectedDay, "second")}
      </div>

      {/* Modal */}
      {editingEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: 28, borderRadius: 20, width: "90%", maxWidth: 420 }}>
            <h3>Редактировать выступление</h3>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={{ width: "100%", padding: 12, margin: "12px 0", borderRadius: 10, border: "1px solid #ddd" }} />
            <input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} style={{ width: "100%", padding: 12, margin: "12px 0", borderRadius: 10, border: "1px solid #ddd" }} />
            <input value={editForm.place} onChange={(e) => setEditForm({ ...editForm, place: e.target.value })} style={{ width: "100%", padding: 12, margin: "12px 0", borderRadius: 10, border: "1px solid #ddd" }} />
            <input value={editForm.road} onChange={(e) => setEditForm({ ...editForm, road: e.target.value })} style={{ width: "100%", padding: 12, margin: "20px 0", borderRadius: 10, border: "1px solid #ddd" }} />

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveEdit} style={{ flex: 1, padding: 14, background: "#4f46e5", color: "white", border: "none", borderRadius: 12 }}>Сохранить</button>
              <button onClick={() => setEditingEvent(null)} style={{ flex: 1, padding: 14, background: "#e2e8f0", border: "none", borderRadius: 12 }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
