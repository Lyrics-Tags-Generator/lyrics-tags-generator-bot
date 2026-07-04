import type { ChatInputCommandInteraction } from "discord.js";

export const interactionError = async (
  interaction: ChatInputCommandInteraction,
  error: unknown,
): Promise<void> => {
  await interaction.reply("Something went wrong with the request.");
  console.error("Error:", error instanceof Error ? error.message : error);
};
