import { CalendarEvent } from "@/types/event";

const SITE_URL = "https://esportscalendar.org";
const DISCORD_DEFAULT_AVATAR_URL = "https://res.cloudinary.com/id8ciytn/image/upload/v1786622214/esports-calendar/discord/avatar-v2.png";

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, "");
}
function getAvatarUrl(): string {
  return process.env.DISCORD_AVATAR_URL || DISCORD_DEFAULT_AVATAR_URL;
}

function getComponentsWebhookUrl(webhookUrl: string): string {
  const url = new URL(webhookUrl);
  url.searchParams.set("with_components", "true");
  return url.toString();
}

function cleanText(value: string | null | undefined, maxLength = 180): string {
  return (value || "").replace(/@/g, "@\u200b").trim().slice(0, maxLength);
}

/** Builds a deliberately brief Discord teaser that sends readers to the website. */
export function buildDiscordEventPayload(
  titlePrefix: "New Event" | "Event Updated",
  event: CalendarEvent,
) {
  const orgName = cleanText(event.orgName, 120) || "Community Event";
  const directUrl = `${getSiteUrl()}/?event=${encodeURIComponent(event.id)}&date=${encodeURIComponent(event.startDate)}`;
  const eventContent = [
    `## ${titlePrefix === "New Event" ? "New event added" : "Event updated"}`,
    `# ${cleanText(event.name)}`,
    `**${orgName}**`,
    event.game ? `🎮 **Game:** ${cleanText(event.game, 100)}` : null,
    event.region ? `🌍 **Region:** ${cleanText(event.region, 100)}` : null,
  ].filter(Boolean).join("\n");

  return {
    username: "Esports Calendar",
    avatar_url: getAvatarUrl(),
    allowed_mentions: { parse: [] },
    flags: 32768,
    components: [{
      type: 17,
      components: [
        {
          type: 9,
          components: [{ type: 10, content: eventContent }],
          accessory: {
            type: 11,
            media: { url: event.orgLogoUrl || getAvatarUrl() },
            description: event.orgLogoUrl ? `${orgName} logo` : "Esports Calendar",
          },
        },
        { type: 14, divider: true, spacing: 1 },
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
    }],
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
