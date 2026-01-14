/* Crowns Enchanted Beauty Planner (standalone browser script)
 * - Uses window.dataSdk + window.elementSdk (shims included in /public/_sdk)
 * - Stores records in localStorage via dataSdk
 */

const defaultConfig = {
  background_color: "#faf8ff",
  card_color: "#ffffff",
  primary_color: "#8b5cf6",
  text_color: "#1f1636",
  accent_color: "#c084fc",
  font_family: "Lora",
  font_size: 16,
  planner_title: "Crowns Enchanted Beauty Planner",
  business_name: "Your Sanctuary",
  welcome_message: "Track your holistic beauty journey with intention",
};

let allData = [];
let clients = [];
let events = [];
let assessments = [];
let plannerNotes = [];
let holisticTracking = [];

let currentView = "dashboard";
let selectedDate = new Date();
let calendarView = "month";
let autoSaveTimeout = null;

const dataHandler = {
  onDataChanged(data) {
    allData = data;
    clients = data.filter((d) => d.type === "client");
    events = data.filter((d) => d.type === "event");
    assessments = data.filter((d) => d.type === "assessment");
    plannerNotes = data.filter((d) => d.type === "planner_note");
    holisticTracking = data.filter((d) => d.type === "holistic_tracking");
    renderApp();
  },
};

async function onConfigChange() {
  renderApp();
}

function qs(id) {
  return document.getElementById(id);
}

function yyyyMmDd(d) {
  return d.toISOString().split("T")[0];
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.backgroundColor = type === "success" ? "#10b981" : "#ef4444";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showModal(title, message, onConfirm) {
  const config = window.elementSdk?.config || defaultConfig;
  const baseSize = config.font_size || defaultConfig.font_size;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const cardColor = config.card_color || defaultConfig.card_color;

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content" style="background-color: ${cardColor};">
      <div class="p-6">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">${title}</h3>
        <p class="mb-6" style="color: ${textColor}; font-size: ${baseSize}px;">${message}</p>
        <div class="flex gap-3">
          <button id="cancelBtn" class="flex-1 px-4 py-3 rounded-lg font-bold" style="background-color: #e5e7eb; color: ${textColor}; font-size: ${baseSize * 0.9}px;">Cancel</button>
          <button id="confirmBtn" class="flex-1 px-4 py-3 rounded-lg font-bold" style="background-color: ${primaryColor}; color: white; font-size: ${baseSize * 0.9}px;">Confirm</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#cancelBtn").addEventListener("click", () => modal.remove());
  modal.querySelector("#confirmBtn").addEventListener("click", () => {
    modal.remove();
    onConfirm();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function getPlannerNote(ref, field, defaultValue = "") {
  const note = plannerNotes.find((n) => n.date_reference === ref);
  return note ? note[field] || defaultValue : defaultValue;
}

async function autoSavePlannerNote(ref, field, value) {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(async () => {
    const existing = plannerNotes.find((n) => n.date_reference === ref);
    if (existing) {
      const updated = { ...existing, [field]: value };
      const result = await window.dataSdk.update(updated);
      if (!result.isOk) console.error("Auto-save failed", result.error);
    } else {
      if (allData.length >= 999) {
        showToast("Maximum limit reached.", "error");
        return;
      }
      const created = {
        type: "planner_note",
        date_reference: ref,
        [field]: value,
        created_at: new Date().toISOString(),
      };
      const result = await window.dataSdk.create(created);
      if (!result.isOk) console.error("Auto-save failed", result.error);
    }
  }, 650);
}

async function initializeApp() {
  const initResult = await window.dataSdk.init(dataHandler);
  if (!initResult.isOk) {
    console.error("Failed to initialize data SDK");
    return;
  }

  if (window.elementSdk) {
    await window.elementSdk.init({
      defaultConfig,
      onConfigChange,
    });
  }

  renderApp();
}

function renderApp() {
  const config = window.elementSdk?.config || defaultConfig;
  const app = qs("app");
  if (!app) return;

  const baseSize = config.font_size || defaultConfig.font_size;
  const customFont = config.font_family || defaultConfig.font_family;
  const bgColor = config.background_color || defaultConfig.background_color;
  const textColor = config.text_color || defaultConfig.text_color;

  document.body.style.backgroundColor = bgColor;
  document.body.style.color = textColor;
  document.body.style.fontFamily = `${customFont}, Lora, serif`;
  document.body.style.fontSize = `${baseSize}px`;

  if (currentView === "dashboard") renderDashboard(app, config);
  else if (currentView === "calendar") renderCalendar(app, config);
  else if (currentView === "assessment") renderAssessment(app, config);
  else if (currentView === "client_intake") renderClientIntake(app, config);
  else if (currentView === "holistic_tracking") renderHolisticTracking(app, config);
}

function renderDashboard(container, config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;
  const plannerTitle = config.planner_title || defaultConfig.planner_title;
  const businessName = config.business_name || defaultConfig.business_name;
  const welcomeMsg = config.welcome_message || defaultConfig.welcome_message;

  container.innerHTML = `
    <div class="w-full min-h-full p-6" style="background-color: ${bgColor};">
      <div class="max-w-7xl mx-auto">
        <div class="card-shadow rounded-2xl p-8 mb-6" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%);">
          <div class="text-center">
            <div class="text-6xl mb-3">👑</div>
            <h1 class="heading-font font-bold mb-2 text-white" style="font-size: ${baseSize * 2.5}px;">${plannerTitle}</h1>
            <p class="mb-1 text-white opacity-90" style="font-size: ${baseSize * 0.9}px;">${businessName}</p>
            <p class="text-white opacity-95" style="font-size: ${baseSize}px;">${welcomeMsg}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card-shadow rounded-xl p-6 text-center" style="background-color: ${cardColor};">
            <div class="text-3xl mb-2">💜</div>
            <p class="font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.5}px;">${clients.length}</p>
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;">Clients</p>
          </div>
          <div class="card-shadow rounded-xl p-6 text-center" style="background-color: ${cardColor};">
            <div class="text-3xl mb-2">📅</div>
            <p class="font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.5}px;">${events.length}</p>
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;">Events</p>
          </div>
          <div class="card-shadow rounded-xl p-6 text-center" style="background-color: ${cardColor};">
            <div class="text-3xl mb-2">🔮</div>
            <p class="font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.5}px;">${assessments.length}</p>
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;">Assessments</p>
          </div>
          <button id="holisticBtn" class="card-shadow rounded-xl p-6 text-center hover:opacity-80 transition-all" style="background-color: ${cardColor};">
            <div class="text-3xl mb-2">🌿</div>
            <p class="font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.2}px;">Holistic</p>
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;">Health Tracking</p>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button id="calendarBtn" class="card-shadow rounded-2xl p-8 text-left hover:opacity-80 transition-all" style="background-color: ${cardColor};">
            <div class="text-5xl mb-4">📅</div>
            <h3 class="heading-font font-bold mb-2" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Calendar & Planner</h3>
            <p style="color: ${textColor}; opacity: 0.7; font-size: ${baseSize * 0.9}px;">Daily schedules, weekly and monthly planning</p>
          </button>
          <button id="assessmentBtn" class="card-shadow rounded-2xl p-8 text-left hover:opacity-80 transition-all" style="background-color: ${cardColor};">
            <div class="text-5xl mb-4">🔮</div>
            <h3 class="heading-font font-bold mb-2" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Beauty Assessment</h3>
            <p style="color: ${textColor}; opacity: 0.7; font-size: ${baseSize * 0.9}px;">Track holistic beauty & wellness journey</p>
          </button>
          <button id="clientIntakeBtn" class="card-shadow rounded-2xl p-8 text-left hover:opacity-80 transition-all" style="background-color: ${cardColor};">
            <div class="text-5xl mb-4">📋</div>
            <h3 class="heading-font font-bold mb-2" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Client Intake Form</h3>
            <p style="color: ${textColor}; opacity: 0.7; font-size: ${baseSize * 0.9}px;">Collect new client information</p>
          </button>
        </div>
      </div>
    </div>
  `;

  qs("calendarBtn").addEventListener("click", () => {
    currentView = "calendar";
    renderApp();
  });
  qs("assessmentBtn").addEventListener("click", () => {
    currentView = "assessment";
    renderApp();
  });
  qs("clientIntakeBtn").addEventListener("click", () => {
    currentView = "client_intake";
    renderApp();
  });
  qs("holisticBtn").addEventListener("click", () => {
    currentView = "holistic_tracking";
    renderApp();
  });
}

function renderCalendar(container, config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;

  let calendarHTML = "";
  if (calendarView === "month") calendarHTML = renderMonthView(config);
  else if (calendarView === "week") calendarHTML = renderWeekView(config);
  else if (calendarView === "day") calendarHTML = renderDayView(config);
  else if (calendarView === "weekplanner") calendarHTML = renderWeekPlannerView(config);
  else if (calendarView === "monthplanner") calendarHTML = renderMonthPlannerView(config);

  container.innerHTML = `
    <div class="w-full min-h-full p-6" style="background-color: ${bgColor};">
      <div class="max-w-7xl mx-auto">
        <div class="card-shadow rounded-2xl p-6 mb-6" style="background-color: ${cardColor};">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-4">
              <button id="backBtn" class="px-4 py-2 rounded-lg hover:opacity-70" style="background-color: ${bgColor}; color: ${textColor}; font-size: ${baseSize * 0.9}px;">← Dashboard</button>
              <h2 class="heading-font font-bold" style="color: ${textColor}; font-size: ${baseSize * 2}px;">📅 Calendar</h2>
            </div>
            <div class="flex items-center gap-2">
              <button id="prevBtn" class="px-4 py-2 rounded-lg hover:opacity-70" style="background-color: ${primaryColor}; color: white; font-size: ${baseSize * 0.9}px;">←</button>
              <button id="todayBtn" class="px-4 py-2 rounded-lg hover:opacity-70" style="background-color: ${bgColor}; color: ${textColor}; font-size: ${baseSize * 0.9}px;">Today</button>
              <button id="nextBtn" class="px-4 py-2 rounded-lg hover:opacity-70" style="background-color: ${primaryColor}; color: white; font-size: ${baseSize * 0.9}px;">→</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-6">
            ${viewBtn("day", "Daily View", config)}
            ${viewBtn("week", "Week View", config)}
            ${viewBtn("weekplanner", "Week Planner", config)}
            ${viewBtn("month", "Month View", config)}
            ${viewBtn("monthplanner", "Month Planner", config)}
          </div>

          ${calendarHTML}
        </div>
      </div>
    </div>
  `;

  qs("backBtn").addEventListener("click", () => {
    currentView = "dashboard";
    renderApp();
  });
  qs("prevBtn").addEventListener("click", () => {
    if (calendarView === "month" || calendarView === "monthplanner") selectedDate.setMonth(selectedDate.getMonth() - 1);
    else if (calendarView === "week" || calendarView === "weekplanner") selectedDate.setDate(selectedDate.getDate() - 7);
    else selectedDate.setDate(selectedDate.getDate() - 1);
    renderApp();
  });
  qs("nextBtn").addEventListener("click", () => {
    if (calendarView === "month" || calendarView === "monthplanner") selectedDate.setMonth(selectedDate.getMonth() + 1);
    else if (calendarView === "week" || calendarView === "weekplanner") selectedDate.setDate(selectedDate.getDate() + 7);
    else selectedDate.setDate(selectedDate.getDate() + 1);
    renderApp();
  });
  qs("todayBtn").addEventListener("click", () => {
    selectedDate = new Date();
    renderApp();
  });

  // Setup editables after DOM paint
  setTimeout(() => {
    if (calendarView === "day") setupDayEditables();
    if (calendarView === "weekplanner") setupWeekEditables();
    if (calendarView === "monthplanner") setupMonthEditables();
  }, 50);
}

function viewBtn(view, label, config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const active = calendarView === view;
  return `<button data-view="${view}" class="px-4 py-2 rounded-lg transition-all calendarViewBtn" style="background-color: ${active ? primaryColor : bgColor}; color: ${
    active ? "white" : textColor
  }; font-size: ${baseSize * 0.9}px;">${label}</button>`;
}

document.addEventListener("click", (e) => {
  const btn = e.target && e.target.closest ? e.target.closest(".calendarViewBtn") : null;
  if (!btn) return;
  const view = btn.getAttribute("data-view");
  if (!view) return;
  calendarView = view;
  renderApp();
});

function setupDayEditables() {
  const dateStr = yyyyMmDd(selectedDate);
  for (let i = 1; i <= 3; i++) {
    const el = qs(`priority${i}`);
    if (!el) continue;
    el.value = getPlannerNote(dateStr, `daily_priority_${i}`);
    el.addEventListener("input", (ev) => autoSavePlannerNote(dateStr, `daily_priority_${i}`, ev.target.value));
  }

  const scheduleHours = [
    "6am",
    "7am",
    "8am",
    "9am",
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
    "5pm",
    "6pm",
    "7pm",
    "8pm",
    "9pm",
  ];
  scheduleHours.forEach((hour) => {
    const el = qs(`schedule_${hour}`);
    if (!el) return;
    el.value = getPlannerNote(dateStr, `schedule_${hour}`);
    el.addEventListener("input", (ev) => autoSavePlannerNote(dateStr, `schedule_${hour}`, ev.target.value));
  });

  const notes = qs("dailyNotes");
  if (notes) {
    notes.value = getPlannerNote(dateStr, "daily_notes");
    notes.addEventListener("input", (ev) => autoSavePlannerNote(dateStr, "daily_notes", ev.target.value));
  }
}

function setupWeekEditables() {
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  const weekRef = `week-${yyyyMmDd(startOfWeek)}`;

  const fields = [
    ["weeklyIntention", "weekly_intention"],
    ["weeklyGoal1", "weekly_goal_1"],
    ["weeklyGoal2", "weekly_goal_2"],
    ["weeklyGoal3", "weekly_goal_3"],
    ["weeklyIncome", "weekly_income"],
    ["weeklyRevenue", "weekly_revenue"],
    ["weeklyBeauty", "weekly_beauty"],
    ["weeklyNotes", "weekly_notes"],
  ];

  fields.forEach(([id, field]) => {
    const el = qs(id);
    if (!el) return;
    el.value = getPlannerNote(weekRef, field);
    el.addEventListener("input", (ev) => autoSavePlannerNote(weekRef, field, ev.target.value));
  });
}

function setupMonthEditables() {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthRef = `${year}-${String(month + 1).padStart(2, "0")}`;
  const fields = [
    ["monthlyIntention", "monthly_intention"],
    ["monthlyRituals", "monthly_rituals"],
    ["monthlyProjects", "monthly_projects"],
    ["incomeGoal", "income_goal"],
    ["beautySales", "beauty_sales"],
    ["digitalSales", "digital_sales"],
    ["ugcEarnings", "ugc_earnings"],
    ["savings", "savings"],
    ["mustHappen", "monthly_must_happen"],
    ["deadlines", "monthly_deadlines"],
    ["preparation", "monthly_preparation"],
    ["ugcThemes", "monthly_ugc_themes"],
    ["brandsPitching", "monthly_brands_pitching"],
    ["ugcDeadlines", "monthly_ugc_deadlines"],
    ["contentFilm", "monthly_content_film"],
    ["contentEdit", "monthly_content_edit"],
    ["postingSchedule", "monthly_posting_schedule"],
    ["bestLifeFeeling", "monthly_best_life_feeling"],
  ];

  fields.forEach(([id, field]) => {
    const el = qs(id);
    if (!el) return;
    el.value = getPlannerNote(monthRef, field);
    el.addEventListener("input", (ev) => autoSavePlannerNote(monthRef, field, ev.target.value));
  });
}

function renderMonthView(config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `<h3 class="heading-font font-bold text-center mb-6" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">${monthName}</h3>`;
  html += `<div class="grid grid-cols-7 gap-2 mb-2">`;
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    html += `<div class="text-center font-bold p-2" style="color: ${textColor}; font-size: ${baseSize * 0.85}px;">${day}</div>`;
  });
  html += `</div>`;
  html += `<div class="grid grid-cols-7 gap-2">`;
  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.event_date === dateStr);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    html += `
      <button data-date="${dateStr}" class="p-2 rounded-lg border min-h-24 text-left hover:opacity-80 transition-all monthCell"
        style="border-color: ${isToday ? accentColor : primaryColor}; background-color: ${isToday ? bgColor : "transparent"};">
        <div class="font-bold mb-1" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">${day}</div>
        ${dayEvents
          .slice(0, 2)
          .map(
            (e) => `
          <div class="text-xs p-1 rounded mb-1" style="background-color: ${accentColor}; color: white; font-size: ${baseSize * 0.7}px;">
            ${(e.event_title || "Event").substring(0, 12)}${(e.event_title || "").length > 12 ? "..." : ""}
          </div>`,
          )
          .join("")}
        ${
          dayEvents.length > 2
            ? `<div class="text-xs" style="color: ${textColor}; opacity: 0.6; font-size: ${baseSize * 0.7}px;">+${dayEvents.length - 2}</div>`
            : ""
        }
      </button>
    `;
  }
  html += `</div>`;
  return html;
}

document.addEventListener("click", (e) => {
  const btn = e.target && e.target.closest ? e.target.closest(".monthCell") : null;
  if (!btn) return;
  const dateStr = btn.getAttribute("data-date");
  if (!dateStr) return;
  selectedDate = new Date(`${dateStr}T12:00:00`);
  calendarView = "day";
  renderApp();
});

function renderWeekView(config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  let html = `<h3 class="heading-font font-bold text-center mb-6" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Week of ${startOfWeek.toLocaleDateString()}</h3>`;
  html += `<div class="grid grid-cols-1 md:grid-cols-7 gap-4 mb-2">`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = yyyyMmDd(d);
    const dayEvents = events.filter((e) => e.event_date === dateStr);
    const isToday = new Date().toDateString() === d.toDateString();
    html += `
      <button data-date="${dateStr}" class="p-4 rounded-lg border-2 min-h-32 text-left hover:opacity-80 transition-all weekCell"
        style="border-color: ${isToday ? accentColor : primaryColor}; background-color: ${isToday ? bgColor : "transparent"};">
        <div class="text-center mb-3">
          <div class="font-bold" style="color: ${textColor}; font-size: ${baseSize}px;">${d.toLocaleDateString("en-US", { weekday: "short" })}</div>
          <div class="font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.5}px;">${d.getDate()}</div>
        </div>
        <div class="space-y-2">
          ${
            dayEvents.length === 0
              ? `<p class="text-center" style="color: ${textColor}; opacity: 0.5; font-size: ${baseSize * 0.8}px;">No events</p>`
              : dayEvents
                  .slice(0, 3)
                  .map(
                    (ev) => `
            <div class="p-2 rounded" style="background-color: ${accentColor}; color: white;">
              <p class="font-bold" style="font-size: ${baseSize * 0.85}px;">${ev.event_title || "Event"}</p>
            </div>`,
                  )
                  .join("")
          }
        </div>
      </button>
    `;
  }
  html += `</div>`;
  return html;
}

document.addEventListener("click", (e) => {
  const btn = e.target && e.target.closest ? e.target.closest(".weekCell") : null;
  if (!btn) return;
  const dateStr = btn.getAttribute("data-date");
  if (!dateStr) return;
  selectedDate = new Date(`${dateStr}T12:00:00`);
  calendarView = "day";
  renderApp();
});

function renderDayView(config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const dateStr = yyyyMmDd(selectedDate);
  const dayEvents = events.filter((e) => e.event_date === dateStr);
  const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  const dateDisplay = selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const schedule = [
    ["6:00 AM", "6am"],
    ["7:00 AM", "7am"],
    ["8:00 AM", "8am"],
    ["9:00 AM", "9am"],
    ["10:00 AM", "10am"],
    ["11:00 AM", "11am"],
    ["12:00 PM", "12pm"],
    ["1:00 PM", "1pm"],
    ["2:00 PM", "2pm"],
    ["3:00 PM", "3pm"],
    ["4:00 PM", "4pm"],
    ["5:00 PM", "5pm"],
    ["6:00 PM", "6pm"],
    ["7:00 PM", "7pm"],
    ["8:00 PM", "8pm"],
    ["9:00 PM", "9pm"],
  ];

  return `
    <div class="space-y-6">
      <div class="text-center p-6 rounded-2xl" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
        <h2 class="heading-font font-bold text-white mb-2" style="font-size: ${baseSize * 2.5}px;">${dayName}</h2>
        <p class="text-white" style="font-size: ${baseSize * 1.3}px;">${dateDisplay}</p>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4 flex items-center gap-2" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">⭐ Top 3 Priorities</h3>
        <div class="space-y-3">
          ${[1, 2, 3]
            .map(
              (i) => `
            <div class="flex items-center gap-3 p-3 rounded-lg" style="background-color: ${cardColor};">
              <span class="font-bold" style="color: ${accentColor}; font-size: ${baseSize * 1.5}px;">${i}</span>
              <input type="text" id="priority${i}" class="editable-field flex-1 px-4 py-2 rounded border-2"
                style="border-color: ${primaryColor}; color: ${textColor}; font-size: ${baseSize}px;" placeholder="Priority ${i}">
            </div>`,
            )
            .join("")}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">⏰ Schedule (6 AM - 9 PM)</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            ${schedule
              .map(
                ([label, key]) => `
              <div class="flex items-start gap-2 p-2 rounded" style="background-color: ${cardColor};">
                <div class="font-bold w-24" style="color: ${primaryColor}; font-size: ${baseSize * 0.85}px;">${label}</div>
                <input type="text" id="schedule_${key}" class="editable-field flex-1 px-2 py-1 text-sm rounded border"
                  style="border-color: ${primaryColor}; color: ${textColor}; font-size: ${baseSize * 0.85}px;" placeholder="Add task">
              </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="space-y-6">
          <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
            <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">📅 Appointments</h3>
            ${
              dayEvents.length === 0
                ? `<p class="text-center py-4" style="color: ${textColor}; opacity: 0.6; font-size: ${baseSize * 0.9}px;">No appointments</p>`
                : `<div class="space-y-3">
                    ${dayEvents
                      .map(
                        (ev) => `
                      <div class="p-3 rounded-lg border" style="border-color: ${accentColor}; background-color: ${cardColor};">
                        <p class="font-bold mb-1" style="color: ${textColor}; font-size: ${baseSize}px;">${ev.event_title || "Event"}</p>
                        <p style="color: ${textColor}; opacity: 0.7; font-size: ${baseSize * 0.8}px;">${ev.event_type || "Event"}</p>
                      </div>`,
                      )
                      .join("")}
                  </div>`
            }
            <div class="mt-4 flex gap-2">
              <input id="newEventTitle" class="w-full px-3 py-2 rounded border-2" style="border-color: ${primaryColor};" placeholder="New event title">
              <button id="addEventBtn" class="px-4 py-2 rounded-lg font-bold text-white hover:opacity-90" style="background-color: ${primaryColor};">Add</button>
            </div>
          </div>

          <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
            <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">📝 Daily Notes</h3>
            <textarea id="dailyNotes" rows="5" class="editable-field w-full p-3 rounded-lg border-2 resize-none"
              style="border-color: ${primaryColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize * 0.9}px;" placeholder="Notes for today..."></textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("click", async (e) => {
  const btn = e.target && e.target.id === "addEventBtn" ? e.target : null;
  if (!btn) return;
  const config = window.elementSdk?.config || defaultConfig;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  btn.style.backgroundColor = primaryColor;
  const title = (qs("newEventTitle")?.value || "").trim();
  if (!title) return;
  if (allData.length >= 999) {
    showToast("Maximum limit of 999 records reached.", "error");
    return;
  }
  const dateStr = yyyyMmDd(selectedDate);
  const res = await window.dataSdk.create({
    type: "event",
    event_title: title,
    event_date: dateStr,
    created_at: new Date().toISOString(),
  });
  if (res.isOk) showToast("Event added ✨");
  else showToast("Failed to add event", "error");
});

function renderWeekPlannerView(config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return `
    <div class="space-y-6">
      <div class="text-center p-8 rounded-2xl" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
        <div class="text-5xl mb-3">✨</div>
        <h2 class="heading-font font-bold text-white mb-2" style="font-size: ${baseSize * 2.5}px;">Weekly Planning</h2>
        <p class="text-white" style="font-size: ${baseSize * 1.3}px;">${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}</p>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">🎯 Weekly Intention</h3>
        <textarea id="weeklyIntention" rows="3" class="editable-field w-full p-4 rounded-lg border-2 resize-none"
          style="border-color: ${primaryColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize}px;" placeholder="What's your main focus for this week?"></textarea>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">🌟 Top 3 Goals</h3>
          <div class="space-y-3">
            ${[1, 2, 3]
              .map(
                (i) => `
              <div class="flex items-center gap-3">
                <span class="font-bold text-2xl" style="color: ${accentColor};">${i}</span>
                <input type="text" id="weeklyGoal${i}" class="editable-field flex-1 px-4 py-2 rounded border-2"
                  style="border-color: ${accentColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize * 0.9}px;" placeholder="Goal ${i}">
              </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">💰 Income Focus</h3>
          <div class="space-y-3">
            <div>
              <label for="weeklyIncome" class="block font-semibold mb-1" style="color: ${primaryColor}; font-size: ${baseSize * 0.85}px;">Weekly Income Goal</label>
              <input type="text" id="weeklyIncome" class="editable-field w-full px-3 py-2 rounded border-2"
                style="border-color: ${accentColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;" placeholder="$">
            </div>
            <div>
              <label for="weeklyRevenue" class="block font-semibold mb-1" style="color: ${primaryColor}; font-size: ${baseSize * 0.85}px;">Main Revenue Streams</label>
              <textarea id="weeklyRevenue" rows="3" class="editable-field w-full px-3 py-2 rounded border resize-none"
                style="border-color: ${accentColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.85}px;" placeholder="Beauty services, digital products, UGC..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">💎 Beauty & Wellness Priorities</h3>
        <textarea id="weeklyBeauty" rows="3" class="editable-field w-full p-4 rounded-lg border-2 resize-none"
          style="border-color: ${primaryColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize}px;" placeholder="Hair appointments, wash days, workouts, self-care rituals..."></textarea>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">📝 Additional Notes</h3>
        <textarea id="weeklyNotes" rows="4" class="editable-field w-full p-4 rounded-lg border-2 resize-none"
          style="border-color: ${accentColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize * 0.9}px;" placeholder="Anything else to remember this week..."></textarea>
      </div>
    </div>
  `;
}

function renderMonthPlannerView(config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return `
    <div class="space-y-6">
      <div class="text-center p-8 rounded-2xl" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
        <div class="text-6xl mb-3">🌙</div>
        <h1 class="heading-font font-bold text-white mb-2" style="font-size: ${baseSize * 3}px;">MONTH AHEAD</h1>
        <p class="text-white font-bold mt-2" style="font-size: ${baseSize * 1.5}px;">${monthName}</p>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">✨ Beauty + Wellness Intentions</h3>
        <textarea id="monthlyIntention" rows="4" class="editable-field w-full p-4 rounded-lg border-2 resize-none"
          style="border-color: ${primaryColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize}px;"></textarea>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">💆🏾‍♀️ Major Rituals</h3>
          <textarea id="monthlyRituals" rows="5" class="editable-field w-full p-3 rounded border-2 resize-none"
            style="border-color: ${accentColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;"></textarea>
        </div>
        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">🎯 Major Projects</h3>
          <textarea id="monthlyProjects" rows="5" class="editable-field w-full p-3 rounded border-2 resize-none"
            style="border-color: ${accentColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;"></textarea>
        </div>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">💰 Financial Wellness</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${moneyField("incomeGoal", "Income goal", primaryColor, cardColor, baseSize)}
          ${moneyField("beautySales", "Beauty service sales", primaryColor, cardColor, baseSize)}
          ${moneyField("digitalSales", "Digital product sales", primaryColor, cardColor, baseSize)}
          ${moneyField("ugcEarnings", "UGC earnings", primaryColor, cardColor, baseSize)}
          <div class="md:col-span-2">
            <label for="savings" class="block font-bold mb-2" style="color: ${primaryColor}; font-size: ${baseSize * 0.9}px;">Savings / Debt / Investments</label>
            <input type="text" id="savings" class="editable-field w-full px-3 py-2 rounded border-2"
              style="border-color: ${primaryColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;" placeholder="$">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-3" style="color: ${textColor}; font-size: ${baseSize * 1.2}px;">✅ Must happen</h3>
          <textarea id="mustHappen" rows="5" class="editable-field w-full p-3 rounded border-2 resize-none"
            style="border-color: ${accentColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;"></textarea>
        </div>
        <div class="p-6 rounded-2xl border-2" style="border-color: ${accentColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-3" style="color: ${textColor}; font-size: ${baseSize * 1.2}px;">⏰ Deadlines</h3>
          <textarea id="deadlines" rows="5" class="editable-field w-full p-3 rounded border-2 resize-none"
            style="border-color: ${accentColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;"></textarea>
        </div>
        <div class="p-6 rounded-2xl border-2 lg:col-span-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
          <h3 class="heading-font font-bold mb-3" style="color: ${textColor}; font-size: ${baseSize * 1.2}px;">🌟 Preparation</h3>
          <textarea id="preparation" rows="5" class="editable-field w-full p-3 rounded border-2 resize-none"
            style="border-color: ${primaryColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;"></textarea>
        </div>
      </div>

      <div class="p-6 rounded-2xl border-2" style="border-color: ${primaryColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">🎥 UGC Creator Planning</h3>
        <div class="space-y-4">
          ${textAreaField("ugcThemes", "UGC + Content themes", primaryColor, cardColor, baseSize)}
          ${textAreaField("brandsPitching", "Brands I'm pitching", primaryColor, cardColor, baseSize)}
          ${textAreaField("ugcDeadlines", "Deadlines / campaigns", primaryColor, cardColor, baseSize)}
          ${textAreaField("contentFilm", "Content to film", primaryColor, cardColor, baseSize)}
          ${textAreaField("contentEdit", "Content to edit", primaryColor, cardColor, baseSize)}
          ${textAreaField("postingSchedule", "Posting schedule", primaryColor, cardColor, baseSize)}
        </div>
      </div>

      <div class="p-6 rounded-2xl border-2 text-center" style="border-color: ${accentColor}; background-color: ${bgColor};">
        <h3 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">💫 Best-life feeling</h3>
        <textarea id="bestLifeFeeling" rows="4" class="editable-field w-full p-4 rounded-lg border-2 resize-none mx-auto max-w-3xl"
          style="border-color: ${accentColor}; background-color: ${cardColor}; color: ${textColor}; font-size: ${baseSize}px;"></textarea>
      </div>
    </div>
  `;
}

function moneyField(id, label, primaryColor, cardColor, baseSize) {
  return `
    <div>
      <label for="${id}" class="block font-bold mb-2" style="color: ${primaryColor}; font-size: ${baseSize * 0.9}px;">${label}</label>
      <input type="text" id="${id}" class="editable-field w-full px-3 py-2 rounded border-2"
        style="border-color: ${primaryColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;" placeholder="$">
    </div>
  `;
}

function textAreaField(id, label, primaryColor, cardColor, baseSize) {
  return `
    <div>
      <label for="${id}" class="block font-bold mb-2" style="color: ${primaryColor}; font-size: ${baseSize * 0.95}px;">${label}</label>
      <textarea id="${id}" rows="3" class="editable-field w-full p-3 rounded border-2 resize-none"
        style="border-color: ${primaryColor}; background-color: ${cardColor}; font-size: ${baseSize * 0.9}px;"></textarea>
    </div>
  `;
}

function renderAssessment(container, config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const today = yyyyMmDd(new Date());

  container.innerHTML = `
    <div class="w-full min-h-full p-6" style="background-color: ${bgColor};">
      <div class="max-w-4xl mx-auto">
        <div class="card-shadow rounded-2xl p-8 mb-6" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
          <button id="backBtn" class="mb-4 px-4 py-2 rounded-lg hover:opacity-70" style="background-color: rgba(255,255,255,0.2); color: white; font-size: ${baseSize * 0.9}px;">← Back</button>
          <div class="text-center">
            <div class="text-5xl mb-3">🔮</div>
            <h1 class="heading-font font-bold text-white mb-2" style="font-size: ${baseSize * 2.5}px;">Beauty Assessment</h1>
            <p class="text-white" style="font-size: ${baseSize}px;">Track your holistic beauty & wellness journey</p>
          </div>
        </div>

        <form id="assessmentForm" class="space-y-6">
          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Basic Information</h2>
            <div class="space-y-4">
              <div>
                <label for="clientName" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Name</label>
                <input type="text" id="clientName" required class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
              </div>
              <div>
                <label for="assessmentDate" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Date</label>
                <input type="date" id="assessmentDate" required class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" value="${today}">
              </div>
            </div>
          </div>

          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Hair & Skin</h2>
            <div class="space-y-4">
              <div>
                <label for="hairType" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Hair Type/Texture</label>
                <input type="text" id="hairType" class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" placeholder="e.g., 4C, Low Porosity">
              </div>
              <div>
                <label for="hairConcerns" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Hair Concerns</label>
                <textarea id="hairConcerns" rows="3" class="input-field w-full px-4 py-3 rounded-lg border-2 resize-none" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" placeholder="Breakage, dryness, shedding..."></textarea>
              </div>
              <div>
                <label for="skinType" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Skin Type</label>
                <select id="skinType" class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
                  <option value="">Select...</option>
                  <option value="normal">Normal</option>
                  <option value="dry">Dry</option>
                  <option value="oily">Oily</option>
                  <option value="combination">Combination</option>
                  <option value="sensitive">Sensitive</option>
                </select>
              </div>
              <div>
                <label for="skinConcerns" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Skin Concerns</label>
                <textarea id="skinConcerns" rows="3" class="input-field w-full px-4 py-3 rounded-lg border-2 resize-none" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" placeholder="Acne, hyperpigmentation, fine lines..."></textarea>
              </div>
            </div>
          </div>

          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Wellness</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="sleepQuality" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Sleep (1-10)</label>
                <input type="number" id="sleepQuality" min="1" max="10" class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
              </div>
              <div>
                <label for="stressLevel" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Stress (1-10)</label>
                <input type="number" id="stressLevel" min="1" max="10" class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
              </div>
              <div class="md:col-span-2">
                <label for="beautyGoals" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Goals</label>
                <textarea id="beautyGoals" rows="3" class="input-field w-full px-4 py-3 rounded-lg border-2 resize-none" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" placeholder="What do you want to achieve?"></textarea>
              </div>
              <div class="md:col-span-2">
                <label for="additionalNotes" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Additional Notes</label>
                <textarea id="additionalNotes" rows="3" class="input-field w-full px-4 py-3 rounded-lg border-2 resize-none" style="border-color: ${primaryColor}; font-size: ${baseSize}px;"></textarea>
              </div>
            </div>
          </div>

          <button type="submit" id="submitAssessment" class="w-full py-4 rounded-lg font-bold text-white hover:opacity-90 transition-all" style="background-color: ${primaryColor}; font-size: ${baseSize * 1.1}px;">
            Save Assessment ✨
          </button>
        </form>

        <div id="assessmentsList" class="mt-8 space-y-4"></div>
      </div>
    </div>
  `;

  qs("backBtn").addEventListener("click", () => {
    currentView = "dashboard";
    renderApp();
  });

  qs("assessmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (allData.length >= 999) {
      showToast("Maximum limit of 999 records reached.", "error");
      return;
    }
    const btn = qs("submitAssessment");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const record = {
      type: "assessment",
      client_name: qs("clientName").value,
      assessment_date: qs("assessmentDate").value,
      hair_type: qs("hairType").value,
      hair_concerns: qs("hairConcerns").value,
      skin_type: qs("skinType").value,
      skin_concerns: qs("skinConcerns").value,
      sleep_quality: qs("sleepQuality").value,
      stress_level: qs("stressLevel").value,
      beauty_goals: qs("beautyGoals").value,
      additional_notes: qs("additionalNotes").value,
      created_at: new Date().toISOString(),
    };

    const res = await window.dataSdk.create(record);
    if (res.isOk) {
      showToast("Assessment saved successfully! ✨");
      qs("assessmentForm").reset();
      qs("assessmentDate").value = today;
    } else {
      showToast("Failed to save assessment.", "error");
    }

    btn.disabled = false;
    btn.textContent = "Save Assessment ✨";
  });

  renderAssessmentsList();
}

function renderAssessmentsList() {
  const config = window.elementSdk?.config || defaultConfig;
  const baseSize = config.font_size || defaultConfig.font_size;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const container = qs("assessmentsList");
  if (!container) return;
  if (assessments.length === 0) {
    container.innerHTML = `
      <div class="text-center p-8 rounded-2xl" style="background-color: ${cardColor}; opacity: 0.6;">
        <p style="color: ${textColor}; font-size: ${baseSize}px;">No assessments yet. Create your first one above! 🌟</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.8}px;">Recent Assessments</h2>
    ${assessments
      .slice()
      .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))
      .map(
        (a) => `
        <div class="card-shadow rounded-xl p-6" style="background-color: ${cardColor};">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="heading-font font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.2}px;">${a.client_name}</h3>
              <p style="color: ${textColor}; opacity: 0.7; font-size: ${baseSize * 0.85}px;">${new Date(a.assessment_date).toLocaleDateString()}</p>
            </div>
            <button class="delete-assessment px-3 py-2 rounded hover:opacity-70" data-id="${a.__backendId}" style="background-color: ${accentColor}; color: white; font-size: ${baseSize * 0.8}px;">Delete</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            ${a.hair_type ? `<p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Hair Type:</strong> ${a.hair_type}</p>` : ""}
            ${a.skin_type ? `<p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Skin Type:</strong> ${a.skin_type}</p>` : ""}
            ${a.sleep_quality ? `<p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Sleep:</strong> ${a.sleep_quality}/10</p>` : ""}
            ${a.stress_level ? `<p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Stress:</strong> ${a.stress_level}/10</p>` : ""}
          </div>
        </div>
      `,
      )
      .join("")}
  `;

  container.querySelectorAll(".delete-assessment").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const record = assessments.find((x) => x.__backendId === id);
      if (!record) return;
      showModal("Delete Assessment", `Delete assessment for ${record.client_name}?`, async () => {
        const res = await window.dataSdk.delete(record);
        if (res.isOk) showToast("Assessment deleted");
        else showToast("Failed to delete", "error");
      });
    });
  });
}

function renderClientIntake(container, config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  container.innerHTML = `
    <div class="w-full min-h-full p-6" style="background-color: ${bgColor};">
      <div class="max-w-4xl mx-auto">
        <div class="card-shadow rounded-2xl p-8 mb-6" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
          <button id="backBtn" class="mb-4 px-4 py-2 rounded-lg hover:opacity-70" style="background-color: rgba(255,255,255,0.2); color: white; font-size: ${baseSize * 0.9}px;">← Back</button>
          <div class="text-center">
            <div class="text-5xl mb-3">📋</div>
            <h1 class="heading-font font-bold text-white mb-2" style="font-size: ${baseSize * 2.5}px;">Client Intake Form</h1>
            <p class="text-white" style="font-size: ${baseSize}px;">Collect new client information</p>
          </div>
        </div>

        <form id="clientForm" class="space-y-6">
          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Personal Information</h2>
            <div class="space-y-4">
              <div>
                <label for="fullName" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Full Name</label>
                <input type="text" id="fullName" required class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="email" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Email</label>
                  <input type="email" id="email" required class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
                </div>
                <div>
                  <label for="phone" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Phone</label>
                  <input type="tel" id="phone" required class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
                </div>
              </div>
            </div>
          </div>

          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.5}px;">Service Interest</h2>
            <div class="space-y-4">
              <div>
                <label for="serviceType" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Service Type</label>
                <select id="serviceType" required class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
                  <option value="">Select...</option>
                  <option value="hair">Hair Services</option>
                  <option value="skin">Skin Services</option>
                  <option value="wellness">Wellness Consultation</option>
                  <option value="package">Package Deal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label for="serviceDetails" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Service Details</label>
                <textarea id="serviceDetails" rows="3" class="input-field w-full px-4 py-3 rounded-lg border-2 resize-none" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" placeholder="Describe what you're looking for..."></textarea>
              </div>
              <div>
                <label for="preferredDate" class="block font-semibold mb-2" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">Preferred Appointment Date</label>
                <input type="date" id="preferredDate" class="input-field w-full px-4 py-3 rounded-lg border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;">
              </div>
            </div>
          </div>

          <button type="submit" id="submitClient" class="w-full py-4 rounded-lg font-bold text-white hover:opacity-90 transition-all" style="background-color: ${primaryColor}; font-size: ${baseSize * 1.1}px;">
            Submit Intake Form ✨
          </button>
        </form>

        <div id="clientsList" class="mt-8 space-y-4"></div>
      </div>
    </div>
  `;

  qs("backBtn").addEventListener("click", () => {
    currentView = "dashboard";
    renderApp();
  });

  qs("clientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (allData.length >= 999) {
      showToast("Maximum limit of 999 records reached.", "error");
      return;
    }
    const btn = qs("submitClient");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    const client = {
      type: "client",
      full_name: qs("fullName").value,
      email: qs("email").value,
      phone: qs("phone").value,
      service_type: qs("serviceType").value,
      service_details: qs("serviceDetails").value,
      preferred_date: qs("preferredDate").value,
      created_at: new Date().toISOString(),
    };
    const res = await window.dataSdk.create(client);
    if (res.isOk) {
      showToast("Client intake submitted successfully! ✨");
      qs("clientForm").reset();
    } else {
      showToast("Failed to submit intake form.", "error");
    }
    btn.disabled = false;
    btn.textContent = "Submit Intake Form ✨";
  });

  renderClientsList();
}

function renderClientsList() {
  const config = window.elementSdk?.config || defaultConfig;
  const baseSize = config.font_size || defaultConfig.font_size;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;

  const container = qs("clientsList");
  if (!container) return;
  if (clients.length === 0) {
    container.innerHTML = `
      <div class="text-center p-8 rounded-2xl" style="background-color: ${cardColor}; opacity: 0.6;">
        <p style="color: ${textColor}; font-size: ${baseSize}px;">No client submissions yet. 🌟</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.8}px;">Recent Client Submissions</h2>
    ${clients
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(
        (c) => `
        <div class="card-shadow rounded-xl p-6" style="background-color: ${cardColor};">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="heading-font font-bold" style="color: ${primaryColor}; font-size: ${baseSize * 1.2}px;">${c.full_name}</h3>
              <p style="color: ${textColor}; opacity: 0.7; font-size: ${baseSize * 0.85}px;">${new Date(c.created_at).toLocaleDateString()}</p>
            </div>
            <button class="delete-client px-3 py-2 rounded hover:opacity-70" data-id="${c.__backendId}" style="background-color: ${accentColor}; color: white; font-size: ${baseSize * 0.8}px;">Delete</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Email:</strong> ${c.email}</p>
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Phone:</strong> ${c.phone}</p>
            <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Service:</strong> ${c.service_type}</p>
            ${c.preferred_date ? `<p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;"><strong>Preferred Date:</strong> ${new Date(c.preferred_date).toLocaleDateString()}</p>` : ""}
          </div>
          ${
            c.service_details
              ? `<div class="mt-4 p-3 rounded" style="background-color: rgba(139, 92, 246, 0.1);">
                  <p class="font-semibold mb-1" style="color: ${primaryColor}; font-size: ${baseSize * 0.9}px;">Service Details:</p>
                  <p style="color: ${textColor}; font-size: ${baseSize * 0.85}px;">${c.service_details}</p>
                </div>`
              : ""
          }
        </div>
      `,
      )
      .join("")}
  `;

  container.querySelectorAll(".delete-client").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const record = clients.find((x) => x.__backendId === id);
      if (!record) return;
      showModal("Delete Client", `Delete ${record.full_name}?`, async () => {
        const res = await window.dataSdk.delete(record);
        if (res.isOk) showToast("Client deleted");
        else showToast("Failed to delete", "error");
      });
    });
  });
}

function renderHolisticTracking(container, config) {
  const baseSize = config.font_size || defaultConfig.font_size;
  const bgColor = config.background_color || defaultConfig.background_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const primaryColor = config.primary_color || defaultConfig.primary_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;
  const today = yyyyMmDd(new Date());

  const existing = holisticTracking.find((t) => t.tracking_date === today);

  container.innerHTML = `
    <div class="w-full min-h-full p-6" style="background-color: ${bgColor};">
      <div class="max-w-6xl mx-auto">
        <div class="card-shadow rounded-2xl p-8 mb-6" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
          <button id="backBtn" class="mb-4 px-4 py-2 rounded-lg hover:opacity-70" style="background-color: rgba(255,255,255,0.2); color: white; font-size: ${baseSize * 0.9}px;">← Back</button>
          <div class="text-center">
            <div class="text-5xl mb-3">🌿</div>
            <h1 class="heading-font font-bold text-white mb-2" style="font-size: ${baseSize * 2.5}px;">Holistic Health Tracking</h1>
            <p class="text-white" style="font-size: ${baseSize}px;">Track your daily wellness journey</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${trackingCard(
            "💇🏾‍♀️ Hair & Scalp Care",
            [
              ["washDay", "Wash Day"],
              ["deepCondition", "Deep Conditioning"],
              ["scalpMassage", "Scalp Massage"],
              ["oilTreatment", "Oil Treatment"],
              ["protectiveStyle", "Protective Styling"],
            ],
            existing,
            cardColor,
            textColor,
            primaryColor,
            baseSize,
          )}
          ${trackingCard(
            "✨ Skin Care Routine",
            [
              ["morningRoutine", "Morning Routine"],
              ["eveningRoutine", "Evening Routine"],
              ["sunscreen", "Sunscreen Applied"],
              ["faceMask", "Face Mask"],
              ["exfoliate", "Exfoliation"],
            ],
            existing,
            cardColor,
            textColor,
            primaryColor,
            baseSize,
          )}
          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">🥗 Nutrition & Hydration</h2>
            <div class="space-y-3">
              <div>
                <label for="waterIntakeCount" style="color: ${textColor}; font-size: ${baseSize * 0.9}px; display:block; margin-bottom:8px;">Water Intake (glasses)</label>
                <input type="number" id="waterIntakeCount" min="0" max="20" class="w-full px-3 py-2 rounded border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" value="${existing?.water_intake || ""}">
              </div>
              ${trackingCheck("healthyBreakfast", "Healthy Breakfast", existing, primaryColor, textColor, baseSize)}
              ${trackingCheck("balancedMeals", "Balanced Meals", existing, primaryColor, textColor, baseSize)}
              ${trackingCheck("fruitsVeggies", "Fruits & Vegetables", existing, primaryColor, textColor, baseSize)}
              ${trackingCheck("supplements", "Took Supplements", existing, primaryColor, textColor, baseSize)}
            </div>
          </div>
          ${trackingCard(
            "🧘🏾‍♀️ Movement & Exercise",
            [
              ["yoga", "Yoga/Stretching"],
              ["cardio", "Cardio Workout"],
              ["strength", "Strength Training"],
              ["walk", "Walking/Outdoor Activity"],
              ["dance", "Dance/Movement"],
            ],
            existing,
            cardColor,
            textColor,
            primaryColor,
            baseSize,
          )}
          <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
            <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">😴 Rest & Sleep</h2>
            <div class="space-y-3">
              <div>
                <label for="sleepHours" style="color: ${textColor}; font-size: ${baseSize * 0.9}px; display:block; margin-bottom:8px;">Hours of Sleep</label>
                <input type="number" id="sleepHours" min="0" max="24" step="0.5" class="w-full px-3 py-2 rounded border-2" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" value="${existing?.sleep_hours || ""}">
              </div>
              ${trackingCheck("qualitySleep", "Quality Sleep", existing, primaryColor, textColor, baseSize)}
              ${trackingCheck("napTime", "Nap/Rest Time", existing, primaryColor, textColor, baseSize)}
              ${trackingCheck("screenFree", "Screen-Free Before Bed", existing, primaryColor, textColor, baseSize)}
            </div>
          </div>
          ${trackingCard(
            "🔮 Spiritual Practices",
            [
              ["meditation", "Meditation"],
              ["gratitude", "Gratitude Practice"],
              ["journaling", "Journaling"],
              ["affirmations", "Affirmations"],
              ["breathwork", "Breathwork"],
            ],
            existing,
            cardColor,
            textColor,
            primaryColor,
            baseSize,
          )}
        </div>

        <div class="mt-6 card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
          <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">Daily Reflection</h2>
          <textarea id="dailyReflection" rows="4" class="w-full px-4 py-3 rounded-lg border-2 resize-none" style="border-color: ${primaryColor}; font-size: ${baseSize}px;" placeholder="How are you feeling today?">${existing?.daily_reflection || ""}</textarea>
        </div>

        <button id="saveTracking" class="w-full mt-6 py-4 rounded-lg font-bold text-white hover:opacity-90 transition-all" style="background-color: ${primaryColor}; font-size: ${baseSize * 1.1}px;">
          Save Today's Tracking ✨
        </button>
      </div>
    </div>
  `;

  qs("backBtn").addEventListener("click", () => {
    currentView = "dashboard";
    renderApp();
  });

  qs("saveTracking").addEventListener("click", async () => {
    const btn = qs("saveTracking");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const record = {
      type: "holistic_tracking",
      tracking_date: today,
      wash_day: qs("washDay")?.checked || false,
      deep_condition: qs("deepCondition")?.checked || false,
      scalp_massage: qs("scalpMassage")?.checked || false,
      oil_treatment: qs("oilTreatment")?.checked || false,
      protective_style: qs("protectiveStyle")?.checked || false,
      morning_routine: qs("morningRoutine")?.checked || false,
      evening_routine: qs("eveningRoutine")?.checked || false,
      sunscreen: qs("sunscreen")?.checked || false,
      face_mask: qs("faceMask")?.checked || false,
      exfoliate: qs("exfoliate")?.checked || false,
      water_intake: qs("waterIntakeCount")?.value || "",
      healthy_breakfast: qs("healthyBreakfast")?.checked || false,
      balanced_meals: qs("balancedMeals")?.checked || false,
      fruits_veggies: qs("fruitsVeggies")?.checked || false,
      supplements: qs("supplements")?.checked || false,
      yoga: qs("yoga")?.checked || false,
      cardio: qs("cardio")?.checked || false,
      strength: qs("strength")?.checked || false,
      walk: qs("walk")?.checked || false,
      dance: qs("dance")?.checked || false,
      sleep_hours: qs("sleepHours")?.value || "",
      quality_sleep: qs("qualitySleep")?.checked || false,
      nap_time: qs("napTime")?.checked || false,
      screen_free: qs("screenFree")?.checked || false,
      meditation: qs("meditation")?.checked || false,
      gratitude: qs("gratitude")?.checked || false,
      journaling: qs("journaling")?.checked || false,
      affirmations: qs("affirmations")?.checked || false,
      breathwork: qs("breathwork")?.checked || false,
      daily_reflection: qs("dailyReflection")?.value || "",
      created_at: existing?.created_at || new Date().toISOString(),
    };

    const res = existing ? await window.dataSdk.update({ ...existing, ...record }) : await window.dataSdk.create(record);
    if (res.isOk) showToast("Tracking saved successfully! ✨");
    else showToast("Failed to save tracking.", "error");

    btn.disabled = false;
    btn.textContent = "Save Today's Tracking ✨";
  });
}

function trackingCard(title, items, existing, cardColor, textColor, primaryColor, baseSize) {
  return `
    <div class="card-shadow rounded-2xl p-6" style="background-color: ${cardColor};">
      <h2 class="heading-font font-bold mb-4" style="color: ${textColor}; font-size: ${baseSize * 1.3}px;">${title}</h2>
      <div class="space-y-3">
        ${items.map(([id, label]) => trackingCheck(id, label, existing, primaryColor, textColor, baseSize)).join("")}
      </div>
    </div>
  `;
}

function trackingCheck(id, label, existing, primaryColor, textColor, baseSize) {
  const key = id.replace(/([A-Z])/g, "_$1").toLowerCase();
  const checked = existing && existing[key] ? "checked" : "";
  return `
    <div class="flex items-center gap-3">
      <input type="checkbox" id="${id}" class="w-5 h-5" style="accent-color: ${primaryColor};" ${checked}>
      <label for="${id}" style="color: ${textColor}; font-size: ${baseSize * 0.9}px;">${label}</label>
    </div>
  `;
}

initializeApp();

