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

  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [editEventForm, setEditEventForm] = useState({
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

  // ================= EVENTS =================

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

  async function deleteEvent(eventId: number) {
    await supabase.from("events").delete().eq("id", eventId);
    await loadData();
  }

  function startEditEvent(event: EventType) {
    setEditingEvent(event);
    setEditEventForm({
      title: event.title || "",
      time: event.time || "",
      place: event.place || "",
      road: event.road || "",
    });
  }

  async function saveEvent() {
    if (!editingEvent) return;

    await supabase
      .from("events")
      .update({
        title: editEventForm.title,
        time: editEventForm.time,
        place: editEventForm.place,
        road: editEventForm.road,
      })
      .eq("id", editingEvent.id);

    setEditingEvent(null);
    await loadData();
  }

  async function quickSetRoad(event: EventType) {
    const value = prompt("Road time:");
    if (!value) return;

    await supabase
      .from("events")
      .update({ road: value })
      .eq("id", event.id);

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
          borderRadius: 16,
          padding: 16,
          border: "1px solid #e5e5e5",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>{team === "first" ? day.firstTeamName : day.secondTeamName}</b>
          <button onClick={() => addEvent(day.id, team)}>➕</button>
        </div>

        {/* EVENTS */}
        <div style={{ marginTop: 10 }}>
          {items.map((event) => (
            <div key={event.id} style={{ marginBottom: 10 }}>
              <div
                draggable
                onDragStart={() => setDragged({ event, dayId: day.id })}
                onClick={() => startEditEvent(event)}
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{event.time}</div>
                    <div>{event.title}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      quickSetRoad(event);
                    }}>
                      🚗
                    </button>

                    <button onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(event.id);
                    }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>

              {/* ROAD */}
              {event.road && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#777",
                    marginLeft: 10,
                    marginTop: 4,
                  }}
                >
                  → {event.road}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isClient) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>🎭 Dance Ops</h1>

      {days.map((day) => (
        <div key={day.id} style={{ marginBottom: 40 }}>
          <h2>{day.date}</h2>

          <div style={{ display: "flex", gap: 20 }}>
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}

      {/* EDIT MODAL */}
      {editingEvent && (
        <div style={modal}>
          <div style={box}>
            <h3>Edit event</h3>

            <input
              value={editEventForm.title}
              onChange={(e) =>
                setEditEventForm({ ...editEventForm, title: e.target.value })
              }
              placeholder="title"
            />

            <input
              value={editEventForm.time}
              onChange={(e) =>
                setEditEventForm({ ...editEventForm, time: e.target.value })
              }
              placeholder="time"
            />

            <input
              value={editEventForm.place}
              onChange={(e) =>
                setEditEventForm({ ...editEventForm, place: e.target.value })
              }
              placeholder="place"
            />

            <input
              value={editEventForm.road}
              onChange={(e) =>
                setEditEventForm({ ...editEventForm, road: e.target.value })
              }
              placeholder="road"
            />

            <button onClick={saveEvent}>Save</button>
            <button onClick={() => setEditingEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const box: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  minWidth: 300,
};
