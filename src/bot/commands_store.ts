import {REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBuilder} from 'discord.js';
import config from '../config';

export class CommandsStore {
  private commandsPerModule = new Map<string, SlashCommandBuilder[]>();

  register(moduleName: string, command: SlashCommandBuilder) {
    const commandsList = this.commandsPerModule.get(moduleName);
    if (commandsList) {
      commandsList.push(command);
      return;
    }

    this.commandsPerModule.set(moduleName, [command]);
  }

  deleteForModule(moduleName: string) {
    this.commandsPerModule.delete(moduleName);
  }

  async updateRemote() {
    const payload: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    this.commandsPerModule.forEach(commands => {
      commands.forEach(c => payload.push(c.toJSON()));
    });

    const rest = new REST().setToken(config.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(config.DISCORD_APP_ID), { body: payload });
  }
}
