import {Client, CommandInteraction, SlashCommandBuilder} from 'discord.js';
import {EventEmitter} from 'events';
import cron, {ScheduledTask} from 'node-cron';
import client from './discord_client';
import globalContext from './global_context';
import {Event} from './events';

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

  constructor(
    public name: string,
    public client: Client
  ) {
    super();
  }

  load() {
    globalContext.loadModule(this.name, this);
    this.cronTasks.forEach(t => t.start());
  }

  unload() {
    globalContext.unloadModule(this.name);
    this.cronTasks.forEach(t => t.stop());
  }

  emitGlobally<E extends keyof Event>(e: E, event: Event[E]) {
    globalContext.emit(e, event);
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
    globalContext.registerCommand(this.name, command);

    this.on('command', interaction => {
      if (interaction.commandName === command.name) {
        handler(interaction);
      }
    });

    return this;
  }
}

export const declareModule = (moduleName: string, func: (m: Module) => void) => {
  const m = new Module(moduleName, client);
  func(m);
  m.load();
};
