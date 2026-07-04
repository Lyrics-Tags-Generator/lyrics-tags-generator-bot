import { REST, Routes } from "discord.js";
import path from "node:path";
import fs from "node:fs";
import "dotenv/config";

import type { Command } from "../types";

// config.json is gitignored, so it is loaded at runtime instead of imported.
const { clientId } = require("../../config.json") as { clientId: string };

const isScriptFile = (file: string) =>
  (file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts");

const commands = [];
const foldersPath = path.join(__dirname, "../commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(isScriptFile);

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const imported = require(filePath);
    const command: Command = imported.default ?? imported;
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const rest = new REST().setToken(
  process.env.LYRICS_TAGS_GENERATOR_BOT_TOKEN as string
);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = (await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })) as unknown[];

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
