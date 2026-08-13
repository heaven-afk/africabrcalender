import { CalendarEvent } from "@/types/event";

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    return vercelUrl.replace(/\/$/, "");
  }
  return "https://africa-br-calendar.vercel.app";
}

function getBannerUrl(): string {
  if (process.env.DISCORD_BANNER_URL) {
    return process.env.DISCORD_BANNER_URL;
  }
  if (process.env.NEXT_PUBLIC_SITE_BANNER_URL) {
    return process.env.NEXT_PUBLIC_SITE_BANNER_URL;
  }
  return `${getSiteUrl()}/og.png`;
}

function getAvatarUrl(): string {
  if (process.env.DISCORD_AVATAR_URL) {
    return process.env.DISCORD_AVATAR_URL;
  }
  return `${getSiteUrl()}/favicon.png`;
}

/**
 * Builds a Discord Components V2 Container payload for an event notification
 */
function buildComponentsV2Payload(
  titlePrefix: "New Event" | "Event Updated",
  event: CalendarEvent
) {
  const categoryUpper = event.category ? event.category.toUpperCase() : "EVENT";
  const orgName = event.orgName?.trim() || "Community Event";
  const dateRange = `${event.startDate} to ${event.endDate}`;
  const directUrl = `${getSiteUrl()}/?event=${encodeURIComponent(event.id)}`;

  const textContent = `**${titlePrefix}: ${event.name}**\n${orgName} • ${categoryUpper}\n${dateRange}`;

  return {
    username: "Africa BR Calendar",
    avatar_url: getAvatarUrl(),
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        components: [
          {
            type: 12, // Media Gallery
            items: [
              {
                media: {
                  url: getBannerUrl(),
                },
              },
            ],
          },
          {
            type: 14, // Separator
            divider: true,
            spacing: 1,
          },
          {
            type: 10, // Text Display
            content: textContent,
          },
          {
            type: 1, // Action Row
            components: [
              {
                type: 2, // Button
                style: 5, // Link Button
                label: "View Event",
                url: directUrl,
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Send Discord Webhook notification using Components V2 Container format for a newly created event
 */
export async function sendDiscordCreateNotification(event: CalendarEvent): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Discord Webhook] DISCORD_WEBHOOK_URL not configured. Skipping webhook.");
    return;
  }

  const payload = buildComponentsV2Payload("New Event", event);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Discord Webhook] Error ${res.status}: ${errorText}`);
      return;
    }

    console.log(`[Discord Webhook] Components V2 create notice sent for: ${event.name}`);
  } catch (error) {
    console.error("[Discord Webhook] Failed to post webhook:", error);
  }
}

/**
 * Send Discord Webhook notification using Components V2 Container format when an event is edited
 */
export async function sendDiscordEditNotification(
  _oldEvent: CalendarEvent,
  newEvent: CalendarEvent
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Discord Webhook] DISCORD_WEBHOOK_URL not configured. Skipping webhook.");
    return;
  }

  const payload = buildComponentsV2Payload("Event Updated", newEvent);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Discord Webhook] Error ${res.status}: ${errorText}`);
      return;
    }

    console.log(`[Discord Webhook] Components V2 edit notice sent for: ${newEvent.name}`);
  } catch (error) {
    console.error("[Discord Webhook] Failed to post edit webhook:", error);
  }
}
