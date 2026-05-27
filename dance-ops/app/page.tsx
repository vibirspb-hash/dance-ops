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
    if (saved === "true") {
      setIsAuthed(true);
    }
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

  async function addDay() {
    const value = prompt("Введите дату:");
    if (!value) return;

    const { data } = await supabase
      .from("days")
      .insert([
        {
          date: value,
          first_team_name: "Первая команда",
          second_team_name: "Вторая команда",
        },
      ])
      .select()
      .single();

    await loadData();
    if (data?.id) setSelectedDayId(data.id);
  }

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

  async function addEvent(dayId: number, team: "first" | "second") {
    await supabase.from("events").insert([
      {
        title: "Новое выступление",
        time: "18:00",
        place: "",
        road: "",
        day_id: dayId,
        team,
      },
    ]);

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

    await supabase
      .from("events")
      .update({ day_id: dayId, team })
      .eq("id", dragged.event.id);

    setDragged(null);
    await loadData();
  }

  function renderAuth() {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        fontFamily: "system-ui, Arial",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 360,
          padding: 24,
          borderRadius: 16,
          background: "#111827",
          border: "1px solid #334155",
        }}>
          <h2 style={{ color: "white", marginBottom: 16 }}>🎭 Dance Ops</h2>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #334155",
              marginBottom: 12,
              background: "#0f172a",
              color: "white",
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              background: "#4f46e5",
              color: "white",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

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
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{event.time}</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{event.title}</div>
            {event.place && <div style={{ fontSize: 15, color: "#475569" }}>📍 {event.place}</div>}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); quickRoad(event); }}>🚗</button>
            <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}>🗑</button>
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
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(day.id, team)}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 24,
          border: "1px solid #e2e8f0",
        }}
      >
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
              style={{ background: "transparent", border: "none", color: "white" }}
            />
          ) : (
            teamName
          )}
        </div>

        <button onClick={() => addEvent(day.id, team)} style={{ float: "right" }}>➕</button>

        <div>
          {items.map((event) => renderEvent(event, day.id))}
        </div>
      </div>
    );
  }

  function renderStartPage() {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 32 }}>
        <h1 style={{ textAlign: "center" }}>🎭 Dance Ops</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              style={{
                padding: 18,
                borderRadius: 18,
                background: "#fff",
                fontWeight: 800,
              }}
            >
              {day.date}
            </button>
          ))}

          <button onClick={addDay}>+</button>
        </div>
      </div>
    );
  }

  if (!isClient) return <div style={{ padding: 40 }}>Загрузка...</div>;

  if (!isAuthed) return renderAuth();

  const selectedDay = days.find((day) => day.id === selectedDayId);

  if (!selectedDay) return renderStartPage();

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setSelectedDayId(null)}>← Назад</button>

      <h1>🎭 Dance Ops</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {renderColumn(selectedDay, "first")}
        {renderColumn(selectedDay, "second")}
      </div>

      {editingEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: 24 }}>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} />

            <button onClick={saveEdit}>Сохранить</button>
            <button onClick={() => setEditingEvent(null)}>Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}
