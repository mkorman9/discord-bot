import {Client, GatewayIntentBits, Partials} from 'discord.js';

export const createClient = () => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
  });
};
