import {Client, CommandInteraction, SlashCommandBuilder} from 'discord.js';
import {EventEmitter} from 'events';
import cron, {ScheduledTask} from 'node-cron';
import {ModuleLoader} from './module_loader';
import {Event} from './events';

export type ModuleDefinition = {
  name: string;
  load: (loader: ModuleLoader) => void;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Module {
  on<E extends keyof Event>(
    e: E,
    handler: (event: Event[E]) => void | PromiseLike<void>
  ): this;
  once<E extends keyof Event>(
    e: E,
    handler: (event: Event[E]) => void | PromiseLike<void>
  ): this;
  off<E extends keyof Event>(
    e: E,
    handler: (event: Event[E]) => void | PromiseLike<void>
  ): this;
  emit<E extends keyof Event>(
    e: E,
    event: Event[E]
  ): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Module extends EventEmitter {
  private cronTasks: ScheduledTask[] = [];
  protected client: Client;

  constructor(
    public name: string,
    protected loader: ModuleLoader
  ) {
    super();
    this.client = loader.client;
  }

  load() {
    console.log(`Module ${this.name} loaded`);

    this.loader.loadModule(this.name, this);
    this.cronTasks.forEach(t => t.start());
  }

  unload() {
    console.log(`Module ${this.name} unloaded`);

    this.loader.unloadModule(this.name);
    this.cronTasks.forEach(t => t.stop());
  }

  emitGlobally<E extends keyof Event>(e: E, event: Event[E]) {
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
    this.loader.registerCommand(this.name, command);

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
    load: (loader: ModuleLoader) => {
      const m = new Module(moduleName, loader);
      func(m);
      m.load();
    }
  };
};
