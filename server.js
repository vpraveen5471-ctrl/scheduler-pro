const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const dataPath = path.join(root, "data.json");
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const seedData = {
  user: {
    name: "Emma Jackson",
    email: "emma@schedulepro.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
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
    {
      id: "unavailable-1",
      date: "2026-06-18",
      start: "13:00",
      end: "15:00",
      note: "Personal appointment",
    },
    {
      id: "unavailable-2",
      date: "2026-06-21",
      allDay: true,
      note: "Weekend off",
    },
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
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
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
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
    },
    {
      id: "booking-3",
      guestName: "Michael Brown",
      guestEmail: "michael@example.com",
      eventTypeId: "strategy-review",
      date: "2026-06-15",
      time: "09:30",
      timezone: "(GMT+05:30) India Standard Time",
      status: "upcoming",
      meetingLink: "Google Meet",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80",
    },
    {
      id: "booking-4",
      guestName: "Ava Patel",
      guestEmail: "ava@example.com",
      eventTypeId: "strategist-session",
      date: "2026-06-19",
      time: "15:00",
      timezone: "(GMT+05:30) India Standard Time",
      status: "upcoming",
      stateLabel: "Rescheduled",
      meetingLink: "Google Meet",
    },
    {
      id: "booking-5",
      guestName: "Noah Williams",
      guestEmail: "noah@example.com",
      eventTypeId: "strategist-session",
      date: "2026-05-30",
      time: "11:00",
      timezone: "(GMT+05:30) India Standard Time",
      status: "past",
      stateLabel: "Completed",
      meetingLink: "Google Meet",
    },
    {
      id: "booking-6",
      guestName: "Mia Chen",
      guestEmail: "mia@example.com",
      eventTypeId: "discovery-call",
      date: "2026-05-28",
      time: "14:00",
      timezone: "(GMT+05:30) India Standard Time",
      status: "past",
      stateLabel: "Completed",
      meetingLink: "Google Meet",
    },
    {
      id: "booking-7",
      guestName: "Olivia Martin",
      guestEmail: "olivia@example.com",
      eventTypeId: "strategist-session",
      date: "2026-06-03",
      time: "16:00",
      timezone: "(GMT+05:30) India Standard Time",
      status: "canceled",
      stateLabel: "Canceled",
      meetingLink: "Google Meet",
    },
  ],
};

function ensureDataFile() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(seedData, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function writeData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    if (error.code !== "EPERM" && error.code !== "EACCES") throw error;
    console.warn("Changes are active for this server session but could not be written to data.json.");
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function toMinutes(time) {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function findEventType(data, eventTypeId) {
  return data.eventTypes.find((eventType) => eventType.id === eventTypeId && eventType.active);
}

function isSlotAvailable(data, eventTypeId, date, time, ignoredBookingId) {
  const eventType = findEventType(data, eventTypeId);
  if (!eventType) return { ok: false, message: "Event type not found." };

  const start = toMinutes(time);
  const end = start + Number(eventType.duration);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { ok: false, message: "Choose a valid time." };
  }

  const day = new Date(`${date}T00:00:00`).getDay();
  const dayAvailability = data.availability[day];
  if (!dayAvailability?.available) {
    return { ok: false, message: "This date is not available." };
  }

  const insideAvailableRange = dayAvailability.ranges.some((range) => {
    return start >= toMinutes(range.start) && end <= toMinutes(range.end);
  });
  if (!insideAvailableRange) {
    return { ok: false, message: "This time is outside the available schedule." };
  }

  const blocked = data.unavailableTimes.some((block) => {
    if (block.date !== date) return false;
    if (block.allDay) return true;
    return rangesOverlap(start, end, toMinutes(block.start), toMinutes(block.end));
  });
  if (blocked) {
    return { ok: false, message: "This time is blocked as unavailable." };
  }

  const conflictingBooking = data.bookings.find((booking) => {
    if (booking.id === ignoredBookingId || booking.date !== date || booking.status === "canceled") return false;
    const otherEvent = data.eventTypes.find((eventType) => eventType.id === booking.eventTypeId);
    if (!otherEvent) return false;
    const otherStart = toMinutes(booking.time);
    const otherEnd = otherStart + Number(otherEvent.duration);
    return rangesOverlap(start, end, otherStart, otherEnd);
  });
  if (conflictingBooking) {
    return { ok: false, message: "This time is already booked." };
  }

  return { ok: true };
}

function validateEventType(payload) {
  const name = String(payload.name || "").trim();
  const duration = Number(payload.duration);
  if (!name) return "Event name is required.";
  if (!Number.isInteger(duration) || duration < 5 || duration > 480) return "Duration must be between 5 and 480 minutes.";
  return "";
}

async function handleApi(request, response, pathname) {
  const data = readData();
  const method = request.method;

  try {
    if (method === "GET" && pathname === "/api/state") {
      sendJson(response, 200, data);
      return;
    }

    if (method === "POST" && pathname === "/api/event-types") {
      const payload = await collectBody(request);
      const validationError = validateEventType(payload);
      if (validationError) return sendJson(response, 400, { error: validationError });

      const baseSlug = slugify(payload.slug || payload.name);
      const takenSlugs = new Set(data.eventTypes.map((eventType) => eventType.slug));
      let slug = baseSlug || "event";
      let count = 2;
      while (takenSlugs.has(slug)) {
        slug = `${baseSlug}-${count}`;
        count += 1;
      }

      const eventType = {
        id: id("event"),
        name: String(payload.name).trim(),
        description: String(payload.description || "").trim(),
        duration: Number(payload.duration),
        location: String(payload.location || "Google Meet").trim(),
        slug,
        color: payload.color || "teal",
        active: true,
      };
      data.eventTypes.push(eventType);
      writeData(data);
      sendJson(response, 201, eventType);
      return;
    }

    const eventTypeMatch = pathname.match(/^\/api\/event-types\/([^/]+)$/);
    if (eventTypeMatch && method === "PATCH") {
      const payload = await collectBody(request);
      const eventType = data.eventTypes.find((item) => item.id === decodeURIComponent(eventTypeMatch[1]));
      if (!eventType) return sendJson(response, 404, { error: "Event type not found." });
      const candidate = { ...eventType, ...payload };
      const validationError = validateEventType(candidate);
      if (validationError) return sendJson(response, 400, { error: validationError });
      Object.assign(eventType, {
        name: String(candidate.name).trim(),
        description: String(candidate.description || "").trim(),
        duration: Number(candidate.duration),
        location: String(candidate.location || "Google Meet").trim(),
        color: candidate.color || eventType.color,
        active: candidate.active !== false,
      });
      if (payload.slug) eventType.slug = slugify(payload.slug);
      writeData(data);
      sendJson(response, 200, eventType);
      return;
    }

    if (eventTypeMatch && method === "DELETE") {
      const eventType = data.eventTypes.find((item) => item.id === decodeURIComponent(eventTypeMatch[1]));
      if (!eventType) return sendJson(response, 404, { error: "Event type not found." });
      eventType.active = false;
      writeData(data);
      sendJson(response, 200, eventType);
      return;
    }

    if (method === "PUT" && pathname === "/api/availability") {
      const payload = await collectBody(request);
      if (!payload.availability || typeof payload.availability !== "object") {
        return sendJson(response, 400, { error: "Availability is required." });
      }
      data.availability = payload.availability;
      writeData(data);
      sendJson(response, 200, data.availability);
      return;
    }

    if (method === "POST" && pathname === "/api/unavailable-times") {
      const payload = await collectBody(request);
      if (!payload.date || (!payload.allDay && (!payload.start || !payload.end))) {
        return sendJson(response, 400, { error: "Date, start time, and end time are required." });
      }
      if (!payload.allDay && toMinutes(payload.end) <= toMinutes(payload.start)) {
        return sendJson(response, 400, { error: "End time must be after start time." });
      }
      const block = {
        id: id("unavailable"),
        date: payload.date,
        start: payload.allDay ? "" : payload.start,
        end: payload.allDay ? "" : payload.end,
        allDay: Boolean(payload.allDay),
        note: String(payload.note || "").trim(),
      };
      data.unavailableTimes.push(block);
      writeData(data);
      sendJson(response, 201, block);
      return;
    }

    const unavailableMatch = pathname.match(/^\/api\/unavailable-times\/([^/]+)$/);
    if (unavailableMatch && method === "DELETE") {
      const before = data.unavailableTimes.length;
      data.unavailableTimes = data.unavailableTimes.filter((item) => item.id !== decodeURIComponent(unavailableMatch[1]));
      if (data.unavailableTimes.length === before) return sendJson(response, 404, { error: "Unavailable time not found." });
      writeData(data);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (method === "POST" && pathname === "/api/bookings") {
      const payload = await collectBody(request);
      if (!payload.guestName || !payload.guestEmail || !payload.eventTypeId || !payload.date || !payload.time) {
        return sendJson(response, 400, { error: "Name, email, event type, date, and time are required." });
      }
      const availability = isSlotAvailable(data, payload.eventTypeId, payload.date, payload.time);
      if (!availability.ok) return sendJson(response, 409, { error: availability.message });

      const booking = {
        id: id("booking"),
        guestName: String(payload.guestName).trim(),
        guestEmail: String(payload.guestEmail).trim(),
        guestPhone: String(payload.guestPhone || "").trim(),
        notes: String(payload.notes || "").trim(),
        eventTypeId: payload.eventTypeId,
        date: payload.date,
        time: payload.time,
        timezone: String(payload.timezone || "").trim(),
        status: "upcoming",
        stateLabel: "Confirmed",
        meetingLink: "Google Meet",
        createdAt: new Date().toISOString(),
      };
      data.bookings.push(booking);
      writeData(data);
      sendJson(response, 201, booking);
      return;
    }

    const bookingMatch = pathname.match(/^\/api\/bookings\/([^/]+)$/);
    if (bookingMatch && method === "PATCH") {
      const payload = await collectBody(request);
      const booking = data.bookings.find((item) => item.id === decodeURIComponent(bookingMatch[1]));
      if (!booking) return sendJson(response, 404, { error: "Booking not found." });

      if (payload.status) {
        booking.status = payload.status;
        booking.stateLabel = payload.status === "canceled" ? "Canceled" : "Confirmed";
      }

      if (payload.date || payload.time || payload.eventTypeId) {
        const nextBooking = { ...booking, ...payload };
        const availability = isSlotAvailable(data, nextBooking.eventTypeId, nextBooking.date, nextBooking.time, booking.id);
        if (!availability.ok) return sendJson(response, 409, { error: availability.message });
        booking.date = nextBooking.date;
        booking.time = nextBooking.time;
        booking.eventTypeId = nextBooking.eventTypeId;
        booking.status = "upcoming";
        booking.stateLabel = "Rescheduled";
      }

      writeData(data);
      sendJson(response, 200, booking);
      return;
    }

    sendJson(response, 404, { error: "API route not found." });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Request failed." });
  }
}

function serveStatic(request, response, pathname) {
  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(root, requestPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

ensureDataFile();

http
  .createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      handleApi(request, response, url.pathname);
      return;
    }
    serveStatic(request, response, url.pathname);
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`SchedulePro running at http://localhost:${port}`);
  });

