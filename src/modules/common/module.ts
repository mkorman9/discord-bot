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
  EventHandler,
  EventProps,
  GuildMessageEvent,
  ReadyEvent
} from './types';
import { Client, SlashCommandBuilder } from 'discord.js';
import client from '../../providers/discord_client';

interface EventListener {
  onLoad: () => void;
  onUnload: () => void;
  addHandler: <E extends keyof EventArgs>(
    handler: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) => void;
  call: <E extends keyof EventArgs>(...args: EventArgs[E]) => void;
}

class OnReadyListener implements EventListener {
  private handlers: EventHandler<ReadyEvent>[] = [];

  onLoad() {}

  onUnload() {}

  addHandler<E extends keyof EventArgs>(
    handler: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const h = handler as EventHandler<ReadyEvent>;
    this.handlers.push(h);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    this.handlers.forEach(h => h(args[0] as ReadyEvent));
  }
}

class OnDirectMessageListener implements EventListener {
  private handlers: EventHandler<DirectMessageEvent>[] = [];

  onLoad() {}

  onUnload() {}

  addHandler<E extends keyof EventArgs>(
    handler: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const h = handler as EventHandler<DirectMessageEvent>;
    this.handlers.push(h);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    this.handlers.forEach(h => h(args[0] as DirectMessageEvent));
  }
}

class OnGuildMessageListener implements EventListener {
  private handlers: EventHandler<GuildMessageEvent>[] = [];

  onLoad() {}

  onUnload() {}

  addHandler<E extends keyof EventArgs>(
    handler: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const h = handler as EventHandler<GuildMessageEvent>;
    this.handlers.push(h);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    this.handlers.forEach(h => h(args[0] as GuildMessageEvent));
  }
}

class OnCronListener implements EventListener {
  private scheduledTasks: ScheduledTask[] = [];

  onLoad() {
    this.scheduledTasks.forEach(t => t.start());
  }

  onUnload() {
    this.scheduledTasks.forEach(t => t.stop());
  }

  addHandler<E extends keyof EventArgs>(
    handler: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const h = handler as EventHandler<CronEvent>;
    const cronProps = props as CronEventProps | undefined;

    if (!cronProps?.runAt) {
      throw new Error('runAt needs to specified when declaring cron handler');
    }

    const task = cron.schedule(
      cronProps.runAt,
      () => {
        h({
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

class OnCommandListener implements EventListener {
  private handlers = new Map<string, EventHandler<CommandEvent>[]>();

  onLoad() {}

  onUnload() {}

  addHandler<E extends keyof EventArgs>(
    handler: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined
  ) {
    const h = handler as EventHandler<CommandEvent>;
    const commandProps = props as CommandEventProps | undefined;

    if (!commandProps?.name) {
      throw new Error('command name needs to specified when declaring command handler');
    }

    if (!this.handlers.has(commandProps.name)) {
      this.handlers.set(commandProps.name, []);
    }

    this.handlers.get(commandProps.name)?.push(h);
  }

  call<E extends keyof EventArgs>(...args: EventArgs[E]) {
    const event = args[0] as CommandEvent;
    const listeners = this.handlers.get(event.interaction.commandName) || [];
    listeners.forEach(h => h(event));
  }
}

export class Module {
  private listeners = new Map<string, EventListener>();

  constructor(
    public name: string,
    public client: Client
  ) {
    this.listeners.set('ready', new OnReadyListener());
    this.listeners.set('directMessage', new OnDirectMessageListener());
    this.listeners.set('guildMessage', new OnGuildMessageListener());
    this.listeners.set('cron', new OnCronListener());
    this.listeners.set('command', new OnCommandListener());
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
    this.listeners.get(event)?.addHandler(listener, props);
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
