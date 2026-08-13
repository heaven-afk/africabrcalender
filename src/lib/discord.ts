import { getEventTimes, getEventTimezone } from "@/lib/eventTiming";
import { CalendarEvent } from "@/types/event";

const DISCORD_DEFAULT_AVATAR_URL = "https://res.cloudinary.com/id8ciytn/image/upload/v1786622214/esports-calendar/discord/avatar-v2.png";
const DISCORD_DEFAULT_BANNER_URL = "https://res.cloudinary.com/id8ciytn/image/upload/v1786622216/esports-calendar/discord/banner-v2.jpg";

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    return vercelUrl.replace(/\/$/, "");
  }
  return "https://esportscalendar.org";
}

function getBannerUrl(): string {
  return process.env.DISCORD_BANNER_URL
    || process.env.NEXT_PUBLIC_SITE_BANNER_URL
    || DISCORD_DEFAULT_BANNER_URL;
}

function getAvatarUrl(): string {
  return process.env.DISCORD_AVATAR_URL || DISCORD_DEFAULT_AVATAR_URL;
}

function getComponentsWebhookUrl(webhookUrl: string): string {
  const url = new URL(webhookUrl);
  url.searchParams.set("with_components", "true");
  return url.toString();
}

function cleanText(value: string | null | undefined, maxLength = 600): string {
  return (value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/@/g, "@\u200b")
    .trim()
    .slice(0, maxLength);
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatEventDetails(event: CalendarEvent): string {
  const { startTime, endTime } = getEventTimes(event);
  const timezone = getEventTimezone(event);
  const dates = event.startDate === event.endDate
    ? formatDate(event.startDate)
    : `${formatDate(event.startDate)} — ${formatDate(event.endDate)}`;
  const formattedStart = formatTime(startTime);
  const formattedEnd = formatTime(endTime);
  const time = formattedStart
    ? `${formattedStart}${formattedEnd ? ` — ${formattedEnd}` : ""}`
    : "Time to be announced";

  return [
    `📅 **Date${event.startDate === event.endDate ? "" : "s"}:** ${dates}`,
    `🕒 **Time:** ${time} · ${cleanText(timezone, 80)}`,
    event.game ? `🎮 **Game:** ${cleanText(event.game, 120)}` : null,
    event.stage ? `🏆 **Stage:** ${cleanText(event.stage, 120)}` : null,
    event.region ? `🌍 **Region:** ${cleanText(event.region, 120)}` : null,
  ].filter(Boolean).join("\n");
}

/** Builds a Discord Components V2 event announcement. */
export function buildDiscordEventPayload(
  titlePrefix: "New Event" | "Event Updated",
  event: CalendarEvent,
) {
  const categoryUpper = event.category ? event.category.toUpperCase() : "EVENT";
  const orgName = event.orgName?.trim() || "Community Event";
  const directUrl = `${getSiteUrl()}/?event=${encodeURIComponent(event.id)}&date=${encodeURIComponent(event.startDate)}`;
  const description = cleanText(event.description || event.location?.note);
  const streamLinks = event.streamLinks
    .filter((stream) => stream.url?.trim())
    .slice(0, 3)
    .map((stream) => `[${cleanText(stream.label || "Watch stream", 40)}](${stream.url.trim()})`)
    .join(" · ");
  const intro = titlePrefix === "New Event"
    ? "A new competition has been added to Esports Calendar. Save the date and follow the event from its opening day."
    : "This event has been updated on Esports Calendar. Review the latest schedule and event information below.";
  const eventContent = [
    `## ${titlePrefix === "New Event" ? "New event on the calendar" : "Calendar event updated"}`,
    `# ${cleanText(event.name, 180)}`,
    `**${cleanText(orgName, 120)}** · ${categoryUpper}`,
    "",
    description || intro,
  ].join("\n");
  const detailsContent = [
    "### Event details",
    formatEventDetails(event),
    streamLinks ? `\n📡 **Broadcast:** ${streamLinks}` : null,
  ].filter(Boolean).join("\n");

  return {
    username: "Esports Calendar",
    avatar_url: getAvatarUrl(),
    allowed_mentions: { parse: [] },
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          {
            type: 12,
            items: [{
              media: { url: getBannerUrl() },
              description: "Esports Calendar",
            }],
          },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 9,
            components: [{ type: 10, content: eventContent }],
            accessory: event.orgLogoUrl
              ? {
                  type: 11,
                  media: { url: event.orgLogoUrl },
                  description: `${cleanText(orgName, 120)} logo`,
                }
              : {
                  type: 2,
                  style: 5,
                  label: "Open event",
                  url: directUrl,
                },
          },
          { type: 14, divider: true, spacing: 1 },
          { type: 10, content: detailsContent },
          {
            type: 1,
            components: [{
              type: 2,
              style: 5,
              label: "View event",
              url: directUrl,
              emoji: { name: "📅" },
            }],
          },
        ],
      },
    ],
  };
}

async function sendDiscordNotification(
  titlePrefix: "New Event" | "Event Updated",
  event: CalendarEvent,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Discord Webhook] DISCORD_WEBHOOK_URL not configured. Skipping webhook.");
    return;
  }

  try {
    const response = await fetch(getComponentsWebhookUrl(webhookUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDiscordEventPayload(titlePrefix, event)),
    });
    if (!response.ok) {
      console.error(`[Discord Webhook] Error ${response.status}: ${await response.text()}`);
      return;
    }
    console.log(`[Discord Webhook] ${titlePrefix.toLowerCase()} notice sent for: ${event.name}`);
  } catch (error) {
    console.error("[Discord Webhook] Failed to post webhook:", error);
  }
}

export async function sendDiscordCreateNotification(event: CalendarEvent): Promise<void> {
  return sendDiscordNotification("New Event", event);
}

export async function sendDiscordEditNotification(
  _oldEvent: CalendarEvent,
  newEvent: CalendarEvent,
): Promise<void> {
  return sendDiscordNotification("Event Updated", newEvent);
}
