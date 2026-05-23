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
  const [editEventForm, setEditEventForm] = useState({
    title: "",
    time: "",
    place: "",
    road: "",
  });

  // ===== EDIT DAY =====
  const [editingDay, setEditingDay] = useState<DayType | null>(null);
  const [dayEditValue, setDayEditValue] = useState("");

  // ===== EDIT TEAM =====
  const [editingTeam, setEditingTeam] = useState<{
    dayId: number;
    field: "first_team_name" | "second_team_name";
    value: string;
  } | null>(null);

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

  // ================= DAYS =================

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

  async function deleteDay(dayId: number) {
    await supabase.from("events").delete().eq("day_id", dayId);
    await supabase.from("days").delete().eq("id", dayId);
    await loadData();
  }

  function startEditDay(day: DayType) {
    setEditingDay(day);
    setDayEditValue(day.date);
  }

  async function saveDay() {
    if (!editingDay) return;

    await supabase
      .from("days")
      .update({ date: dayEditValue })
      .eq("id", editingDay.id);

    setEditingDay(null);
    await loadData();
  }

  // ================= TEAMS =================

  function startEditTeam(
    dayId: number,
    field: "first_team_name" | "second_team_name",
    value: string
  ) {
    setEditingTeam({ dayId, field, value });
  }

  async function saveTeam() {
    if (!editingTeam) return;

    await supabase
      .from("days")
      .update({ [editingTeam.field]: editingTeam.value })
      .eq("id", editingTeam.dayId);

    setEditingTeam(null);
    await loadData();
  }

  // ================= EVENTS =================

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
          borderRadius: 20,
          padding: 20,
          border: "1px solid #e5e5e5",
        }}
      >
        {/* TEAM HEADER */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div
              style={{ fontWeight: 800, cursor: "pointer" }}
              onClick={() =>
                startEditTeam(
                  day.id,
                  team === "first"
                    ? "first_team_name"
                    : "second_team_name",
                  team === "first"
                    ? day.firstTeamName
                    : day.secondTeamName
                )
              }
            >
              {team === "first"
                ? day.firstTeamName
                : day.secondTeamName}
            </div>

            <button onClick={() => addEvent(day.id, team)}>➕</button>
          </div>
        </div>

        {/* EVENTS + ROAD */}
        {items.map((event) => (
          <div key={event.id}>
            <div
              draggable
              onDragStart={() => setDragged({ event, dayId: day.id })}
              onClick={() => startEditEvent(event)}
              style={{
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 10,
                marginBottom: 6,
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

            {/* ROAD */}
            {event.road && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  fontSize: 12,
                  color: "#666",
                  marginBottom: 10,
                  paddingLeft: 10,
                }}
              >
                <span>→</span>
                <span>{event.road}</span>
              </div>
            )}
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
            <h2
              style={{ margin: 0, cursor: "pointer" }}
              onClick={() => startEditDay(day)}
            >
              {day.date}
            </h2>

            <button onClick={addDay}>➕</button>
            <button onClick={() => deleteDay(day.id)}>🗑</button>
          </div>

          {/* COLUMNS */}
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}

      {/* EVENT MODAL */}
      {editingEvent && (
        <div style={modalStyle}>
          <div style={boxStyle}>
            <h3>Edit Event</h3>

            <input
              value={editEventForm.title}
              onChange={(e) =>
                setEditEventForm({
                  ...editEventForm,
                  title: e.target.value,
                })
              }
              placeholder="title"
            />

            <input
              value={editEventForm.time}
              onChange={(e) =>
                setEditEventForm({
                  ...editEventForm,
                  time: e.target.value,
                })
              }
              placeholder="time"
            />

            <input
              value={editEventForm.place}
              onChange={(e) =>
                setEditEventForm({
                  ...editEventForm,
                  place: e.target.value,
                })
              }
              placeholder="place"
            />

            <input
              value={editEventForm.road}
              onChange={(e) =>
                setEditEventForm({
                  ...editEventForm,
                  road: e.target.value,
                })
              }
              placeholder="road"
            />

            <button onClick={saveEvent}>Save</button>
            <button onClick={() => setEditingEvent(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* DAY MODAL */}
      {editingDay && (
        <div style={modalStyle}>
          <div style={boxStyle}>
            <h3>Edit Day</h3>

            <input
              value={dayEditValue}
              onChange={(e) => setDayEditValue(e.target.value)}
            />

            <button onClick={saveDay}>Save</button>
            <button onClick={() => setEditingDay(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* TEAM MODAL */}
      {editingTeam && (
        <div style={modalStyle}>
          <div style={boxStyle}>
            <h3>Edit Team</h3>

            <input
              value={editingTeam.value}
              onChange={(e) =>
                setEditingTeam({
                  ...editingTeam,
                  value: e.target.value,
                })
              }
            />

            <button onClick={saveTeam}>Save</button>
            <button onClick={() => setEditingTeam(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const boxStyle: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  minWidth: 300,
};
