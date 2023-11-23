process.on('SIGINT', () => {
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.error(`Unhandled exception: ${err.stack}`);
});

process.on('unhandledRejection', reason => {
  console.error(
    `Unhandled Promise rejection: ${reason instanceof Error ? reason.stack : reason}`
  );
});
