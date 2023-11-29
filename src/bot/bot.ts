import {Client, Partials, SlashCommandBuilder} from 'discord.js';
import config from '../config';
import {Module, ModuleDeclaration} from './module';
import {CommandsStore} from './util/commands_store';
import {ClientInitializer} from './util/client_initializer';

export class Bot {
  private modules = new Map<string, Module>();
  private clientInitializer: ClientInitializer = new ClientInitializer();
  private commandsStore = new CommandsStore();

  private started = false;
  private stopping = false;

  async start(moduleDeclarations: ModuleDeclaration[]) {
    const modules = moduleDeclarations
      .map(m => m(this))
      .filter(m => !config.IGNORED_MODULES.has(m.name()));

    this.clientInitializer.init();
    await Promise.all(
      modules.map(m => m.load())
    );
    await this.clientInitializer.login();
    await this.commandsStore.updateRemote();

    this.started = true;
  }

  stop() {
    this.stopping = true;

    this.modules.forEach(m => m.unload());
    this.clientInitializer.destroy();

    this.stopping = false;
    this.started = false;
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
    return this.clientInitializer.get();
  }

  registerCommand(moduleName: string, command: SlashCommandBuilder) {
    this.commandsStore.register(moduleName, command);
  }

  requestIntents(intents: number[]) {
    this.clientInitializer.addIntents(intents);
  }

  requestPartials(partials: Partials[]) {
    this.clientInitializer.addPartials(partials);
  }
}
