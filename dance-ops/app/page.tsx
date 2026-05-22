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

  useEffect(() => {
    setIsClient(true);

    const check = () => setIsMobile(window.innerWidth < 900);
    check();

    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    loadData();
  }, [isClient]);

  async function loadData() {
    const { data: daysData, error: daysError } = await supabase
      .from("days")
      .select("*")
      .order("id");

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("id");

    if (daysError || eventsError) {
      console.error(daysError || eventsError);
      return;
    }

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
      .update({
        day_id: dayId,
        team,
      })
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
          minHeight: 600,
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          border: "1px solid #e5e5e5",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>
          {team === "first" ? day.firstTeamName : day.secondTeamName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((event) => (
            <div
              key={event.id}
              draggable
              onDragStart={() =>
                setDragged({ event, dayId: day.id })
              }
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 16,
                border: "1px solid #ddd",
              }}
            >
              <button onClick={() => deleteEvent(event.id)}>🗑</button>

              <div style={{ fontSize: 22, fontWeight: 700 }}>
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

  if (!isClient) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>🎭 Dance Ops</h1>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 20,
        }}
      >
        {days.map((day) => (
          <div key={day.id} style={{ width: "100%" }}>
            <h2>{day.date}</h2>

            <div style={{ display: "flex", gap: 20 }}>
              {renderColumn(day, "first")}
              {renderColumn(day, "second")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
