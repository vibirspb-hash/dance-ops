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
        date: "new day",
        first_team_name: "first",
        second_team_name: "second",
      },
    ]);

    await loadData();
  }

  // ===== EVENTS =====
  async function addEvent(dayId: number, team: "first" | "second") {
    await supabase.from("events").insert([
      {
        title: newEvent.title || "new event",
        time: newEvent.time || "00:00",
        place: newEvent.place,
        road: newEvent.road,
        team,
        day_id: dayId,
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

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];

    return (
      <div
        style={{
          flex: 1,
          minHeight: 500,
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          border: "1px solid #e5e5e5",
        }}
      >
        {/* HEADER COLUMN */}
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

          <button
            onClick={() => addEvent(day.id, team)}
            style={{ fontSize: 18 }}
          >
            ➕
          </button>
        </div>

        {/* EVENTS */}
        {items.map((event) => (
          <div
            key={event.id}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <button onClick={() => deleteEvent(event.id)}>🗑</button>
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

      {/* DAYS LIST */}
      {days.map((day) => (
        <div key={day.id} style={{ marginBottom: 40 }}>
          {/* DAY HEADER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0 }}>{day.date}</h2>

            <button onClick={addDay} style={{ fontSize: 18 }}>
              ➕
            </button>
          </div>

          {/* COLUMNS */}
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}
    </div>
  );
}
