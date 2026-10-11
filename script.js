const pageTitles = {
  dashboard: "Dashboard",
  "event-types": "Event Types",
  bookings: "Bookings",
  availability: "Availability",
  "booking-page": "Guest Booking Page",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const colors = ["teal", "blue", "violet", "green"];
const googleClientId = "901337945096-56gqpcjjbie3ab551q5t3jtf8g7mr4do.apps.googleusercontent.com";

const app = {
  state: null,
  currentFilter: "upcoming",
  selectedEventTypeId: "strategist-session",
  calendar: {
    year: 2026,
    month: 5,
    selectedDate: "2026-06-12",
    selectedTime: "10:00",
  },
};

const fallbackState = {
  user: {
    name: "Emma Jackson",
    email: "emma@schedulepro.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  eventTypes: [
    {
      id: "strategist-session",
      name: "Strategist Session",
      description: "Free 30 minute one-on-one session for new prospects.",
      duration: 30,
      location: "Google Meet",
      slug: "strategist-session",
      color: "teal",
      active: true,
    },
    {
      id: "discovery-call",
      name: "Discovery Call",
      description: "Quick qualification call to understand needs and next steps.",
      duration: 15,
      location: "Google Meet",
      slug: "discovery-call",
      color: "blue",
      active: true,
    },
    {
      id: "strategy-review",
      name: "Strategy Review",
      description: "Longer planning session for existing clients and warm leads.",
      duration: 60,
      location: "Google Meet",
      slug: "strategy-review",
      color: "violet",
      active: true,
    },
  ],
  availability: {
    0: { available: false, ranges: [] },
    1: { available: true, ranges: [{ start: "09:00", end: "17:00" }] },
    2: { available: true, ranges: [{ start: "09:00", end: "17:00" }] },
    3: { available: true, ranges: [{ start: "10:00", end: "16:00" }] },
    4: { available: true, ranges: [{ start: "09:00", end: "17:00" }] },
    5: { available: true, ranges: [{ start: "09:00", end: "14:00" }] },
    6: { available: false, ranges: [] },
  },
  unavailableTimes: [
    { id: "unavailable-1", date: "2026-06-18", start: "13:00", end: "15:00", note: "Personal appointment" },
    { id: "unavailable-2", date: "2026-06-21", allDay: true, note: "Weekend off" },
  ],
  bookings: [
    {
      id: "booking-1",
      guestName: "James Smith",
      guestEmail: "james@example.com",
      eventTypeId: "strategist-session",
      date: "2026-06-12",
      time: "10:00",
      timezone: "(GMT+05:30) India Standard Time",
      status: "upcoming",
      meetingLink: "Google Meet",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
    },
    {
      id: "booking-2",
      guestName: "Sarah Johnson",
      guestEmail: "sarah@example.com",
      eventTypeId: "discovery-call",
      date: "2026-06-12",
      time: "13:00",
      timezone: "(GMT+05:30) India Standard Time",
      status: "upcoming",
      meetingLink: "Google Meet",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
    },
  ],
};

const offlineStorageKey = "schedulepro-state";

function loadOfflineState() {
  try {
    const saved = localStorage.getItem(offlineStorageKey);
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(fallbackState));
  } catch (error) {
    return JSON.parse(JSON.stringify(fallbackState));
  }
}

function saveOfflineState() {
  try {
    localStorage.setItem(offlineStorageKey, JSON.stringify(offlineState));
  } catch (error) {
    console.warn("Offline state could not be saved.");
  }
}

let offlineState = loadOfflineState();

const navLinks = [...document.querySelectorAll("[data-page]")];
const pages = [...document.querySelectorAll(".page")];
const title = document.querySelector("#page-title");
const address = document.querySelector(".address");

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return [...scope.querySelectorAll(selector)];
}

function localApi(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === "/api/state" && method === "GET") return JSON.parse(JSON.stringify(offlineState));
  if (path === "/api/availability" && method === "PUT") {
    offlineState.availability = body.availability;
    saveOfflineState();
    return offlineState.availability;
  }
  if (path === "/api/unavailable-times" && method === "POST") {
    offlineState.unavailableTimes.push({ id: `unavailable-${Date.now()}`, ...body });
    saveOfflineState();
    return { ok: true };
  }
  if (path.startsWith("/api/unavailable-times/") && method === "DELETE") {
    const id = decodeURIComponent(path.split("/").pop());
    offlineState.unavailableTimes = offlineState.unavailableTimes.filter((item) => item.id !== id);
    saveOfflineState();
    return { ok: true };
  }
  if (path === "/api/bookings" && method === "POST") {
    offlineState.bookings.push({
      id: `booking-${Date.now()}`,
      status: "upcoming",
      stateLabel: "Confirmed",
      meetingLink: "Google Meet",
      createdAt: new Date().toISOString(),
      ...body,
    });
    saveOfflineState();
    return { ok: true };
  }
  if (path.startsWith("/api/bookings/") && method === "PATCH") {
    const id = decodeURIComponent(path.split("/").pop());
    offlineState.bookings = offlineState.bookings.map((booking) => (booking.id === id ? { ...booking, ...body } : booking));
    saveOfflineState();
    return { ok: true };
  }
  return { ok: true };
}

function api(path, options = {}) {
  if (window.location.protocol === "file:") {
    return Promise.resolve(localApi(path, options));
  }

  return fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Something went wrong.");
    return payload;
  });
}

async function refreshState() {
  app.state = await api("/api/state");
  if (!findEventType(app.selectedEventTypeId)) {
    app.selectedEventTypeId = app.state.eventTypes.find((eventType) => eventType.active)?.id || "";
  }
  moveSelectedDateToAvailableDay();
  renderAll();
}

function toast(message, tone = "success") {
  let notice = qs(".toast");
  if (!notice) {
    notice = document.createElement("div");
    notice.className = "toast";
    document.body.append(notice);
  }
  notice.textContent = message;
  notice.dataset.tone = tone;
  notice.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    notice.hidden = true;
  }, 3000);
}

function decodeGoogleCredential(credential) {
  const payload = credential.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = decodeURIComponent(
    atob(normalized)
      .split("")
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join("")
  );
  return JSON.parse(decoded);
}

function applyGoogleUser(profile, mode) {
  const user = {
    name: profile.name || profile.given_name || "Google User",
    email: profile.email || "",
    avatar: profile.picture || "",
  };

  try {
    localStorage.setItem("schedulepro-google-user", JSON.stringify(user));
  } catch (error) {
    console.warn("Google user could not be stored.");
  }

  if (mode === "host") {
    const chipName = qs(".user-chip span");
    const chipImage = qs(".user-chip img");
    if (chipName) chipName.textContent = user.name;
    if (chipImage && user.avatar) {
      chipImage.src = user.avatar;
      chipImage.alt = user.name;
    }
    toast("Signed in with Google.");
    return;
  }

  const form = qs(".details-form");
  if (!form) return;
  const [nameInput, emailInput] = qsa("input", form);
  if (nameInput) nameInput.value = user.name;
  if (emailInput) emailInput.value = user.email;
  toast("Google account connected for this booking.");
}

function handleGoogleCredential(response) {
  try {
    const profile = decodeGoogleCredential(response.credential);
    const mode = document.body.classList.contains("public-booking") ? "guest" : "host";
    applyGoogleUser(profile, mode);
  } catch (error) {
    toast("Google sign-in could not be completed.", "error");
  }
}

function initGoogleLogin(attempt = 0) {
  const containers = qsa(".google-login-container");
  if (!containers.length) return;

  if (!window.google?.accounts?.id) {
    if (attempt < 20) {
      window.setTimeout(() => initGoogleLogin(attempt + 1), 250);
    }
    return;
  }

  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleCredential,
  });

  containers.forEach((container) => {
    if (container.dataset.googleRendered === "true") return;
    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: container.classList.contains("guest-google-button") ? 360 : 220,
    });
    container.dataset.googleRendered = "true";
  });
}

function handleGoogleLogin(mode) {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
    return;
  }

  applyGoogleUser({ name: "Google User", email: "google.user@gmail.com" }, mode);
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTableDate(dateValue, timeValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const prefix = sameDay(date, today)
    ? "Today"
    : sameDay(date, tomorrow)
      ? "Tomorrow"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${prefix}, ${formatTime(timeValue)}`;
}

function formatTime(timeValue) {
  if (!timeValue) return "";
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(2026, 0, 1, hours, minutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toMinutes(timeValue) {
  const [hours, minutes] = String(timeValue || "").split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function findEventType(id) {
  return app.state?.eventTypes.find((eventType) => eventType.id === id && eventType.active);
}

function activeEventTypes() {
  return app.state.eventTypes.filter((eventType) => eventType.active);
}

function eventColorClass(eventType) {
  return `${eventType?.color || "teal"}-bg`;
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function isDateAvailable(dateKey) {
  if (!app.state) return false;
  const date = new Date(`${dateKey}T00:00:00`);
  const dayAvailability = app.state.availability[date.getDay()];
  const allDayBlocked = app.state.unavailableTimes.some((block) => block.date === dateKey && block.allDay);
  return Boolean(dayAvailability?.available && dayAvailability.ranges?.length && !allDayBlocked);
}

function slotOverlaps(start, end, otherStart, otherEnd) {
  return start < otherEnd && otherStart < end;
}

function isTimeAvailable(dateKey, timeValue) {
  const eventType = findEventType(app.selectedEventTypeId);
  if (!eventType || !isDateAvailable(dateKey)) return false;
  const start = toMinutes(timeValue);
  const end = start + Number(eventType.duration);
  const dayAvailability = app.state.availability[new Date(`${dateKey}T00:00:00`).getDay()];
  const insideRange = dayAvailability.ranges.some((range) => start >= toMinutes(range.start) && end <= toMinutes(range.end));
  if (!insideRange) return false;

  const blocked = app.state.unavailableTimes.some((block) => {
    if (block.date !== dateKey) return false;
    if (block.allDay) return true;
    return slotOverlaps(start, end, toMinutes(block.start), toMinutes(block.end));
  });
  if (blocked) return false;

  return !app.state.bookings.some((booking) => {
    if (booking.date !== dateKey || booking.status === "canceled") return false;
    const bookingType = app.state.eventTypes.find((eventType) => eventType.id === booking.eventTypeId);
    if (!bookingType) return false;
    const bookingStart = toMinutes(booking.time);
    return slotOverlaps(start, end, bookingStart, bookingStart + Number(bookingType.duration));
  });
}

function firstAvailableTime(dateKey) {
  return getAvailableTimes(dateKey)[0] || "";
}

function getAvailableTimes(dateKey) {
  const eventType = findEventType(app.selectedEventTypeId);
  if (!eventType || !isDateAvailable(dateKey)) return [];
  const dayAvailability = app.state.availability[new Date(`${dateKey}T00:00:00`).getDay()];
  const times = [];

  dayAvailability.ranges.forEach((range) => {
    const start = toMinutes(range.start);
    const end = toMinutes(range.end) - Number(eventType.duration);
    for (let minutes = start; minutes <= end; minutes += 30) {
      const time = fromMinutes(minutes);
      if (isTimeAvailable(dateKey, time)) times.push(time);
    }
  });

  return times;
}

function moveSelectedDateToAvailableDay() {
  if (!app.state) return;
  const [year, month, day] = app.calendar.selectedDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  for (let offset = 0; offset < 370; offset += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    const dateKey = formatDateKey(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());
    if (isDateAvailable(dateKey)) {
      app.calendar.year = candidate.getFullYear();
      app.calendar.month = candidate.getMonth();
      app.calendar.selectedDate = dateKey;
      app.calendar.selectedTime = isTimeAvailable(dateKey, app.calendar.selectedTime)
        ? app.calendar.selectedTime
        : firstAvailableTime(dateKey);
      return;
    }
  }
}

function renderDashboard() {
  const upcoming = app.state.bookings.filter((booking) => booking.status === "upcoming");
  const total = app.state.bookings.length;
  const completed = app.state.bookings.filter((booking) => booking.status === "past").length;
  const canceled = app.state.bookings.filter((booking) => booking.status === "canceled").length;
  const bookingRate = total ? Math.round(((total - canceled) / total) * 100) : 0;

  const metrics = qsa(".metric-card strong");
  if (metrics[0]) metrics[0].textContent = upcoming.length;
  if (metrics[1]) metrics[1].textContent = total;
  if (metrics[2]) metrics[2].textContent = `${bookingRate}%`;
  const next = [...upcoming].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const metricSmall = qsa(".metric-card small");
  if (metricSmall[0]) metricSmall[0].textContent = next ? `Next call at ${formatTime(next.time)}` : "No upcoming calls";

  const analytics = qsa(".analytics-grid div strong");
  if (analytics[0]) analytics[0].textContent = total;
  if (analytics[1]) analytics[1].textContent = `${bookingRate}%`;
  if (analytics[2]) analytics[2].textContent = `${Math.round((completed / Math.max(total, 1)) * 100)}%`;
  if (analytics[3]) analytics[3].textContent = `${Math.round((canceled / Math.max(total, 1)) * 100)}%`;

  const eventPanel = qs("#dashboard .content-grid .panel:first-child");
  const bookingPanel = qs("#dashboard .content-grid .panel:nth-child(2)");
  renderDashboardEvents(eventPanel);
  renderDashboardBookings(bookingPanel, upcoming.slice(0, 3));
}

function renderDashboardEvents(panel) {
  if (!panel) return;
  qsa(".event-row", panel).forEach((row) => row.remove());
  activeEventTypes()
    .slice(0, 3)
    .forEach((eventType) => {
      const row = document.createElement("div");
      row.className = "event-row";
      row.innerHTML = `
        <span class="dot ${eventColorClass(eventType)}"></span>
        <div><strong>${eventType.name}</strong><small>${eventType.duration} mins, One-on-One</small></div>
        <span class="slug">/${eventType.slug}</span>
      `;
      panel.append(row);
    });
}

function renderDashboardBookings(panel, bookings) {
  if (!panel) return;
  qsa(".booking-row", panel).forEach((row) => row.remove());
  bookings.forEach((booking) => {
    const eventType = app.state.eventTypes.find((item) => item.id === booking.eventTypeId);
    const row = document.createElement("div");
    row.className = "booking-row";
    row.innerHTML = `
      ${booking.avatar ? `<img src="${booking.avatar}" alt="${booking.guestName}" />` : `<div class="avatar-fallback">${initials(booking.guestName)}</div>`}
      <div>
        <strong>${booking.guestName}</strong>
        <small>${eventType?.name || "Event"} · ${formatTableDate(booking.date, booking.time)}</small>
      </div>
      <span>${booking.meetingLink || eventType?.location || "Online"}</span>
    `;
    panel.append(row);
  });
}

function renderEventTypes() {
  const grid = qs("#event-types .card-grid");
  if (!grid) return;
  grid.replaceChildren();
  activeEventTypes().forEach((eventType) => {
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <span class="dot ${eventColorClass(eventType)}"></span>
      <h3>${eventType.name}</h3>
      <p>${eventType.description || "No description added."}</p>
      <div class="card-meta"><span>${eventType.duration} min</span><span>${eventType.location}</span><span>/${eventType.slug}</span></div>
      <div class="card-actions">
        <button type="button" data-edit-event="${eventType.id}">Edit</button>
        <button type="button" data-delete-event="${eventType.id}">Delete</button>
      </div>
    `;
    grid.append(card);
  });
}

function renderBookings() {
  const panel = qs("#bookings .table-panel");
  if (!panel) return;
  qsa(".booking-record", panel).forEach((row) => row.remove());
  const emptyState = qs(".empty-bookings", panel);
  const records = app.state.bookings.filter((booking) => booking.status === app.currentFilter);

  records.forEach((booking) => {
    const eventType = app.state.eventTypes.find((item) => item.id === booking.eventTypeId);
    const row = document.createElement("div");
    row.className = "table-row booking-record";
    row.dataset.status = booking.status;
    row.innerHTML = `
      <span>${booking.guestName}</span>
      <span>${eventType?.name || "Event"}</span>
      <span>${formatTableDate(booking.date, booking.time)}</span>
      <strong>${booking.stateLabel || (booking.status === "past" ? "Completed" : "Confirmed")}</strong>
      <div class="booking-actions">
        ${booking.status === "upcoming" ? `<button type="button" data-cancel-booking="${booking.id}">Cancel</button>` : ""}
      </div>
    `;
    panel.insertBefore(row, emptyState);
  });

  if (emptyState) emptyState.hidden = records.length > 0;
  qsa("[data-booking-filter] button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === app.currentFilter);
  });
}

function renderAvailability() {
  const panel = qs(".availability-panel");
  if (!panel) return;
  panel.replaceChildren();
  dayNames.slice(1).concat(dayNames[0]).forEach((dayName) => {
    const dayIndex = dayNames.indexOf(dayName);
    const dayAvailability = app.state.availability[dayIndex] || { available: false, ranges: [] };
    const range = dayAvailability.ranges[0] || { start: "09:00", end: "17:00" };
    const row = document.createElement("div");
    row.className = `availability-row${dayAvailability.available ? "" : " muted is-unavailable"}`;
    row.dataset.availabilityRow = "";
    row.dataset.day = dayIndex;
    row.innerHTML = `
      <div class="day-control">
        <strong>${dayName}</strong>
        <label class="day-toggle">
          <input type="checkbox" ${dayAvailability.available ? "checked" : ""} />
          <span></span>
          <em>${dayAvailability.available ? "Available" : "Unavailable"}</em>
        </label>
      </div>
      <input class="start-time-input" type="time" value="${range.start}" ${dayAvailability.available ? "" : "disabled"} />
      <input class="end-time-input" type="time" value="${range.end}" ${dayAvailability.available ? "" : "disabled"} />
      <button type="button" data-copy-hours title="Copy Monday hours" ${dayAvailability.available ? "" : "disabled"}>↺</button>
    `;
    panel.append(row);
  });
}

function renderUnavailableTimes() {
  const list = qs(".unavailable-list");
  if (!list) return;
  list.replaceChildren();
  app.state.unavailableTimes
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((block) => {
      const item = document.createElement("div");
      item.className = "unavailable-item";
      const timeLabel = block.allDay ? "All day" : `${formatTime(block.start)} - ${formatTime(block.end)}`;
      item.innerHTML = `
        <div>
          <strong>${formatDate(block.date)}</strong>
          <span>${timeLabel}${block.note ? ` · ${block.note}` : ""}</span>
        </div>
        <button type="button" data-remove-unavailable="${block.id}" aria-label="Remove unavailable time">Remove</button>
      `;
      list.append(item);
    });
}

function renderBookingPage() {
  const eventType = findEventType(app.selectedEventTypeId) || activeEventTypes()[0];
  if (!eventType) return;
  app.selectedEventTypeId = eventType.id;

  const sessionBox = qs(".session-box");
  if (sessionBox) {
    sessionBox.innerHTML = `
      <label>Event type
        <select data-booking-event>
          ${activeEventTypes()
            .map((item) => `<option value="${item.id}" ${item.id === eventType.id ? "selected" : ""}>${item.name}</option>`)
            .join("")}
        </select>
      </label>
      <h2>${eventType.name}</h2>
      <p>${eventType.description}</p>
      <div class="session-meta"><span>◷ ${eventType.duration} min</span><span>▣ One-on-One</span><span>${eventType.location}</span></div>
    `;
  }

  renderBookingCalendar();
  renderTimes();
}

function renderBookingCalendar() {
  const calendarGrid = qs(".calendar-grid");
  const monthTitle = qs(".calendar-header strong");
  if (!calendarGrid || !monthTitle) return;

  monthTitle.textContent = `${monthNames[app.calendar.month]} ${app.calendar.year}`;
  calendarGrid.replaceChildren();

  weekdayLabels.forEach((label) => {
    const dayLabel = document.createElement("span");
    dayLabel.textContent = label;
    calendarGrid.append(dayLabel);
  });

  const firstDay = new Date(app.calendar.year, app.calendar.month, 1).getDay();
  const daysInMonth = new Date(app.calendar.year, app.calendar.month + 1, 0).getDate();

  for (let index = 0; index < firstDay; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "empty-day";
    spacer.setAttribute("aria-hidden", "true");
    calendarGrid.append(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(app.calendar.year, app.calendar.month, day);
    const available = isDateAvailable(dateKey);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day;
    button.dataset.date = dateKey;
    button.disabled = !available;
    button.classList.toggle("selected", dateKey === app.calendar.selectedDate);
    button.addEventListener("click", () => {
      app.calendar.selectedDate = dateKey;
      app.calendar.selectedTime = firstAvailableTime(dateKey);
      renderBookingCalendar();
      renderTimes();
    });
    calendarGrid.append(button);
  }
}

function renderTimes() {
  const timeGrid = qs(".time-grid");
  if (!timeGrid) return;
  const times = getAvailableTimes(app.calendar.selectedDate);
  if (!times.includes(app.calendar.selectedTime)) app.calendar.selectedTime = times[0] || "";
  timeGrid.replaceChildren();

  if (!times.length) {
    const empty = document.createElement("p");
    empty.className = "empty-times";
    empty.textContent = "No available times for this date.";
    timeGrid.append(empty);
    return;
  }

  times.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = formatTime(time);
    button.dataset.time = time;
    button.classList.toggle("selected", time === app.calendar.selectedTime);
    button.addEventListener("click", () => {
      app.calendar.selectedTime = time;
      renderTimes();
    });
    timeGrid.append(button);
  });
}

function renderAll() {
  if (!app.state) return;
  renderDashboard();
  renderEventTypes();
  renderBookings();
  renderAvailability();
  renderUnavailableTimes();
  renderBookingPage();
}

function changeCalendarMonth(direction) {
  app.calendar.month += direction;
  if (app.calendar.month < 0) {
    app.calendar.month = 11;
    app.calendar.year -= 1;
  }
  if (app.calendar.month > 11) {
    app.calendar.month = 0;
    app.calendar.year += 1;
  }
  const selectedDay = Number(app.calendar.selectedDate.split("-")[2]);
  const daysInMonth = new Date(app.calendar.year, app.calendar.month + 1, 0).getDate();
  app.calendar.selectedDate = formatDateKey(app.calendar.year, app.calendar.month, Math.min(selectedDay, daysInMonth));
  moveSelectedDateToAvailableDay();
  renderBookingPage();
}

async function createEventType() {
  const name = prompt("Event name");
  if (!name) return;
  const duration = prompt("Duration in minutes", "30");
  if (!duration) return;
  const description = prompt("Description", "Free call to discuss goals and next steps.") || "";

  await api("/api/event-types", {
    method: "POST",
    body: JSON.stringify({
      name,
      duration: Number(duration),
      description,
      location: "Google Meet",
      color: colors[activeEventTypes().length % colors.length],
    }),
  });
  await refreshState();
  toast("Event type created.");
}

async function editEventType(id) {
  const eventType = findEventType(id);
  if (!eventType) return;
  const name = prompt("Event name", eventType.name);
  if (!name) return;
  const duration = prompt("Duration in minutes", eventType.duration);
  if (!duration) return;
  const description = prompt("Description", eventType.description) || "";

  await api(`/api/event-types/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name, duration: Number(duration), description }),
  });
  await refreshState();
  toast("Event type updated.");
}

async function deleteEventType(id) {
  if (!confirm("Delete this event type? Existing bookings will remain visible.")) return;
  await api(`/api/event-types/${encodeURIComponent(id)}`, { method: "DELETE" });
  await refreshState();
  toast("Event type deleted.");
}

function collectAvailability() {
  const availability = {};
  qsa("[data-availability-row]").forEach((row) => {
    const day = row.dataset.day;
    const available = qs(".day-toggle input", row).checked;
    const start = qs(".start-time-input", row).value;
    const end = qs(".end-time-input", row).value;
    availability[day] = {
      available,
      ranges: available ? [{ start, end }] : [],
    };
  });
  return availability;
}

function applyAvailabilityRowToState(row) {
  if (!app.state || !row) return;

  const day = row.dataset.day;
  const available = qs(".day-toggle input", row).checked;
  const start = qs(".start-time-input", row).value;
  const end = qs(".end-time-input", row).value;
  const label = qs(".day-toggle em", row);
  const disabled = !available;

  qsa("input[type='time'], button", row).forEach((control) => {
    control.disabled = disabled;
  });
  row.classList.toggle("muted", disabled);
  row.classList.toggle("is-unavailable", disabled);
  label.textContent = available ? "Available" : "Unavailable";

  app.state.availability[day] = {
    available,
    ranges: available ? [{ start, end }] : [],
  };

  moveSelectedDateToAvailableDay();
  renderBookingPage();
}

async function persistCurrentAvailability() {
  const availability = collectAvailability();
  await api("/api/availability", {
    method: "PUT",
    body: JSON.stringify({ availability }),
  });
  app.state.availability = availability;
}

async function saveAvailability() {
  const availability = collectAvailability();
  const invalid = Object.values(availability).some((day) => day.available && toMinutes(day.ranges[0].end) <= toMinutes(day.ranges[0].start));
  if (invalid) {
    toast("End time must be after start time.", "error");
    return;
  }
  await persistCurrentAvailability();
  renderBookingPage();
  toast("Availability saved.");
}

function copyMondayHours(row) {
  const mondayRow = qs('[data-availability-row][data-day="1"]');
  if (!row || !mondayRow || row === mondayRow) return;
  const mondayStart = qs(".start-time-input", mondayRow).value;
  const mondayEnd = qs(".end-time-input", mondayRow).value;
  qs(".start-time-input", row).value = mondayStart;
  qs(".end-time-input", row).value = mondayEnd;
  applyAvailabilityRowToState(row);
  persistCurrentAvailability().catch((error) => toast(error.message, "error"));
  toast("Monday hours copied.");
}

async function addUnavailableTime(event) {
  event.preventDefault();
  const date = qs("#unavailable-date").value;
  const start = qs("#unavailable-start").value;
  const end = qs("#unavailable-end").value;
  const note = qs("#unavailable-note").value;
  await api("/api/unavailable-times", {
    method: "POST",
    body: JSON.stringify({ date, start, end, note }),
  });
  qs("#unavailable-note").value = "";
  await refreshState();
  toast("Unavailable time added.");
}

async function removeUnavailableTime(id) {
  await api(`/api/unavailable-times/${encodeURIComponent(id)}`, { method: "DELETE" });
  await refreshState();
  toast("Unavailable time removed.");
}

async function confirmBooking() {
  const form = qs(".details-form");
  const [nameInput, emailInput, phoneInput] = qsa("input", form);
  const notesInput = qs("textarea", form);
  const timezone = qs(".booking-heading select").value;

  if (!nameInput.value.trim() || !emailInput.value.trim()) {
    toast("Name and email are required.", "error");
    return;
  }
  if (!app.calendar.selectedTime) {
    toast("Choose an available time.", "error");
    return;
  }

  await api("/api/bookings", {
    method: "POST",
    body: JSON.stringify({
      guestName: nameInput.value,
      guestEmail: emailInput.value,
      guestPhone: phoneInput.value,
      notes: notesInput.value,
      eventTypeId: app.selectedEventTypeId,
      date: app.calendar.selectedDate,
      time: app.calendar.selectedTime,
      timezone,
    }),
  });

  form.reset();
  await refreshState();
  toast("Booking confirmed.");
  if (qs("#bookings")) {
    showPage("bookings");
    history.replaceState(null, "", "#bookings");
  } else {
    renderBookingPage();
  }
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  await api(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "canceled" }),
  });
  await refreshState();
  toast("Booking canceled.");
}

function showPage(pageId) {
  const target = document.querySelector(`#${pageId}`);
  if (!target) return;

  pages.forEach((page) => page.classList.toggle("active", page.id === pageId));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.page === pageId));
  document.body.classList.toggle("public-booking", pageId === "booking-page");
  if (title) title.textContent = pageTitles[pageId] || "Dashboard";
  if (address) {
    address.textContent =
      pageId === "booking-page"
        ? "schedulepro.com/booking/strategist-session"
        : `app.schedulepro.com/${pageId === "event-types" ? "event-types" : pageId}`;
  }
}

function setupEvents() {
  initGoogleLogin();

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const pageId = link.dataset.page;
      history.replaceState(null, "", `#${pageId}`);
      showPage(pageId);
    });
  });

  window.addEventListener("hashchange", () => {
    showPage(location.hash.replace("#", "") || "dashboard");
  });

  window.addEventListener("focus", () => {
    if (window.location.protocol !== "file:") return;
    offlineState = loadOfflineState();
    refreshState().catch((error) => toast(error.message, "error"));
  });

  document.addEventListener("click", async (event) => {
      const target = event.target;
      const googleButton = target.closest("[data-google-login]");
    try {
      if (target.matches(".primary-button") && /new event|create event/i.test(target.textContent)) await createEventType();
      if (target.matches("[data-save-availability]")) await saveAvailability();
      if (target.matches("[data-edit-event]")) await editEventType(target.dataset.editEvent);
      if (target.matches("[data-delete-event]")) await deleteEventType(target.dataset.deleteEvent);
      if (target.matches("[data-remove-unavailable]")) await removeUnavailableTime(target.dataset.removeUnavailable);
      if (target.matches("[data-cancel-booking]")) await cancelBooking(target.dataset.cancelBooking);
      if (target.matches("[data-copy-hours]")) copyMondayHours(target.closest("[data-availability-row]"));
      if (googleButton) handleGoogleLogin(googleButton.dataset.googleLogin);
      if (target.matches(".confirm-button")) await confirmBooking();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-booking-event]")) {
      app.selectedEventTypeId = target.value;
      renderBookingPage();
    }
    if (target.matches(".day-toggle input")) {
      const row = target.closest("[data-availability-row]");
      applyAvailabilityRowToState(row);
      persistCurrentAvailability().catch((error) => toast(error.message, "error"));
    }
    if (target.matches(".start-time-input, .end-time-input")) {
      const row = target.closest("[data-availability-row]");
      applyAvailabilityRowToState(row);
      const availability = collectAvailability();
      const invalid = Object.values(availability).some((day) => day.available && toMinutes(day.ranges[0].end) <= toMinutes(day.ranges[0].start));
      if (!invalid) persistCurrentAvailability().catch((error) => toast(error.message, "error"));
    }
  });

  qsa("[data-booking-filter] button").forEach((button) => {
    button.addEventListener("click", () => {
      app.currentFilter = button.dataset.filter;
      renderBookings();
    });
  });

  const unavailableForm = qs(".unavailable-form");
  if (unavailableForm) unavailableForm.addEventListener("submit", addUnavailableTime);

  const monthButtons = qsa(".calendar-header button");
  if (monthButtons[0]) monthButtons[0].addEventListener("click", () => changeCalendarMonth(-1));
  if (monthButtons[1]) monthButtons[1].addEventListener("click", () => changeCalendarMonth(1));
}

if (location.hash === "#booking-page" && !document.body.classList.contains("public-booking")) {
  location.replace("booking.html");
} else {
  setupEvents();
  refreshState()
    .then(() => showPage(location.hash.replace("#", "") || "dashboard"))
    .catch((error) => {
      console.error(error);
      toast("Start the backend with: node server.js", "error");
    });
}

