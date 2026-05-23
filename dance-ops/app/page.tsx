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
  const [isMobile, setIsMobile] = useState(false);

  const [dragged, setDragged] = useState<{
    event: EventType;
    dayId: number;
  } | null>(null);

  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    time: "",
    place: "",
    road: "",
  });

  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth < 768);
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

  // ================= CRUD =================

  async function addEvent(dayId: number, team: "first" | "second") {
    await supabase.from("events").insert([
      {
        title: "new event",
        time: "00:00",
        team,
        day_id: dayId,
        road: "",
      },
    ]);

    await loadData();
  }

  async function deleteEvent(id: number) {
    await supabase.from("events").delete().eq("id", id);
    await loadData();
  }

  async function quickRoad(event: EventType) {
    const value = prompt("Road time:");
    if (!value) return;

    await supabase
      .from("events")
      .update({ road: value })
      .eq("id", event.id);

    await loadData();
  }

  function startEdit(event: EventType) {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      time: event.time,
      place: event.place || "",
      road: event.road || "",
    });
  }

  async function saveEdit() {
    if (!editingEvent) return;

    await supabase
      .from("events")
      .update(editForm)
      .eq("id", editingEvent.id);

    setEditingEvent(null);
    await loadData();
  }

  // ================= DRAG =================

  async function onDrop(dayId: number, team: "first" | "second") {
    if (!dragged) return;

    await supabase
      .from("events")
      .update({ day_id: dayId, team })
      .eq("id", dragged.event.id);

    setDragged(null);
    await loadData();
  }

  // ================= UI =================

  function renderEvent(event: EventType) {
    return (
      <div key={event.id} style={eventCard}>
        <div
          draggable
          onDragStart={() => setDragged({ event, dayId: event.day_id! })}
          onClick={() => startEdit(event)}
        >
          <div style={{ fontWeight: 700 }}>{event.time}</div>
          <div>{event.title}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{event.place}</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => quickRoad(event)}>🚗</button>
          <button onClick={() => deleteEvent(event.id)}>🗑</button>
        </div>

        {event.road && (
          <div style={{ fontSize: 12, color: "#777", marginTop: 5 }}>
            → {event.road}
          </div>
        )}
      </div>
    );
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(day.id, team)}
        style={columnStyle}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>{team === "first" ? day.firstTeamName : day.secondTeamName}</b>
          <button onClick={() => addEvent(day.id, team)}>➕</button>
        </div>

        <div style={{ marginTop: 10 }}>
          {items.map(renderEvent)}
        </div>
      </div>
    );
  }

  if (!isClient) return null;

  return (
    <div style={{ padding: 16 }}>
      <h1>🎭 Dance Ops</h1>

      {days.map((day) => (
        <div key={day.id} style={{ marginBottom: 30 }}>
          <h2>{day.date}</h2>

          {/* MOBILE */}
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {renderColumn(day, "first")}
              {renderColumn(day, "second")}
            </div>
          ) : (
            /* DESKTOP */
            <div style={{ display: "flex", gap: 20 }}>
              {renderColumn(day, "first")}
              {renderColumn(day, "second")}
            </div>
          )}
        </div>
      ))}

      {/* EDIT MODAL */}
      {editingEvent && (
        <div style={modal}>
          <div style={modalBox}>
            <h3>Edit event</h3>

            <input
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              placeholder="title"
            />

            <input
              value={editForm.time}
              onChange={(e) =>
                setEditForm({ ...editForm, time: e.target.value })
              }
              placeholder="time"
            />

            <input
              value={editForm.place}
              onChange={(e) =>
                setEditForm({ ...editForm, place: e.target.value })
              }
              placeholder="place"
            />

            <input
              value={editForm.road}
              onChange={(e) =>
                setEditForm({ ...editForm, road: e.target.value })
              }
              placeholder="road"
            />

            <button onClick={saveEdit}>Save</button>
            <button onClick={() => setEditingEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= STYLES =================

const columnStyle: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 14,
  padding: 12,
  minHeight: 200,
};

const eventCard: React.CSSProperties = {
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 10,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
};

const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  minWidth: 280,
};
