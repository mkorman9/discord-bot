import 'dotenv/config';

const throwError = (message: string): never => {
  throw new Error(message);
};

export default {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || throwError('DISCORD_TOKEN needs to be present')
};
