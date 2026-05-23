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
  const [isClient, setIsClient] = useState(false);

  const [dragged, setDragged] = useState<{
    event: EventType;
    dayId: number;
  } | null>(null);

  // ===== EDIT EVENT =====
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    time: "",
    place: "",
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    loadData();
  }, [isClient]);

  async function loadData() {
    const { data: daysData } = await supabase.from("days").select("*");
    const { data: eventsData } = await supabase.from("events").select("*");

    const formatted: DayType[] = (daysData || []).map((day: any) => ({
      id: day.id,
      date: day.date,
      firstTeamName: day.first_team_name,
      secondTeamName: day.second_team_name,
      boards: {
        first: (eventsData || []).filter(
          (e: any) => e.day_id === day.id && e.team === "first"
        ),
        second: (eventsData || []).filter(
          (e: any) => e.day_id === day.id && e.team === "second"
        ),
      },
    }));

    setDays(formatted);
  }

  // ===== ADD DAY =====
  async function addDay() {
    await supabase.from("days").insert([
      {
        date: "new day",
        first_team_name: "first",
        second_team_name: "second",
      },
    ]);

    await loadData();
  }

  // ===== DELETE DAY =====
  async function deleteDay(dayId: number) {
    await supabase.from("events").delete().eq("day_id", dayId);
    await supabase.from("days").delete().eq("id", dayId);
    await loadData();
  }

  // ===== ADD EVENT =====
  async function addEvent(dayId: number, team: "first" | "second") {
    await supabase.from("events").insert([
      {
        title: "new event",
        time: "00:00",
        team,
        day_id: dayId,
      },
    ]);

    await loadData();
  }

  // ===== DELETE EVENT =====
  async function deleteEvent(eventId: number) {
    await supabase.from("events").delete().eq("id", eventId);
    await loadData();
  }

  // ===== EDIT EVENT =====
  function startEdit(event: EventType) {
    setEditingEvent(event);
    setEditForm({
      title: event.title || "",
      time: event.time || "",
      place: event.place || "",
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
      })
      .eq("id", editingEvent.id);

    setEditingEvent(null);
    await loadData();
  }

  // ===== DROP =====
  async function onDrop(dayId: number, team: "first" | "second") {
    if (!dragged) return;

    await supabase
      .from("events")
      .update({ day_id: dayId, team })
      .eq("id", dragged.event.id);

    setDragged(null);
    await loadData();
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(day.id, team)}
        style={{
          flex: 1,
          minHeight: 500,
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          border: "1px solid #e5e5e5",
        }}
      >
        {/* COLUMN HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 800 }}>
            {team === "first" ? day.firstTeamName : day.secondTeamName}
          </div>

          <button onClick={() => addEvent(day.id, team)}>➕</button>
        </div>

        {/* EVENTS */}
        {items.map((event) => (
          <div
            key={event.id}
            draggable
            onDragStart={() => setDragged({ event, dayId: day.id })}
            onClick={() => startEdit(event)}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEvent(event.id);
              }}
            >
              🗑
            </button>

            <div style={{ fontWeight: 700 }}>{event.time}</div>
            <div>{event.title}</div>
          </div>
        ))}
      </div>
    );
  }

  if (!isClient) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>🎭 Dance Ops</h1>

      {/* DAYS */}
      {days.map((day) => (
        <div key={day.id} style={{ marginBottom: 40 }}>
          {/* DAY HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0 }}>{day.date}</h2>

            <button onClick={addDay}>➕</button>

            <button
              onClick={() => deleteDay(day.id)}
              style={{ marginLeft: 10 }}
            >
              🗑
            </button>
          </div>

          {/* COLUMNS */}
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}

      {/* EDIT MODAL */}
      {editingEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
            <h3>Edit Event</h3>

            <input
              placeholder="title"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
            />

            <input
              placeholder="time"
              value={editForm.time}
              onChange={(e) =>
                setEditForm({ ...editForm, time: e.target.value })
              }
            />

            <input
              placeholder="place"
              value={editForm.place}
              onChange={(e) =>
                setEditForm({ ...editForm, place: e.target.value })
              }
            />

            <div style={{ marginTop: 10 }}>
              <button onClick={saveEdit}>Save</button>
              <button onClick={() => setEditingEvent(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
