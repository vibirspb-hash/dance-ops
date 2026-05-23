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

  // ==================== CRUD ====================
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

  // ==================== STYLES ====================
  const eventCard: React.CSSProperties = {
    padding: "16px 20px",
    border: "1px solid #e0e7ff",
    borderRadius: 16,
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    cursor: "grab",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    transition: "all 0.2s",
  };

  const timeStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    color: "#1e2937",
    marginBottom: 6,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.4,
    color: "#1e2937",
  };

  const placeStyle: React.CSSProperties = {
    fontSize: 15,
    color: "#475569",
    marginTop: 4,
  };

  const roadStyle: React.CSSProperties = {
    marginLeft: 16,
    marginTop: 8,
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: 600,
  };

  const columnStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 20,
    padding: 20,
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    minHeight: 600,
  };

  return (
    <div style={{ padding: "20px 16px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, Arial, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e2937" }}>🎭 Dance Ops</h1>
        </div>

        {days.map((day) => (
          <div key={day.id} style={{ marginBottom: 60 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1e2937", marginBottom: 20 }}>{day.date}</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
                gap: 24,
              }}
            >
              {/* Первый состав */}
              <div style={columnStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{day.firstTeamName}</div>
                  <button onClick={() => addEvent(day.id, "first")} style={{ padding: "8px 16px", fontSize: 18 }}>➕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {day.boards.first.map((event) => (
                    <div key={event.id}>
                      <div
                        draggable
                        onDragStart={() => setDragged({ event, dayId: day.id })}
                        onClick={() => startEdit(event)}
                        style={eventCard}
                      >
                        <div>
                          <div style={timeStyle}>{event.time}</div>
                          <div style={titleStyle}>{event.title}</div>
                          {event.place && <div style={placeStyle}>📍 {event.place}</div>}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button onClick={(e) => { e.stopPropagation(); quickRoad(event); }}>🚗</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}>🗑</button>
                        </div>
                      </div>

                      {event.road && <div style={roadStyle}>→ {event.road}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Второй состав */}
              <div style={columnStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{day.secondTeamName}</div>
                  <button onClick={() => addEvent(day.id, "second")} style={{ padding: "8px 16px", fontSize: 18 }}>➕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {day.boards.second.map((event) => (
                    <div key={event.id}>
                      <div
                        draggable
                        onDragStart={() => setDragged({ event, dayId: day.id })}
                        onClick={() => startEdit(event)}
                        style={eventCard}
                      >
                        <div>
                          <div style={timeStyle}>{event.time}</div>
                          <div style={titleStyle}>{event.title}</div>
                          {event.place && <div style={placeStyle}>📍 {event.place}</div>}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button onClick={(e) => { e.stopPropagation(); quickRoad(event); }}>🚗</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}>🗑</button>
                        </div>
                      </div>

                      {event.road && <div style={roadStyle}>→ {event.road}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editingEvent && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: 28,
            borderRadius: 20,
            width: "90%",
            maxWidth: 420,
          }}>
            <h3 style={{ marginBottom: 20 }}>Редактировать выступление</h3>

            <input value={editForm.title} placeholder="Название" onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 10, border: "1px solid #ddd" }} />
            <input value={editForm.time} placeholder="Время" onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 10, border: "1px solid #ddd" }} />
            <input value={editForm.place} placeholder="Место" onChange={(e) => setEditForm({ ...editForm, place: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 10, border: "1px solid #ddd" }} />
            <input value={editForm.road} placeholder="Время в пути" onChange={(e) => setEditForm({ ...editForm, road: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 20, borderRadius: 10, border: "1px solid #ddd" }} />

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveEdit} style={{ flex: 1, padding: 14, background: "#4f46e5", color: "white", border: "none", borderRadius: 12, fontWeight: 600 }}>Сохранить</button>
              <button onClick={() => setEditingEvent(null)} style={{ flex: 1, padding: 14, background: "#e2e8f0", border: "none", borderRadius: 12 }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
