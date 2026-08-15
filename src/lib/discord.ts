import { CalendarEvent } from "@/types/event";

const SITE_URL = "https://esportscalendar.org";
const DISCORD_DEFAULT_AVATAR_URL = "https://res.cloudinary.com/id8ciytn/image/upload/v1786622214/esports-calendar/discord/avatar-v2.png";
const DISCORD_DEFAULT_BANNER_URL = "https://res.cloudinary.com/id8ciytn/image/upload/v1786622216/esports-calendar/discord/banner-v2.jpg";

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, "");
}

function getAvatarUrl(): string {
  return process.env.DISCORD_AVATAR_URL || DISCORD_DEFAULT_AVATAR_URL;
}

function getBannerUrl(): string {
  return process.env.DISCORD_BANNER_URL || DISCORD_DEFAULT_BANNER_URL;
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
  const directUrl = `${getSiteUrl()}/?event=${encodeURIComponent(event.id)}&date=${encodeURIComponent(event.startDate)}`;
  const eventContent = [
    `## ${titlePrefix === "New Event" ? "Calendar event added" : "Calendar event updated"}`,
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
          accessory: {
            type: 11,
            media: { url: event.orgLogoUrl || getAvatarUrl() },
            description: event.orgLogoUrl ? "Event organization logo" : "Esports Calendar",
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

/**
 * Retrieves all configured Discord webhook URLs.
 * Supports comma-separated, semicolon-separated, or newline-separated URLs
 * from DISCORD_WEBHOOK_URL and DISCORD_WEBHOOK_URLS.
 */
function getWebhookUrls(): string[] {
  const envValues = [
    process.env.DISCORD_WEBHOOK_URL,
    process.env.DISCORD_WEBHOOK_URLS,
  ].filter(Boolean) as string[];

  if (envValues.length === 0) return [];

  const rawUrls = envValues
    .flatMap((val) => val.split(/[,;\n\r]+/))
    .map((url) => url.trim())
    .filter((url) => url.startsWith("http://") || url.startsWith("https://"));

  return Array.from(new Set(rawUrls));
}

/**
 * Broadcasts a webhook payload to all configured Discord webhook URLs concurrently.
 */
async function broadcastDiscordPayload(
  titlePrefix: "New Event" | "Event Updated",
  event: CalendarEvent,
): Promise<void> {
  const urls = getWebhookUrls();
  if (urls.length === 0) {
    console.log("[Discord Webhook] No DISCORD_WEBHOOK_URL configured. Skipping webhook.");
    return;
  }

  const payload = buildDiscordEventPayload(titlePrefix, event);

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const targetUrl = getComponentsWebhookUrl(url);
      const urlSnippet = url.length > 40 ? `${url.substring(0, 35)}...` : url;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Status ${res.status} (${urlSnippet}): ${errorText}`);
      }
      return urlSnippet;
    })
  );

  let successCount = 0;
  results.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      successCount++;
    } else {
      console.error(`[Discord Webhook] Failed sending ${titlePrefix} notice to webhook #${idx + 1}:`, result.reason);
    }
  });

  console.log(`[Discord Webhook] ${titlePrefix} notice sent for "${event.name}" to ${successCount}/${urls.length} webhook(s).`);
}

/**
 * Send Discord Webhook notification for a newly created event
 */
export async function sendDiscordCreateNotification(event: CalendarEvent): Promise<void> {
  return broadcastDiscordPayload("New Event", event);
}

/**
 * Send Discord Webhook notification when an event is edited
 */
export async function sendDiscordEditNotification(
  _oldEvent: CalendarEvent,
  newEvent: CalendarEvent,
): Promise<void> {
  return broadcastDiscordPayload("Event Updated", newEvent);
}
