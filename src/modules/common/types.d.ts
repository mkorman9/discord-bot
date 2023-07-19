import { CacheType, CommandInteraction, Message } from 'discord.js';

export type Awaitable<T> = T | PromiseLike<T>;

export type EventListenerFunc<E> = (event: E) => Awaitable<void>;

export interface ReadyEvent {}

export interface DirectMessageEvent {
  message: Message;
}

export interface GuildMessageEvent {
  message: Message;
}

export interface CronEvent {
  timestamp: Date;
}

export interface CommandEvent {
  interaction: CommandInteraction<CacheType>;
}

export interface EventArgs {
  ready: [event: ReadyEvent];
  directMessage: [event: DirectMessageEvent];
  guildMessage: [event: GuildMessageEvent];
  cron: [event: CronEvent];
  command: [event: CommandEvent];
}

export interface CronEventProps {
  runAt: string;
}

export interface CommandEventProps {
  name: string;
}

export interface EventProps {
  ready: void;
  directMessage: void;
  guildMessage: void;
  cron: CronEventProps;
  command: CommandEventProps;
}
