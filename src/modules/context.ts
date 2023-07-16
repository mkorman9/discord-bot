export type Awaitable<T> = T | PromiseLike<T>;

export interface DirectMessageEvent {
  message: string;
}

export interface GuildMessageEvent {
  message: string;
  guidId: string;
}

export interface CronEvent {}

export interface EventArgs {
  directMessage: [event: DirectMessageEvent];
  guildMessage: [event: GuildMessageEvent];
  cron: [event: CronEvent];
}

export interface EventProps {
  directMessage: void;
  guildMessage: void;
  cron: {
    runAt: string;
  };
}

class Context {
  constructor(
    private directMessageListeners: Array<(event: DirectMessageEvent) => Awaitable<void>> = [],
    private guildMessageListeners: Array<(event: GuildMessageEvent) => Awaitable<void>> = []
  ) {}

  on<E extends keyof EventArgs>(
    event: E,
    listener: (...args: EventArgs[E]) => Awaitable<void>,
    props: EventProps[E] | null = null
  ): Context {
    if (event === 'directMessage') {
      this.directMessageListeners.push(listener as (event: DirectMessageEvent) => Awaitable<void>);
    } else if (event === 'guildMessage') {
      this.guildMessageListeners.push(listener as (event: GuildMessageEvent) => Awaitable<void>);
    } else if (event === 'cron') {
      if (!props?.runAt) {
        throw new Error('runAt needs to specified when declaring cron listener');
      }

      this.scheduleCron(listener as (event: CronEvent) => Awaitable<void>, props.runAt);
    }

    return this;
  }

  emit<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]): Context {
    if (event === 'directMessage') {
      this.directMessageListeners.forEach(l => l(args[0] as DirectMessageEvent));
    } else if (event === 'guildMessage') {
      this.guildMessageListeners.forEach(l => l(args[0] as GuildMessageEvent));
    }

    return this;
  }

  private scheduleCron(listener: (event: CronEvent) => Awaitable<void>, runAt: string) {
    console.log(`Declaring cron ${listener} to run at ${runAt}`);
  }
}

export default new Context();
