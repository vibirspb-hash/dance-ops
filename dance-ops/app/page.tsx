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
  const [selectedDay, setSelectedDay] = useState<DayType | null>(null);
  const [isClient, setIsClient] = useState(false);

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
        first: (eventsData || []).filter((e: any) => e.day_id === day.id && e.team === "first"),
        second: (eventsData || []).filter((e: any) => e.day_id === day.id && e.team === "second"),
      },
    }));

    setDays(formatted);
  }

  // ================= CREATE DAY =================
  async function addDay() {
    const { data } = await supabase
      .from("days")
      .insert([{ date: "new day", first_team_name: "Team 1", second_team_name: "Team 2" }])
      .select();

    await loadData();
  }

  // ================= EVENTS =================
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

    await supabase.from("events").update({
      title: editForm.title,
      time: editForm.time,
      place: editForm.place,
      road: editForm.road,
    }).eq("id", editingEvent.id);

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

  // ================= DASHBOARD =================
  function renderDashboard() {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ textAlign: "center", fontSize: 32, marginBottom: 30 }}>
          🎭 Dance Ops
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {days.map((day) => (
            <div
              key={day.id}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: 20,
                borderRadius: 16,
                background: "#1e2937",
                color: "white",
                cursor: "pointer",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {day.date}
            </div>
          ))}

          <div
            onClick={addDay}
            style={{
              padding: 20,
              borderRadius: 16,
              border: "2px dashed #999",
              textAlign: "center",
              cursor: "pointer",
              fontSize: 22,
            }}
          >
            ➕
          </div>
        </div>
      </div>
    );
  }

  // ================= DAY VIEW =================
  function renderDay(day: DayType) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setSelectedDay(null)} style={{ marginBottom: 20 }}>
          ← назад
        </button>

        <h2 style={{ fontSize: 28, marginBottom: 20 }}>{day.date}</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 24,
        }}>
          {renderColumn(day, "first")}
          {renderColumn(day, "second")}
        </div>
      </div>
    );
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];

    return (
      <div style={{ background: "#fff", padding: 20, borderRadius: 16 }}>
        <button onClick={() => addEvent(day.id, team)} style={{ marginBottom: 12 }}>
          ➕ add event
        </button>

        {items.map((event) => (
          <div key={event.id} onClick={() => startEdit(event)} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>{event.time}</div>
            <div>{event.title}</div>

            <button onClick={(e) => { e.stopPropagation(); quickRoad(event); }}>🚗</button>
            <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}>🗑</button>
          </div>
        ))}
      </div>
    );
  }

  if (!isClient) return null;

  return selectedDay ? renderDay(selectedDay) : renderDashboard();
}
