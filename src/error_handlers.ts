process.on('SIGINT', async () => {
  console.log('Exiting');
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.error(`Unhandled exception: ${err}`);
});

process.on('unhandledRejection', (reason, p) => {
  console.error(`Unhandled Promise rejection: ${reason} ${p}`);
});
