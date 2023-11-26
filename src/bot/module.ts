import {Client, CommandInteraction, Message, Partials, SlashCommandBuilder} from 'discord.js';
import {EventEmitter} from 'node:events';
import cron, {ScheduledTask} from 'node-cron';
import {Bot} from './bot';

type EmptyEvent = Record<string, never>;

export interface ModuleEvent {
  load: EmptyEvent;
  unload: EmptyEvent;
  ready: EmptyEvent;
  directMessage: Message;
  guildMessage: Message;
  command: CommandInteraction;
}

export type ModuleDeclaration = {
  name: string;
  load: (bot: Bot) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Module {
  on<E extends keyof ModuleEvent>(
    e: E,
    handler: (event: ModuleEvent[E]) => void | PromiseLike<void>
  ): this;
  once<E extends keyof ModuleEvent>(
    e: E,
    handler: (event: ModuleEvent[E]) => void | PromiseLike<void>
  ): this;
  off<E extends keyof ModuleEvent>(
    e: E,
    handler: (event: ModuleEvent[E]) => void | PromiseLike<void>
  ): this;
  emit<E extends keyof ModuleEvent>(
    e: E,
    event: ModuleEvent[E]
  ): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Module extends EventEmitter {
  private cronTasks: ScheduledTask[] = [];

  constructor(
    private moduleName: string,
    private bot: Bot
  ) {
    super();
  }

  async load() {
    try {
      await this.bot.loadModule(this.moduleName, this);
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

    try {
      this.bot.unloadModule(this.moduleName);
      console.log(`⬅️ Module ${this.moduleName} unloaded`);
    } catch (e) {
      console.log(`🚫 Failed to unload module ${this.moduleName}: ${e}`);
    }
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

  emitGlobally<E extends keyof ModuleEvent>(e: E, event: ModuleEvent[E]) {
    this.bot.emit(e, event);
  }

  cron(expression: string, handler: () => PromiseLike<void> | void) {
    const task = cron.schedule(
      expression,
      handler,
      {
        scheduled: false,
        runOnInit: false
      }
    );

    this.cronTasks.push(task);
  }

  command(
    command: SlashCommandBuilder,
    handler: (interaction: CommandInteraction) => PromiseLike<void> | void
  ): Module {
    this.bot.registerCommand(this.moduleName, command);

    this.on('command', interaction => {
      if (interaction.commandName === command.name) {
        handler(interaction);
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
