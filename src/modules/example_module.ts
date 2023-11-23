import { SlashCommandBuilder } from 'discord.js';
import { declareModule } from '../common/module';

export default declareModule('example_module', m => {
  m.on('load', () => {
    console.log('load');
  });

  m.on('unload', () => {
    console.log('unload');
  });

  m.on('ready', () => {
    console.log('ready');
  });

  m.on('guildMessage', async message => {
    if (message.author.bot) {
      return;
    }

    await message.reply(`hello from module: ${m.name}`);
  });

  m.cron('*/5 * * * * *', () => {
    console.log('scheduled event');
  });

  m.command(
    new SlashCommandBuilder()
      .setName('hello')
      .setDescription('responds with hello'),
    async interaction => {
      await interaction.reply('Hello!');
    }
  );
});
