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
  // ================= AUTH =================
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const PASSWORD = "1733";

  useEffect(() => {
    const saved = localStorage.getItem("dance_auth");
    if (saved === "ok") setIsAuthorized(true);
  }, []);

  function checkPassword() {
    if (passwordInput === PASSWORD) {
      localStorage.setItem("dance_auth", "ok");
      setIsAuthorized(true);
    } else {
      alert("Неверный пароль");
    }
  }

  // ================= APP STATE =================
  const [days, setDays] = useState<DayType[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
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
    if (!isClient || !isAuthorized) return;
    loadData();
  }, [isClient, isAuthorized]);

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

  // ================= AUTH SCREEN =================
  if (!isAuthorized) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        fontFamily: "system-ui"
      }}>
        <div style={{
          background: "white",
          padding: 30,
          borderRadius: 16,
          width: 320,
          textAlign: "center"
        }}>
          <h2 style={{ marginBottom: 20 }}>🎭 Dance Ops</h2>

          <input
            type="password"
            placeholder="Введите пароль"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 12
            }}
          />

          <button
            onClick={checkPassword}
            style={{
              width: "100%",
              padding: 12,
              background: "#1e293b",
              color: "white",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  // ================= EXISTING UI (ТВОЙ КОД БЕЗ ИЗМЕНЕНИЙ) =================

  function renderStartPage() {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, Arial, sans-serif", padding: "32px 16px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e2937", textAlign: "center", marginBottom: 34 }}>
            🎭 Dance Ops
          </h1>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 16,
          }}>
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                style={{
                  minHeight: 130,
                  padding: 18,
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  background: "#ffffff",
                  color: "#1e2937",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  fontSize: 24,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {day.date}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedDay = days.find((day) => day.id === selectedDayId);

  if (!selectedDay) return renderStartPage();

  return (
    <div style={{ padding: "20px 12px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        <h1 style={{ fontSize: 32, fontWeight: 800 }}>🎭 Dance Ops</h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 24,
        }}>
          {/* дальше твой UI остаётся как есть */}
          {renderStartPage()}
        </div>

      </div>
    </div>
  );
}
