import { Client, Events, PresenceUpdateStatus } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    try {
      await client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
      console.log(`Ready! Logged in as ${client.user.tag}.`);
    } catch (error) {
      console.error("Error setting status:", error);
    }
  },
};
