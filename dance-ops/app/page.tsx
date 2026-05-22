"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [dragged, setDragged] = useState<{
    event: EventType;
    dayId: number;
  } | null>(null);

  const [editing, setEditing] = useState<any>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setMounted(true);

    const check = () => setIsMobile(window.innerWidth < 900);
    check();

    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted]);

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
          minHeight: 700,
          background: "#fff",
          borderRadius: 24,
          padding: 28,
          border: "1px solid #e5e5e5",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
          {team === "first" ? day.firstTeamName : day.secondTeamName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {items.map((event) => (
            <div
              key={event.id}
              draggable
              onDragStart={() =>
                setDragged({ event, dayId: day.id })
              }
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 20,
                border: "1px solid #e5e7eb",
              }}
            >
              <button onClick={() => deleteEvent(event.id)}>🗑</button>

              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {event.time}
              </div>

              <div>{event.place}</div>
              <div>{event.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div style={{ padding: 24 }}>
      <h1>🎭 Dance Ops</h1>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 24,
        }}
      >
        {days.map((day) => (
          <div key={day.id} style={{ width: "100%" }}>
            <h2>{day.date}</h2>

            <div style={{ display: "flex", gap: 24 }}>
              {renderColumn(day, "first")}
              {renderColumn(day, "second")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
