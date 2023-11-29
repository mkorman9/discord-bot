import {Client, Partials, SlashCommandBuilder} from 'discord.js';
import config from '../config';
import {Module, ModuleDeclaration} from './module';
import {CommandsStore} from './util/commands_store';

export class Bot {
  private discordClient: Client | undefined;
  private requestedIntents = new Set<number>();
  private requestedPartials = new Set<Partials>();
  private modules = new Map<string, Module>();
  private commandsStore = new CommandsStore();
  private started = false;
  private stopping = false;

  async start(moduleDeclarations: ModuleDeclaration[]) {
    const modules = moduleDeclarations
      .map(m => m(this))
      .filter(m => !config.IGNORED_MODULES.has(m.name()));

    this.discordClient = new Client({
      intents: [...this.requestedIntents],
      partials: [...this.requestedPartials]
    });

    await Promise.all(
      modules.map(m => m.load())
    );
    await this.discordClient.login(config.DISCORD_TOKEN);
    await this.commandsStore.updateRemote();

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
  }

  async loadModule(m: Module) {
    this.modules.set(m.name(), m);

    if (this.started) {
      await this.commandsStore.updateRemote();
    }
  }

  unloadModule(moduleName: string) {
    this.modules.delete(moduleName);
    this.commandsStore.deleteForModule(moduleName);

    if (!this.stopping) {
      this.commandsStore.updateRemote()
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
    this.commandsStore.register(moduleName, command);
  }

  requestIntents(intents: number[]) {
    intents.forEach(i => this.requestedIntents.add(i));
  }

  requestPartials(partials: Partials[]) {
    partials.forEach(p => this.requestedPartials.add(p));
  }
}
