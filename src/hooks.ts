process.on('SIGINT', () => {
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.log(`🚫 Unhandled exception: ${err.stack}`);
});

process.on('unhandledRejection', reason => {
  console.log(
    `🚫 Unhandled Promise rejection: ${reason instanceof Error ? reason.stack : reason}`
  );
});
