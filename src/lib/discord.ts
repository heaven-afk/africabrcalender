import { CalendarEvent } from "@/types/event";

function getCategoryColor(category: string): number {
  switch (category) {
    case "ranking":
      return 0xe8a33d; // Amber/Gold #E8A33D
    case "tournament":
      return 0x06b6d4; // Cyan #06B6D4
    case "scrim":
      return 0x10b981; // Emerald #10B981
    default:
      return 0xe8a33d;
  }
}

/**
 * Send Discord Webhook Embed notification for a newly created event
 */
export async function sendDiscordCreateNotification(event: CalendarEvent): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Discord Webhook] DISCORD_WEBHOOK_URL not configured. Skipping webhook.");
    return;
  }

  const categoryUpper = event.category.toUpperCase();
  const dateRange =
    event.category === "scrim" && event.recurrence
      ? `${event.startDate} to ${event.endDate} (${event.recurrence.startTime} - ${event.recurrence.endTime} ${event.recurrence.timezone})`
      : `${event.startDate} to ${event.endDate}`;

  const fields = [
    { name: "🏆 Organization", value: event.orgName || "N/A", inline: true },
    { name: "🏷️ Category", value: `**${categoryUpper}**`, inline: true },
    { name: "📅 Schedule / Dates", value: dateRange, inline: false },
  ];

  if (event.stage) {
    fields.push({ name: "⚡ Stage / Phase", value: event.stage, inline: true });
  }

  if (event.region) {
    fields.push({ name: "🌍 Region", value: event.region, inline: true });
  }

  if (event.streamLinks && event.streamLinks.length > 0) {
    const streams = event.streamLinks
      .map((s) => `• [${s.label || "Watch Stream"}](${s.url})`)
      .join("\n");
    fields.push({ name: "📺 Broadcast Streams", value: streams, inline: false });
  }

  if (event.location?.discordUrl || event.location?.websiteUrl) {
    const links = [];
    if (event.location.discordUrl) links.push(`[Discord Server](${event.location.discordUrl})`);
    if (event.location.websiteUrl) links.push(`[Official Website](${event.location.websiteUrl})`);
    fields.push({ name: "🔗 Community Links", value: links.join(" • "), inline: false });
  }

  const embed = {
    title: `📢 New Event Scheduled: ${event.name}`,
    description: `A new **${event.category}** event has been listed on the Africa BR Calendar!`,
    color: getCategoryColor(event.category),
    fields: fields,
    thumbnail: event.orgLogoUrl ? { url: event.orgLogoUrl } : undefined,
    footer: {
      text: "Africa BR Calendar • Powered by Nova Technologies",
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log(`[Discord Webhook] Sent create notification for event: ${event.name}`);
  } catch (error) {
    console.error("[Discord Webhook] Failed to post webhook:", error);
  }
}

/**
 * Send Discord Webhook Embed notification when an existing event is edited
 */
export async function sendDiscordEditNotification(
  oldEvent: CalendarEvent,
  newEvent: CalendarEvent
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Discord Webhook] DISCORD_WEBHOOK_URL not configured. Skipping webhook.");
    return;
  }

  const changes: string[] = [];

  if (oldEvent.name !== newEvent.name) {
    changes.push(`• **Title**: ${oldEvent.name} ➔ **${newEvent.name}**`);
  }
  if (oldEvent.category !== newEvent.category) {
    changes.push(`• **Category**: ${oldEvent.category} ➔ **${newEvent.category}**`);
  }
  if (oldEvent.stage !== newEvent.stage) {
    changes.push(`• **Stage**: ${oldEvent.stage || "None"} ➔ **${newEvent.stage || "None"}**`);
  }
  if (oldEvent.startDate !== newEvent.startDate || oldEvent.endDate !== newEvent.endDate) {
    changes.push(
      `• **Dates**: ${oldEvent.startDate} - ${oldEvent.endDate} ➔ **${newEvent.startDate} - ${newEvent.endDate}**`
    );
  }

  if (oldEvent.category === "scrim" && newEvent.category === "scrim" && newEvent.recurrence) {
    const oldRec = oldEvent.recurrence;
    const newRec = newEvent.recurrence;
    if (
      oldRec?.startTime !== newRec.startTime ||
      oldRec?.endTime !== newRec.endTime ||
      oldRec?.timezone !== newRec.timezone
    ) {
      changes.push(
        `• **Scrim Hours**: ${oldRec?.startTime}-${oldRec?.endTime} (${oldRec?.timezone}) ➔ **${newRec.startTime}-${newRec.endTime} (${newRec.timezone})**`
      );
    }
  }

  // If no significant fields changed, don't spam webhook
  if (changes.length === 0) {
    changes.push("• Event details updated.");
  }

  const embed = {
    title: `✏️ Event Updated: ${newEvent.name}`,
    description: `Updates made to **${newEvent.name}**:\n\n${changes.join("\n")}`,
    color: getCategoryColor(newEvent.category),
    fields: [
      { name: "🏆 Organization", value: newEvent.orgName, inline: true },
      { name: "🏷️ Category", value: newEvent.category.toUpperCase(), inline: true },
      {
        name: "📅 Active Range",
        value: `${newEvent.startDate} to ${newEvent.endDate}`,
        inline: false,
      },
    ],
    thumbnail: newEvent.orgLogoUrl ? { url: newEvent.orgLogoUrl } : undefined,
    footer: {
      text: "Africa BR Calendar • Edited Event Notice",
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log(`[Discord Webhook] Sent edit notification for event: ${newEvent.name}`);
  } catch (error) {
    console.error("[Discord Webhook] Failed to post edit webhook:", error);
  }
}
