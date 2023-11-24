import {Client, CommandInteraction, Partials, SlashCommandBuilder} from 'discord.js';
import {EventEmitter} from 'node:events';
import cron, {ScheduledTask} from 'node-cron';
import {ModuleLoader} from './module_loader';
import {ModuleEvent} from './module_events';

export type ModuleDefinition = {
  name: string;
  load: (loader: ModuleLoader) => Promise<void>;
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
    private loader: ModuleLoader
  ) {
    super();
  }

  async load() {
    try {
      await this.loader.loadModule(this.moduleName, this);
      console.log(`➡️ Module ${this.moduleName} loaded`);
    } catch (e) {
      console.log(`🚫 Failed to load module ${this.moduleName}: ${e}`);
    }

    this.cronTasks.forEach(t => t.start());
  }

  unload() {
    this.cronTasks.forEach(t => t.stop());

    try {
      this.loader.unloadModule(this.moduleName);
      console.log(`⬅️ Module ${this.moduleName} unloaded`);
    } catch (e) {
      console.log(`🚫 Failed to unload module ${this.moduleName}: ${e}`);
    }
  }

  name(): string {
    return this.moduleName;
  }

  client(): Client {
    return this.loader.client();
  }

  intents(...intents: number[]) {
    this.loader.requestIntents(intents);
  }

  partials(...partials: Partials[]) {
    this.loader.requestPartials(partials);
  }

  emitGlobally<E extends keyof ModuleEvent>(e: E, event: ModuleEvent[E]) {
    this.loader.emit(e, event);
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
    this.loader.registerCommand(this.moduleName, command);

    this.on('command', interaction => {
      if (interaction.commandName === command.name) {
        handler(interaction);
      }
    });

    return this;
  }
}

export const declareModule = (moduleName: string, func: (m: Module) => void): ModuleDefinition => {
  return {
    name: moduleName,
    load: async (loader: ModuleLoader) => {
      const m = new Module(moduleName, loader);
      func(m);
      await m.load();
    }
  };
};
