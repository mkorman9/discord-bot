import { CacheType, Client, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { EventEmitter } from 'events';
import cron, { ScheduledTask } from 'node-cron';
import client from '../../providers/discord_client';
import globalContext from './global_context';
import { Event } from './events';

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
    handler: (interaction: CommandInteraction<CacheType>) => PromiseLike<void> | void
  ): Module {
    globalContext.registerCommand(command);

    this.on('command', interaction => {
      if (interaction.commandName === command.name) {
        handler(interaction);
      }
    });

    return this;
  }
}

export const declareModule = (moduleName: string, prepare: (m: Module) => void) => {
  const m = new Module(moduleName, client);
  prepare(m);
  m.load();
};
