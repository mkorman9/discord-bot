import {
  ChannelType,
  Client,
  Message,
  Partials,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import config from '../config';
import {Module, ModuleDeclaration} from './module';

export class Bot {
  private discordClient: Client | undefined;
  private requestedIntents = new Set<number>();
  private requestedPartials = new Set<Partials>();
  private modules = new Map<string, Module>();
  private commandsPerModule = new Map<string, SlashCommandBuilder[]>();
  private started = false;
  private stopping = false;

  async start(modules: ModuleDeclaration[]) {
    await Promise.all(
      modules
        .filter(m => !config.IGNORED_MODULES.has(m.name))
        .map(async m => await m.load(this))
    );

    this.discordClient = new Client({
      intents: [...this.requestedIntents],
      partials: [...this.requestedPartials]
    });

    this.modules.forEach(m => m._registerListeners());

    await this.discordClient.login(config.DISCORD_TOKEN);
    await this.updateCommandsList();

    this.started = true;
  }

  stop() {
    this.stopping = true;
    this.modules.forEach(m => m.unload());
    this.discordClient?.destroy();

    this.discordClient = undefined;
    this.requestedIntents = new Set();
    this.requestedPartials = new Set();
    this.started = false;
    this.stopping = false;

    console.log('⛔ Bot has been stopped');
  }

  async loadModule(moduleName: string, m: Module) {
    this.modules.set(moduleName, m);

    if (this.started) {
      await this.updateCommandsList();
    }
  }

  unloadModule(moduleName: string) {
    const m = this.modules.get(moduleName);

    this.modules.delete(moduleName);
    this.commandsPerModule.delete(moduleName);

    if (!this.stopping) {
      this.updateCommandsList()
        .catch(e => console.log(`🚫 Failed to unregister commands of module ${moduleName}: ${e.stack}`));
    }
  }

  client(): Client {
    if (!this.discordClient) {
      throw new Error('Client is undefined');
    }

    return this.discordClient;
  }

  registerCommand(moduleName: string, command: SlashCommandBuilder) {
    const commandsList = this.commandsPerModule.get(moduleName);
    if (commandsList) {
      commandsList.push(command);
      return;
    }

    this.commandsPerModule.set(moduleName, [command]);
  }

  requestIntents(intents: number[]) {
    intents.forEach(i => this.requestedIntents.add(i));
  }

  requestPartials(partials: Partials[]) {
    partials.forEach(p => this.requestedPartials.add(p));
  }

  private async updateCommandsList() {
    const payload: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    this.commandsPerModule.forEach((commands, _) => {
      commands.forEach(c => payload.push(c.toJSON()));
    });

    const rest = new REST().setToken(config.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(config.DISCORD_APP_ID), { body: payload });
  }
}
