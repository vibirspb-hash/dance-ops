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
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 🔐 AUTH
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");

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

    const saved = localStorage.getItem("dance_auth");
    if (saved === "true") {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!isClient || !isAuthed) return;
    loadData();
  }, [isClient, isAuthed]);

  function handleLogin() {
    if (password === "1733") {
      setIsAuthed(true);
      localStorage.setItem("dance_auth", "true");
      setPassword("");
    } else {
      alert("Неверный пароль");
    }
  }

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

  async function addDay() {
    const value = prompt("Введите дату:");
    if (!value) return;

    const { data } = await supabase
      .from("days")
      .insert([{ 
        date: value, 
        first_team_name: "Я Воробушки", 
        second_team_name: "Лев и новенькие" 
      }])
      .select()
      .single();

    await loadData();
    if (data?.id) setSelectedDayId(data.id);
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

  // ==================== AUTH PAGE ====================
  if (!isClient) return <div style={{ padding: 40, textAlign: "center" }}>Загрузка...</div>;

  if (!isAuthed) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e2937 100%)",
        fontFamily: "system-ui, Arial, sans-serif",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 380,
          padding: 40,
          background: "#1e2937",
          borderRadius: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          border: "1px solid #334155",
        }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎭</div>
            <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>Dance Ops</h1>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            style={{
              width: "100%",
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              border: "none",
              background: "#334155",
              color: "white",
              marginBottom: 16,
              textAlign: "center",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: 16,
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  // ==================== Остальной код без изменений ====================
  function renderEvent(event: EventType, dayId: number) { ... } // (оставил как у тебя)

  function renderColumn(day: DayType, team: "first" | "second") { ... } // (оставил как у тебя)

  function renderStartPage() {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, Arial, sans-serif", padding: "32px 16px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1e2937", textAlign: "center", marginBottom: 40 }}>🎭 Dance Ops</h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 20 }}>
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                style={{
                  minHeight: 140,
                  padding: 24,
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  background: "#ffffff",
                  color: "#1e2937",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  fontSize: 26,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {day.date}
              </button>
            ))}

            <button
              onClick={addDay}
              style={{
                minHeight: 140,
                padding: 24,
                border: "2px dashed #94a3b8",
                borderRadius: 20,
                background: "#ffffff",
                color: "#64748b",
                fontSize: 48,
                fontWeight: 300,
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedDay = days.find((day) => day.id === selectedDayId);

  if (!selectedDay) return renderStartPage();

  // ... (остальная часть с выбранным днём остаётся как у тебя)
  return (
    <div style={{ padding: "20px 12px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, Arial, sans-serif" }}>
      {/* ... твой код с выбранным днём ... */}
    </div>
  );
}
