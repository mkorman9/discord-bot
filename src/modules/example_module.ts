import context from './context';

context.on('guildMessage', event => {
  console.log(event.message);
});

context.on(
  'cron',
  event => {
    console.log(`Scheduled event ${event}`);
  },
  {
    runAt: '5 4 * * *'
  }
);

context.emit('guildMessage', { message: 'Hello world!', guidId: '12345' });
