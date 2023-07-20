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
  EventListenerFunc,
  EventProps,
  GuildMessageEvent,
  ReadyEvent
} from './types';
import { Client, SlashCommandBuilder } from 'discord.js';
import client from '../../providers/discord_client';

interface ListenersStore {
  onLoad: () => void;
  onUnload: () => void;
  add: <E extends keyof EventArgs>(
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) => void;
  call: <E extends keyof EventArgs>(...args: EventArgs[E]) => void;
}

class OnReadyListenersStore {
  private listeners: EventListenerFunc<ReadyEvent>[] = [];

  onLoad() {}

  onUnload() {}

  add<E extends keyof EventArgs>(
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const l = listener as EventListenerFunc<ReadyEvent>;
    this.listeners.push(l);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    this.listeners.forEach(l => l(args[0] as ReadyEvent));
  }
}

class OnDirectMessageListenersStore {
  private listeners: EventListenerFunc<DirectMessageEvent>[] = [];

  onLoad() {}

  onUnload() {}

  add<E extends keyof EventArgs>(
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const l = listener as EventListenerFunc<DirectMessageEvent>;
    this.listeners.push(l);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    this.listeners.forEach(l => l(args[0] as DirectMessageEvent));
  }
}

class OnGuildMessageListenersStore {
  private listeners: EventListenerFunc<GuildMessageEvent>[] = [];

  onLoad() {}

  onUnload() {}

  add<E extends keyof EventArgs>(
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const l = listener as EventListenerFunc<GuildMessageEvent>;
    this.listeners.push(l);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    this.listeners.forEach(l => l(args[0] as GuildMessageEvent));
  }
}

class OnCronListenersStore {
  private scheduledTasks: ScheduledTask[] = [];

  onLoad() {
    this.scheduledTasks.forEach(t => t.start());
  }

  onUnload() {
    this.scheduledTasks.forEach(t => t.stop());
  }

  add<E extends keyof EventArgs>(
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const l = listener as EventListenerFunc<CronEvent>;
    const cronProps = props as CronEventProps | undefined;

    if (!cronProps?.runAt) {
      throw new Error('runAt needs to specified when declaring cron listener');
    }

    const task = cron.schedule(
      cronProps.runAt,
      () => {
        l({
          timestamp: new Date()
        });
      },
      {
        scheduled: false,
        runOnInit: false
      }
    );

    this.scheduledTasks.push(task);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {}
}

class OnCommandListenersStore {
  private listeners = new Map<string, EventListenerFunc<CommandEvent>[]>();

  onLoad() {}

  onUnload() {}

  add<E extends keyof EventArgs>(
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const l = listener as EventListenerFunc<CommandEvent>;
    const commandProps = props as CommandEventProps | undefined;

    if (!commandProps?.name) {
      throw new Error('command name needs to specified when declaring command listener');
    }

    if (!this.listeners.has(commandProps.name)) {
      this.listeners.set(commandProps.name, []);
    }

    this.listeners.get(commandProps.name)?.push(l);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    const event = args[0] as CommandEvent;
    const listeners = this.listeners.get(event.interaction.commandName) || [];
    listeners.forEach(l => l(event));
  }
}

export class Module {
  private listeners = new Map<string, ListenersStore>();

  constructor(
    public name: string,
    public client: Client
  ) {
    this.listeners.set('ready', new OnReadyListenersStore());
    this.listeners.set('directMessage', new OnDirectMessageListenersStore());
    this.listeners.set('guildMessage', new OnGuildMessageListenersStore());
    this.listeners.set('cron', new OnCronListenersStore());
    this.listeners.set('command', new OnCommandListenersStore());
  }

  load() {
    globalContext.loadModule(this.name, this);
    this.listeners.forEach(l => l.onLoad());
  }

  unload() {
    globalContext.unloadModule(this.name);
    this.listeners.forEach(l => l.onUnload());
  }

  on<E extends keyof EventArgs>(
    event: E,
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined = undefined
  ): Module {
    this.listeners.get(event)?.add(listener, props);
    return this;
  }

  emit<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]) {
    globalContext.emit(event, ...args);
  }

  propagate<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]): Module {
    this.listeners.get(event)?.call(...args);
    return this;
  }

  registerCommand(builder: SlashCommandBuilder): Module {
    globalContext.registerCommand(builder);
    return this;
  }
}

export const declareModule = (moduleName: string, prepare: (m: Module) => void) => {
  const m = new Module(moduleName, client);
  prepare(m);
  m.load();
};
