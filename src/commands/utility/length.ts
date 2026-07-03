import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import axios from "axios";

interface LengthApiResponse {
  success: boolean;
  error?: string;
  length: number;
}

export default {
  data: new SlashCommandBuilder()
    .setName("length")
    .setDescription("Counts the length of your tags.")
    .addStringOption((option) =>
      option
        .setName("tags")
        .setDescription("The tags you want counted.")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const tags = interaction.options.getString("tags", true);

    const apiUrl = `https://tags.notnick.io/api/v1/length?tags=${encodeURIComponent(
      tags
    )}`;

    try {
      const response = await axios.get<LengthApiResponse>(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (!data.success) {
        return interaction.reply({
          content: `Error: ${data.error || "Something went wrong."}`,
          ephemeral: true,
        });
      }

      const length = data.length;
      return interaction.reply({
        content: `The length of your tags is **${length}** characters.`,
        ephemeral: false,
      });
    } catch (err) {
      return interaction.reply({
        content: "Something went wrong.",
        ephemeral: true,
      });
    }
  },
};
