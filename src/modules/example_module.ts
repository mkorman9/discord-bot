import { SlashCommandBuilder } from 'discord.js';
import { declareModule } from './common/module';

declareModule('example_module', m => {
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

  m.registerCommand(new SlashCommandBuilder().setName('hello').setDescription('responds with hello'));

  m.on(
    'command',
    interaction => {
      if (interaction.commandName === 'hello') {
        interaction.reply('Hello!');
      }
    }
  );
});
