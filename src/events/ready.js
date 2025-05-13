const { Events, PresenceUpdateStatus } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      await client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
      console.log(`Ready! Logged in as ${client.user.tag}.`);
    } catch (error) {
      console.error("Error setting status:", error);
    }
  },
};
