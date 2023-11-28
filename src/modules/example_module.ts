import {ChannelType, GatewayIntentBits, SlashCommandBuilder} from 'discord.js';
import {declareModule} from '../bot/module';

export default declareModule('example_module', m => {
  m.intents(
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  );

  m.template('moduleResponse', {
    'en-US': `
      This is a response from module *{{ moduleName }}*.
      Multiline string should be handled properly.
    `,
    'pl-PL': `
      To jest odpowiedź z modułu *{{ moduleName}}*.
      Wieloliniowy tekst powinien wyświetlać się poprawnie.
    `
  });

  m.template('hello', {
    'en-US': `
      Hello!
    `,
    'pl-PL': `
      Cześć!
    `
  });

  m.on('ready', () => {
    console.log('ready');
  });

  m.on('messageCreate', async message => {
    if (message.channel.type !== ChannelType.GuildText || message.author.bot) {
      return;
    }

    await message.reply(await m.render('moduleResponse', {
      moduleName: m.name()
    }));
  });

  m.cron('*/5 * * * * *', () => {
    console.log('scheduled event');
  });

  m.command(
    new SlashCommandBuilder()
      .setName('hello')
      .setDescription('responds with hello'),
    async interaction => {
      await interaction.reply(await m.render('hello', {}));
    }
  );
});
