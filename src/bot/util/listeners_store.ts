export type ListenerJob = () => void;

export class ListenersStore {
  private startJobs: ListenerJob[] = [];
  private stopJobs: ListenerJob[] = [];

  start() {
    this.startJobs.forEach(j => j());
  }

  stop() {
    this.stopJobs.forEach(j => j());
  }

  onStart(job: ListenerJob) {
    this.startJobs.push(job);
  }

  onStop(job: ListenerJob) {
    this.stopJobs.push(job);
  }
}
