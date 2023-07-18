import { SlashCommandBuilder } from 'discord.js';
import { declareModule } from './common/module';

declareModule('example_module', m => {
  m.on('ready', () => {
    console.log('ready!');
  });

  m.on('guildMessage', event => {
    if (event.message.author.bot) {
      return;
    }

    event.message.reply(`hello from module: ${m.name}`);
  });

  m.on(
    'cron',
    event => {
      console.log(`Scheduled event ${event}`);
    },
    {
      runAt: '05 * * * * *'
    }
  );

  m.registerCommand(
    new SlashCommandBuilder()
      .setName('hello')
      .setDescription('responds with hello')
  );

  m.on(
    'command',
    event => {
      event.interaction.reply('Hello!');
    },
    {
      name: 'hello'
    }
  )
});
