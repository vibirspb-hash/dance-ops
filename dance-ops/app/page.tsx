"use client";

import { useState, useEffect } from "react";

type EventType = {
  id: number;
  title: string;
  time: string;
  place?: string;
  road?: string;
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

const textBase: React.CSSProperties = {
  color: "#000",
  fontFamily: "system-ui, -apple-system, Helvetica, Arial",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  textRendering: "optimizeLegibility",
};

export default function Page() {
  const [days, setDays] = useState<DayType[]>([]);
  const [dragged, setDragged] = useState<{ event: EventType; dayId: number } | null>(null);

  const [editing, setEditing] = useState<{
    dayId: number;
    type: "date" | "team1" | "team2" | "time" | "title" | "place" | "road";
    eventId?: number;
  } | null>(null);

  const [editValue, setEditValue] = useState("");

  const STORAGE_KEY = "danceOpsData";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setDays(JSON.parse(saved));
    else setInitialData();
  }, []);

  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    }
  }, [days]);

  function setInitialData() {
    setDays([
      {
        id: 1,
        date: "21 ИЮНЯ",
        firstTeamName: "Я Воробушки",
        secondTeamName: "Лев и новенькие",
        boards: {
          first: [
            {
              id: 1,
              title: "Название выступления",
              time: "17:30",
              place: "Место проведения",
              road: "Время в пути",
            },
          ],
          second: [
            {
              id: 2,
              title: "Название выступления",
              time: "18:00",
              place: "Место проведения",
            },
          ],
        },
      },
    ]);
  }

  function startEditing(dayId: number, type: any, currentValue: string, eventId?: number) {
    setEditing({ dayId, type, eventId });
    setEditValue(currentValue);
  }

  function saveEdit() {
    if (!editing) return;

    setDays((prev) =>
      prev.map((day) => {
        if (day.id !== editing.dayId) return day;

        if (editing.type === "date") return { ...day, date: editValue || day.date };
        if (editing.type === "team1") return { ...day, firstTeamName: editValue || day.firstTeamName };
        if (editing.type === "team2") return { ...day, secondTeamName: editValue || day.secondTeamName };

        return {
          ...day,
          boards: {
            ...day.boards,
            first: day.boards.first.map((e) =>
              e.id === editing.eventId
                ? { ...e, [editing.type]: editValue || "" }
                : e
            ),
            second: day.boards.second.map((e) =>
              e.id === editing.eventId
                ? { ...e, [editing.type]: editValue || "" }
                : e
            ),
          },
        };
      })
    );

    setEditing(null);
    setEditValue("");
  }

  function addEvent(dayId: number, team: "first" | "second") {
    const title = prompt("Название события");
    if (!title) return;

    const time = prompt("Время");
    if (!time) return;

    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              boards: {
                ...day.boards,
                [team]: [
                  ...day.boards[team],
                  { id: Date.now(), title, time },
                ],
              },
            }
          : day
      )
    );
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];
    const teamName = team === "first" ? day.firstTeamName : day.secondTeamName;

    return (
      <div
        style={{
          flex: 1,
          minHeight: 700,
          background: "#fff",
          borderRadius: 24,
          padding: 28,
          border: "1px solid #e5e5e5",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",

          // 🔥 GLOBAL FIX (важно)
          ...textBase,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#111827",
            color: "#fff",
            padding: "14px 28px",
            borderRadius: 16,
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 30,
          }}
        >
          {teamName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {items.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 28,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 25px rgba(0,0,0,0.05)",

                // 🔥 critical: unify rendering
                ...textBase,
              }}
            >
              {/* TIME */}
              <div style={{ ...textBase, fontSize: 32, fontWeight: 800 }}>
                {event.time}
              </div>

              {/* PLACE */}
              <div style={{ ...textBase, fontSize: 16, fontWeight: 600, marginTop: 8 }}>
                {event.place}
              </div>

              {/* TITLE */}
              <div style={{ ...textBase, fontSize: 20, fontWeight: 700, marginTop: 10 }}>
                {event.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        background: "#f8fafc",
        minHeight: "100vh",

        // 🔥 GLOBAL FIX ROOT
        ...textBase,
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>🎭 Dance Ops</h1>

      <div style={{ display: "flex", gap: 28 }}>
        {days.map((day) => (
          <div key={day.id} style={{ width: "100%" }}>
            <h2 style={{ fontSize: 30, fontWeight: 800 }}>
              {day.date}
            </h2>

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
