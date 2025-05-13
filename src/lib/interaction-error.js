const interactionError = async (interaction, error) => {
  await interaction.reply("Something went wrong with the request.");
  console.error("Error:", error.message);
};

module.exports = {
  interactionError,
};
