const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Send feedback to help us improve.")
    .addStringOption((option) =>
      option
        .setName("feedback")
        .setDescription("Your feedback...")
        .setRequired(true)
    ),
  async execute(interaction) {
    const feedback = interaction.options.getString("feedback");
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (feedback.length > 500) {
      return interaction.reply({
        content: "Feedback must be 500 characters or less.",
        ephemeral: true,
      });
    }

    if (!webhookUrl) {
      return interaction.reply({
        content: "Webhook URL not configured.",
        ephemeral: true,
      });
    }

    try {
      await axios.post(webhookUrl, {
        content: `Feedback from **${interaction.user.tag}** (${interaction.user.id}):\n\n${feedback}`,
      });
      await interaction.reply({
        content: "Received. Thank you for your feedback!",
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: "Failed to send feedback.",
        ephemeral: true,
      });
    }
  },
};
