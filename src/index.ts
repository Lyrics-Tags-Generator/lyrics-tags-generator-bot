import { Client, Collection, GatewayIntentBits } from "discord.js";
import path from "node:path";
import fs from "node:fs";
import "dotenv/config";

import type { BotEvent, Command } from "./types";

// Matches compiled .js in production and .ts when running under tsx in dev.
const isScriptFile = (file: string) =>
  (file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(isScriptFile);

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const imported = require(filePath);
    const command: Command = imported.default ?? imported;
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(isScriptFile);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const imported = require(filePath);
  const event: BotEvent = imported.default ?? imported;

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...(args as never[])));
  } else {
    client.on(event.name, (...args) => event.execute(...(args as never[])));
  }
}

client.login(process.env.LYRICS_TAGS_GENERATOR_BOT_TOKEN);
