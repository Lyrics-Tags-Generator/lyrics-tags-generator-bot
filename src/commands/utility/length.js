const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("length")
    .setDescription("Counts the length of your tags.")
    .addStringOption((option) =>
      option
        .setName("tags")
        .setDescription("The tags you want counted.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const tags = interaction.options.getString("tags");

    const apiUrl = `https://tags.notnick.io/api/length?tags=${encodeURIComponent(
      tags
    )}`;

    try {
      const response = await axios.get(apiUrl, {
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
