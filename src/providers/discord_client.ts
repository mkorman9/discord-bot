import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

// fix problem with missing "commands" property
declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, unknown>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel
  ]
});

client.commands = new Collection();

export default client;
