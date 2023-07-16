import { Client, GatewayIntentBits, Partials } from 'discord.js';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.DirectMessages
];

const partials = [
  Partials.Channel
];

export default new Client({
  intents,
  partials
});
