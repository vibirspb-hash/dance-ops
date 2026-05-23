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

  const [editingEvent, setEditingEvent] =
    useState<EventType | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    time: "",
    place: "",
    road: "",
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    loadData();
  }, [isClient]);

  async function loadData() {
    const { data: daysData } = await supabase
      .from("days")
      .select("*");

    const { data: eventsData } = await supabase
      .from("events")
      .select("*");

    const formatted: DayType[] = (daysData || []).map(
      (day: any) => ({
        id: day.id,
        date: day.date,
        firstTeamName: day.first_team_name,
        secondTeamName: day.second_team_name,
        boards: {
          first: (eventsData || []).filter(
            (e: any) =>
              e.day_id === day.id && e.team === "first"
          ),
          second: (eventsData || []).filter(
            (e: any) =>
              e.day_id === day.id && e.team === "second"
          ),
        },
      })
    );

    setDays(formatted);
  }

  // =========================
  // EVENTS
  // =========================

  async function addEvent(
    dayId: number,
    team: "first" | "second"
  ) {
    await supabase.from("events").insert([
      {
        title: "new event",
        time: "00:00",
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
    const value = prompt("Road time");

    if (!value) return;

    await supabase
      .from("events")
      .update({ road: value })
      .eq("id", event.id);

    await loadData();
  }

  // =========================
  // DRAG
  // =========================

  async function onDrop(
    dayId: number,
    team: "first" | "second"
  ) {
    if (!dragged) return;

    await supabase
      .from("events")
      .update({
        day_id: dayId,
        team,
      })
      .eq("id", dragged.event.id);

    setDragged(null);

    await loadData();
  }

  // =========================
  // UI
  // =========================

  function renderEvent(
    event: EventType,
    dayId: number
  ) {
    return (
      <div key={event.id} style={{ marginBottom: 10 }}>
        <div
          draggable
          onDragStart={() =>
            setDragged({ event, dayId })
          }
          onClick={() => startEdit(event)}
          style={eventCard}
        >
          <div>
            <div style={timeStyle}>
              {event.time}
            </div>

            <div style={{ fontWeight: 600 }}>
              {event.title}
            </div>

            {event.place && (
              <div
                style={{
                  fontSize: 12,
                  color: "#777",
                }}
              >
                {event.place}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                quickRoad(event);
              }}
            >
              🚗
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEvent(event.id);
              }}
            >
              🗑
            </button>
          </div>
        </div>

        {/* ROAD */}

        {event.road && (
          <div style={roadStyle}>
            ───→ {event.road}
          </div>
        )}
      </div>
    );
  }

  function renderColumn(
    day: DayType,
    team: "first" | "second"
  ) {
    const items = day.boards[team];

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(day.id, team)}
        style={columnStyle}
      >
        <div style={columnHeader}>
          <div style={{ fontWeight: 700 }}>
            {team === "first"
              ? day.firstTeamName
              : day.secondTeamName}
          </div>

          <button
            onClick={() =>
              addEvent(day.id, team)
            }
          >
            ➕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {items.map((event) =>
            renderEvent(event, day.id)
          )}
        </div>
      </div>
    );
  }

  if (!isClient) return null;

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 30 }}>
        🎭 Dance Ops
      </h1>

      {days.map((day) => (
        <div
          key={day.id}
          style={{ marginBottom: 40 }}
        >
          <h2 style={{ marginBottom: 16 }}>
            {day.date}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                typeof window !== "undefined" &&
                window.innerWidth < 768
                  ? "1fr"
                  : "1fr 1fr",
              gap: 20,
            }}
          >
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}

      {/* MODAL */}

      {editingEvent && (
        <div style={modal}>
          <div style={modalBox}>
            <h3>Edit Event</h3>

            <input
              value={editForm.title}
              placeholder="Title"
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  title: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              value={editForm.time}
              placeholder="Time"
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  time: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              value={editForm.place}
              placeholder="Place"
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  place: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              value={editForm.road}
              placeholder="Road"
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  road: e.target.value,
                })
              }
              style={inputStyle}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <button onClick={saveEdit}>
                Save
              </button>

              <button
                onClick={() =>
                  setEditingEvent(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// STYLES
// =========================

const pageStyle: React.CSSProperties = {
  padding: 16,
  maxWidth: 1400,
  margin: "0 auto",
};

const columnStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 18,
  padding: 16,
  minHeight: 200,
  boxSizing: "border-box",
};

const columnHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const eventCard: React.CSSProperties = {
  padding: 12,
  border: "1px solid #ddd",
  borderRadius: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  cursor: "pointer",
  background: "#fff",
};

const roadStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#777",
  marginLeft: 14,
  marginTop: 4,
  marginBottom: 6,
};

const timeStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
};

const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBox: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  width: 320,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
};
