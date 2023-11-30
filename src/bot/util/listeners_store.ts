import {Awaitable, Client, ClientEvents} from 'discord.js';

type ListenerAction = (client: Client) => void;

export class ListenersStore {
  private toRegister: ListenerAction[] = [];
  private toUnregister: ListenerAction[] = [];

  register(client: Client) {
    this.toRegister.forEach(a => a(client));
  }

  unregister(client: Client) {
    this.toUnregister.forEach(a => a(client));
  }

  on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>) {
    this.toRegister.push(client => client.on(event, listener));
    this.toUnregister.push(client => client.off(event, listener));
  }

  once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>) {
    this.toRegister.push(client => client.once(event, listener));
    this.toUnregister.push(client => client.off(event, listener));
  }
}
