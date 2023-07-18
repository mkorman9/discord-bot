import cron, { ScheduledTask } from 'node-cron';
import globalContext from './global_context';
import {
  Awaitable,
  CommandEvent,
  CommandEventProps,
  CronEvent,
  CronEventProps,
  DirectMessageEvent,
  EventArgs,
  EventProps,
  GuildMessageEvent,
  ReadyEvent
} from './types';
import { SlashCommandBuilder } from 'discord.js';

export class Module {
  private readyListeners: Array<(event: ReadyEvent) => Awaitable<void>> = [];
  private directMessageListeners: Array<(event: DirectMessageEvent) => Awaitable<void>> = [];
  private guildMessageListeners: Array<(event: GuildMessageEvent) => Awaitable<void>> = [];
  private scheduledTasks: Array<ScheduledTask> = [];
  private commandListeners = new Map<string, Array<(event: CommandEvent) => Awaitable<void>>>();

  constructor(public name: string) {}

  load() {
    globalContext.loadModule(this.name, this);
    this.scheduledTasks.forEach(t => t.start());
  }

  unload() {
    globalContext.unloadModule(this.name);
    this.scheduledTasks.forEach(t => t.stop());
  }

  on<E extends keyof EventArgs>(
    event: E,
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined = undefined
  ): Module {
    if (event === 'ready') {
      this.onReady(listener as (event: ReadyEvent) => Awaitable<void>);
    } else if (event === 'directMessage') {
      this.onDirectMessage(listener as (event: DirectMessageEvent) => Awaitable<void>);
    } else if (event === 'guildMessage') {
      this.onGuildMessage(listener as (event: GuildMessageEvent) => Awaitable<void>);
    } else if (event === 'cron') {
      const cronProps = props as (CronEventProps | undefined);
      this.onCron(listener as (event: CronEvent) => Awaitable<void>, cronProps?.runAt);
    } else if (event === 'command') {
      const commandProps = props as (CommandEventProps | undefined);
      this.onCommand(listener as (event: CommandEvent) => Awaitable<void>, commandProps?.name);
    }

    return this;
  }

  emit<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]) {
    globalContext.emit(event, ...args);
  }

  propagate<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]): Module {
    if (event === 'ready') {
      this.propagateReady(args[0] as ReadyEvent);
    } else if (event === 'directMessage') {
      this.propagateDirectMessage(args[0] as DirectMessageEvent);
    } else if (event === 'guildMessage') {
      this.propagateGuildMessage(args[0] as GuildMessageEvent);
    } else if (event === 'command') {
      this.propagateCommand(args[0] as CommandEvent);
    }

    return this;
  }

  registerCommand(builder: SlashCommandBuilder): Module {
    globalContext.registerCommand(builder);
    return this;
  }

  private onReady(listener: (event: ReadyEvent) => Awaitable<void>) {
    this.readyListeners.push(listener);
  }

  private onDirectMessage(listener: (event: DirectMessageEvent) => Awaitable<void>) {
    this.directMessageListeners.push(listener);
  }

  private onGuildMessage(listener: (event: GuildMessageEvent) => Awaitable<void>) {
    this.guildMessageListeners.push(listener);
  }

  private onCron(listener: (event: CronEvent) => Awaitable<void>, runAt?: string) {
    if (!runAt) {
      throw new Error('runAt needs to specified when declaring cron listener');
    }

    const task = cron.schedule(
      runAt,
      () => {
        listener({
          timestamp: new Date()
        });
      },
      {
        scheduled: false
      }
    );

    this.scheduledTasks.push(task);
  }

  private onCommand(listener: (event: CommandEvent) => Awaitable<void>, name? :string) {
    if (!name) {
      throw new Error('command name needs to specified when declaring command listener');
    }

    if (!this.commandListeners.has(name)) {
      this.commandListeners.set(name, []);
    }

    this.commandListeners.get(name)?.push(listener);
  }

  private propagateReady(event: ReadyEvent) {
    this.readyListeners.forEach(l => l(event));
  }

  private propagateDirectMessage(event: DirectMessageEvent) {
    this.directMessageListeners.forEach(l => l(event));
  }

  private propagateGuildMessage(event: GuildMessageEvent) {
    this.guildMessageListeners.forEach(l => l(event));
  }

  private propagateCommand(event: CommandEvent) {
    const listeners = this.commandListeners.get(event.interaction.commandName) || [];
    listeners.forEach(l => l(event));
  }
}

export const declareModule = (moduleName: string, prepare: (m: Module) => void) => {
  const m = new Module(moduleName);
  prepare(m);
  m.load();
};
