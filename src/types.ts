import type {
  ChatInputCommandInteraction,
  Collection,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export interface Command {
  data: {
    name: string;
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  execute(interaction: ChatInputCommandInteraction): Promise<unknown>;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute(...args: never[]): Promise<unknown> | unknown;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}
