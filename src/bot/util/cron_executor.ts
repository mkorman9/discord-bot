import {ScheduledTask, schedule} from 'node-cron';
import {Awaitable} from 'discord.js';

export class CronExecutor {
  private tasks: ScheduledTask[] = [];

  registerTask(expression: string, listener: () => Awaitable<void>) {
    const task = schedule(
      expression,
      listener,
      {
        scheduled: false,
        runOnInit: false
      }
    );

    this.tasks.push(task);
  }

  start() {
    this.tasks.forEach(t => t.start());
  }

  stop() {
    this.tasks.forEach(t => t.stop());
  }
}
