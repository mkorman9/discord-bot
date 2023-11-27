import {Awaitable, Client, ClientEvents, CommandInteraction, Partials, SlashCommandBuilder} from 'discord.js';
import cron, {ScheduledTask} from 'node-cron';
import {Bot} from './bot';

export type ModuleDeclaration = {
  name: string;
  load: (bot: Bot) => Promise<void>;
};

export class Module {
  private cronTasks: ScheduledTask[] = [];
  private listenersToRegister: (() => void)[] = [];
  private listenersToUnregister: (() => void)[] = [];

  constructor(
    private moduleName: string,
    private bot: Bot
  ) {
  }

  async load() {
    try {
      await this.bot.loadModule(this);
      console.log(`➡️ Module ${this.moduleName} loaded`);
    } catch (e) {
      console.log(`🚫 Failed to load module ${this.moduleName}: ${e}`);
    }

    this.on('ready', () => {
      this.cronTasks.forEach(t => t.start());
    });
  }

  unload() {
    this.cronTasks.forEach(t => t.stop());
    this.listenersToUnregister.forEach(l => l());

    try {
      this.bot.unloadModule(this.moduleName);
      console.log(`⬅️ Module ${this.moduleName} unloaded`);
    } catch (e) {
      console.log(`🚫 Failed to unload module ${this.moduleName}: ${e}`);
    }
  }

  _registerListeners() {
    this.listenersToRegister.forEach(l => l());
    this.listenersToRegister = [];
  }

  name(): string {
    return this.moduleName;
  }

  client(): Client {
    return this.bot.client();
  }

  intents(...intents: number[]) {
    this.bot.requestIntents(intents);
  }

  partials(...partials: Partials[]) {
    this.bot.requestPartials(partials);
  }

  on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>) {
    this.listenersToRegister.push(() => this.bot.client().on(event, listener));
    this.listenersToUnregister.push(() => this.off(event, listener));
  }

  once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>) {
    this.listenersToRegister.push(() => this.bot.client().once(event, listener));
    this.listenersToUnregister.push(() => this.off(event, listener));
  }

  off<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>) {
    this.bot.client().off(event, listener);
  }

  emit<E extends keyof ClientEvents>(event: E, ...args: ClientEvents[E]) {
    this.bot.client().emit(event, ...args);
  }

  cron(expression: string, listener: () => Awaitable<void>) {
    const task = cron.schedule(
      expression,
      listener,
      {
        scheduled: false,
        runOnInit: false
      }
    );

    this.cronTasks.push(task);
  }

  command(
    command: SlashCommandBuilder,
    listener: (interaction: CommandInteraction) => Awaitable<void>
  ): this {
    this.bot.registerCommand(this.moduleName, command);

    this.on('interactionCreate', interaction => {
      if (interaction.isCommand() && interaction.commandName === command.name) {
        listener(interaction);
      }
    });

    return this;
  }
}

export const declareModule = (moduleName: string, func: (m: Module) => void): ModuleDeclaration => {
  return {
    name: moduleName,
    load: async (bot: Bot) => {
      const m = new Module(moduleName, bot);
      func(m);
      await m.load();
    }
  };
};
