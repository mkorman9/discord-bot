export type Awaitable<T> = T | PromiseLike<T>;

export interface ReadyEvent {}

export interface DirectMessageEvent {
  message: string;
}

export interface GuildMessageEvent {
  message: string;
  guildId: string;
}

export interface CronEvent {}

export interface EventArgs {
  ready: [event: ReadyEvent];
  directMessage: [event: DirectMessageEvent];
  guildMessage: [event: GuildMessageEvent];
  cron: [event: CronEvent];
}

export interface EventProps {
  ready: void;
  directMessage: void;
  guildMessage: void;
  cron: {
    runAt: string;
  };
}

class Context {
  constructor(
    private readyListeners: Array<(event: ReadyEvent) => Awaitable<void>> = [],
    private directMessageListeners: Array<(event: DirectMessageEvent) => Awaitable<void>> = [],
    private guildMessageListeners: Array<(event: GuildMessageEvent) => Awaitable<void>> = []
  ) {}

  on<E extends keyof EventArgs>(
    event: E,
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | undefined = undefined
  ): Context {
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

  emit<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]): Context {
    if (event === 'ready') {
      this.emitReady(args[0] as ReadyEvent);
    } else if (event === 'directMessage') {
      this.emitDirectMessage(args[0] as DirectMessageEvent);
    } else if (event === 'guildMessage') {
      this.emitGuildMessage(args[0] as GuildMessageEvent);
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
    
    console.log(`Declaring cron ${listener} to run at ${runAt}`);
  }

  private emitReady(event: ReadyEvent) {
    this.readyListeners.forEach(l => l(event));
  }

  private emitDirectMessage(event: DirectMessageEvent) {
    this.directMessageListeners.forEach(l => l(event));
  }

  private emitGuildMessage(event: GuildMessageEvent) {
    this.guildMessageListeners.forEach(l => l(event));
  }
}

export default new Context();
