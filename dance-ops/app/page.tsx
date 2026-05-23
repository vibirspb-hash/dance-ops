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

  // ===== ADMIN STATES =====
  const [newDay, setNewDay] = useState({
    date: "",
    first_team_name: "",
    second_team_name: "",
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "",
    place: "",
    road: "",
    team: "first",
    day_id: 1,
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

  // ===== DAYS =====
  async function addDay() {
    await supabase.from("days").insert([
      {
        date: newDay.date,
        first_team_name: newDay.first_team_name,
        second_team_name: newDay.second_team_name,
      },
    ]);

    setNewDay({
      date: "",
      first_team_name: "",
      second_team_name: "",
    });

    await loadData();
  }

  async function updateDay(dayId: number, data: any) {
    await supabase.from("days").update(data).eq("id", dayId);
    await loadData();
  }

  // ===== EVENTS =====
  async function addEvent() {
    await supabase.from("events").insert([
      {
        title: newEvent.title,
        time: newEvent.time,
        place: newEvent.place,
        road: newEvent.road,
        team: newEvent.team,
        day_id: newEvent.day_id,
      },
    ]);

    setNewEvent({
      title: "",
      time: "",
      place: "",
      road: "",
      team: "first",
      day_id: 1,
    });

    await loadData();
  }

  async function deleteEvent(eventId: number) {
    await supabase.from("events").delete().eq("id", eventId);
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
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
          {team === "first" ? day.firstTeamName : day.secondTeamName}
        </div>

        {items.map((event) => (
          <div
            key={event.id}
            draggable
            onDragStart={() => setDragged({ event, dayId: day.id })}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <button onClick={() => deleteEvent(event.id)}>🗑</button>
            <div>{event.time}</div>
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

      {/* ===== ADMIN PANEL ===== */}
      <div style={{ border: "2px solid black", padding: 20, marginBottom: 30 }}>
        <h2>🎛 Admin Panel</h2>

        <h3>📅 Add Day</h3>
        <input
          placeholder="date"
          value={newDay.date}
          onChange={(e) =>
            setNewDay({ ...newDay, date: e.target.value })
          }
        />
        <input
          placeholder="first team"
          value={newDay.first_team_name}
          onChange={(e) =>
            setNewDay({ ...newDay, first_team_name: e.target.value })
          }
        />
        <input
          placeholder="second team"
          value={newDay.second_team_name}
          onChange={(e) =>
            setNewDay({ ...newDay, second_team_name: e.target.value })
          }
        />
        <button onClick={addDay}>Add Day</button>

        <h3>🎭 Add Event</h3>
        <input
          placeholder="title"
          value={newEvent.title}
          onChange={(e) =>
            setNewEvent({ ...newEvent, title: e.target.value })
          }
        />
        <input
          placeholder="time"
          value={newEvent.time}
          onChange={(e) =>
            setNewEvent({ ...newEvent, time: e.target.value })
          }
        />
        <input
          placeholder="day_id"
          type="number"
          value={newEvent.day_id}
          onChange={(e) =>
            setNewEvent({
              ...newEvent,
              day_id: Number(e.target.value),
            })
          }
        />
        <select
          value={newEvent.team}
          onChange={(e) =>
            setNewEvent({ ...newEvent, team: e.target.value })
          }
        >
          <option value="first">first</option>
          <option value="second">second</option>
        </select>

        <button onClick={addEvent}>Add Event</button>
      </div>

      {/* ===== DAYS ===== */}
      {days.map((day) => (
        <div key={day.id} style={{ marginBottom: 40 }}>
          <h2>{day.date}</h2>

          <div style={{ display: "flex", gap: 20 }}>
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}
    </div>
  );
}
