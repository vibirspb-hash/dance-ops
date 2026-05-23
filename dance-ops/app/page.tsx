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

  // ==================== EVENTS ====================
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

  // ==================== DASHBOARD ====================
  function renderDashboard() {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 30 }}>
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
                padding: 18,
                borderRadius: 16,
                background: "#1e2937",
                color: "white",
                textAlign: "center",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {day.date}
            </div>
          ))}

          {/* add day */}
          <div
            onClick={async () => {
              await supabase.from("days").insert([
                {
                  date: "new day",
                  first_team_name: "Team 1",
                  second_team_name: "Team 2",
                },
              ]);
              await loadData();
            }}
            style={{
              padding: 18,
              borderRadius: 16,
              border: "2px dashed #999",
              textAlign: "center",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ➕
          </div>
        </div>
      </div>
    );
  }

  // ==================== DAY VIEW ====================
  function renderDay(day: DayType) {
    return (
      <div style={{ padding: "20px 12px" }}>
        <button onClick={() => setSelectedDay(null)} style={{ marginBottom: 20 }}>
          ← Назад
        </button>

        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
          {day.date}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 24,
          }}
        >
          {renderColumn(day, "first")}
          {renderColumn(day, "second")}
        </div>
      </div>
    );
  }

  // ==================== COLUMN (ТВОЙ КОД БЕЗ ИЗМЕНЕНИЙ) ====================
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
            display: "inline-block",
            marginBottom: 24,
            cursor: "pointer",
          }}
        >
          {teamName}
        </div>

        <button onClick={() => addEvent(day.id, team)} style={{ float: "right", fontSize: 22 }}>
          ➕
        </button>

        <div style={{ clear: "both", display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((event) => renderEvent(event, day.id))}
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
            borderRadius: 16,
            background: "#fff",
            border: "1px solid #e0e7ff",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{event.time}</div>
            <div>{event.title}</div>
          </div>

          <div>
            <button onClick={(e) => { e.stopPropagation(); quickRoad(event); }}>🚗</button>
            <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}>🗑</button>
          </div>
        </div>

        {event.road && (
          <div style={{ marginLeft: 20, marginTop: 8, color: "#f59e0b" }}>
            → {event.road}
          </div>
        )}
      </div>
    );
  }

  if (!isClient) return null;

  // ==================== SWITCH ====================
  return selectedDay ? renderDay(selectedDay) : renderDashboard();
}
