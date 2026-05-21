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
    if (saved) {
      try {
        setDays(JSON.parse(saved));
      } catch {
        setInitialData();
      }
    } else {
      setInitialData();
    }
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

        if (editing.type === "date") {
          return { ...day, date: editValue.trim() || day.date };
        }

        if (editing.type === "team1") {
          return { ...day, firstTeamName: editValue.trim() || day.firstTeamName };
        }

        if (editing.type === "team2") {
          return { ...day, secondTeamName: editValue.trim() || day.secondTeamName };
        }

        return {
          ...day,
          boards: {
            ...day.boards,
            first: day.boards.first.map((e) =>
              e.id === editing.eventId ? { ...e, [editing.type]: editValue.trim() || undefined } : e
            ),
            second: day.boards.second.map((e) =>
              e.id === editing.eventId ? { ...e, [editing.type]: editValue.trim() || undefined } : e
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

    const place = prompt("Место") || undefined;

    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              boards: {
                ...day.boards,
                [team]: [
                  ...day.boards[team],
                  { id: Date.now(), title, time, place },
                ],
              },
            }
          : day
      )
    );
  }

  function deleteEvent(dayId: number, team: "first" | "second", eventId: number) {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              boards: {
                ...day.boards,
                [team]: day.boards[team].filter((e) => e.id !== eventId),
              },
            }
          : day
      )
    );
  }

  function onDrop(dayId: number, team: "first" | "second") {
    if (!dragged) return;

    setDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;

        const first = day.boards.first.filter((e) => e.id !== dragged.event.id);
        const second = day.boards.second.filter((e) => e.id !== dragged.event.id);

        return {
          ...day,
          boards: {
            first: team === "first" ? [...first, dragged.event] : first,
            second: team === "second" ? [...second, dragged.event] : second,
          },
        };
      })
    );

    setDragged(null);
  }

  function renderColumn(day: DayType, team: "first" | "second") {
    const items = day.boards[team];
    const teamName = team === "first" ? day.firstTeamName : day.secondTeamName;
    const teamType = team === "first" ? "team1" : "team2";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(day.id, team)}
        style={{
          flex: 1,
          minHeight: 700,
          background: "#ffffff",
          borderRadius: 24,
          padding: 28,
          border: "1px solid #e5e5e5",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          color: "#000",
          WebkitFontSmoothing: "auto",
          textRendering: "geometricPrecision",
        }}
      >
        <div
          onClick={() => startEditing(day.id, teamType, teamName)}
          style={{
            display: "inline-block",
            background: "#1e2937",
            color: "#fff",
            borderRadius: 16,
            padding: "14px 28px",
            fontWeight: 700,
            fontSize: 23,
            marginBottom: 36,
            cursor: "pointer",
          }}
        >
          {editing?.dayId === day.id && editing.type === teamType ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              autoFocus
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: 23,
                fontWeight: 700,
              }}
            />
          ) : (
            teamName
          )}
        </div>

        <button
          onClick={() => addEvent(day.id, team)}
          style={{
            float: "right",
            border: "none",
            background: "#4f46e5",
            color: "white",
            borderRadius: 12,
            padding: "12px 20px",
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          +
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 36, clear: "both" }}>
          {items.map((event, index) => (
            <div key={event.id}>
              <div
                draggable
                onDragStart={() => setDragged({ event, dayId: day.id })}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 28,
                  cursor: "grab",
                  border: "2px solid #e0e7ff",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
                  color: "#000",
                }}
              >
                <button
                  onClick={() => deleteEvent(day.id, team, event.id)}
                  style={{
                    position: "absolute",
                    top: 18,
                    right: 18,
                    border: "none",
                    background: "#fee2e2",
                    color: "#ef4444",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  🗑
                </button>

                <div style={{ fontSize: 34, fontWeight: 800, color: "#000", marginBottom: 12 }}>
                  {event.time}
                </div>

                <div style={{ fontSize: 17.5, fontWeight: 700, color: "#000", marginBottom: 14 }}>
                  {event.place || "+ место"}
                </div>

                <div style={{ fontSize: 21.5, fontWeight: 700, color: "#000" }}>
                  {event.title}
                </div>
              </div>

              {index !== items.length - 1 && (
                <div style={{ marginTop: 20, textAlign: "center", color: "#000" }}>
                  {event.road ? event.road : "+ время в пути"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px 16px",
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "system-ui",
        color: "#000",
        WebkitFontSmoothing: "auto",
        textRendering: "geometricPrecision",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#000" }}>
        🎭 Dance Ops
      </h1>

      <button onClick={() => {}} style={{ marginBottom: 20 }}>
        + Добавить дату
      </button>

      {days.map((day) => (
        <div key={day.id}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: "#000" }}>
            {day.date}
          </h2>

          <div style={{ display: "flex", gap: 28 }}>
            {renderColumn(day, "first")}
            {renderColumn(day, "second")}
          </div>
        </div>
      ))}
    </div>
  );
}
