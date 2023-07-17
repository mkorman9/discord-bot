import globalContext from './global_context';
import {
  Awaitable,
  CronEvent,
  DirectMessageEvent,
  EventArgs,
  EventProps,
  GuildMessageEvent,
  ReadyEvent
} from './types';

export class Module {
  private readyListeners: Array<(event: ReadyEvent) => Awaitable<void>> = [];
  private directMessageListeners: Array<(event: DirectMessageEvent) => Awaitable<void>> = [];
  private guildMessageListeners: Array<(event: GuildMessageEvent) => Awaitable<void>> = [];

  constructor(public name: string) {}

  unload() {
    globalContext.unloadModule(this.name);
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
      this.onCron(listener as (event: CronEvent) => Awaitable<void>, props?.runAt);
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
    }

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
}

export const declareModule = (moduleName: string, handler: (m: Module) => void) => {
  const m = new Module(moduleName);
  globalContext.loadModule(moduleName, m);
  handler(m);
};
