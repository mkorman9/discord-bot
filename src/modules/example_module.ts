import { SlashCommandBuilder } from 'discord.js';
import { declareModule } from '../common/module';

export default declareModule('example_module', m => {
  m.on('ready', () => {
    console.log('ready!');
  });

  m.on('guildMessage', message => {
    if (message.author.bot) {
      return;
    }

    message.reply(`hello from module: ${m.name}`);
  });

  m.cron('*/5 * * * * *', () => {
    console.log('Scheduled event');
  });

  m.command(
    new SlashCommandBuilder()
      .setName('hello')
      .setDescription('responds with hello'),
    interaction => {
      interaction.reply('Hello!');
    }
  );
});
