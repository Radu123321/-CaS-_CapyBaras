const log = require('./logger');

class Scheduler {
  constructor() {
    this.jobs = [];
    this.running = false;
    this.intervalId = null;
  }

  // Add a job with cron-like specification
  addJob(name, cronSpec, jobFunction) {
    log.debug(`Scheduler: Adding job '${name}' with spec '${cronSpec}'`);
    
    this.jobs.push({
      name,
      cronSpec,
      jobFunction,
      lastRun: null,
      nextRun: this.calculateNextRun(cronSpec)
    });
    
    log.info(`Scheduler: Job '${name}' added, next run: ${this.jobs[this.jobs.length - 1].nextRun}`);
  }

  // Simple cron parser - supports basic patterns
  // Format: "minute hour day month dayOfWeek"
  // Examples: "0 * * * *" (every hour), "*/5 * * * *" (every 5 minutes)
  calculateNextRun(cronSpec) {
    const now = new Date();
    const [minute, hour, day, month, dayOfWeek] = cronSpec.split(' ');
    
    // For simplicity, handle only basic patterns
    if (cronSpec === '*/1 * * * *') {
      // Every minute
      const next = new Date(now);
      next.setSeconds(0);
      next.setMilliseconds(0);
      next.setMinutes(next.getMinutes() + 1);
      return next;
    }
    
    if (cronSpec === '*/5 * * * *') {
      // Every 5 minutes
      const next = new Date(now);
      next.setSeconds(0);
      next.setMilliseconds(0);
      const currentMinutes = next.getMinutes();
      const nextMinutes = Math.ceil(currentMinutes / 5) * 5;
      next.setMinutes(nextMinutes);
      return next;
    }
    
    if (cronSpec === '0 * * * *') {
      // Every hour
      const next = new Date(now);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      next.setHours(next.getHours() + 1);
      return next;
    }
    
    if (cronSpec === '0 0 * * *') {
      // Every day at midnight
      const next = new Date(now);
      next.setHours(0, 0, 0, 0);
      next.setDate(next.getDate() + 1);
      return next;
    }
    
    // Default: run in 1 minute
    const next = new Date(now);
    next.setMinutes(next.getMinutes() + 1);
    return next;
  }

  // Start the scheduler
  start() {
    if (this.running) {
      log.warn('Scheduler: Already running');
      return;
    }
    
    log.info('Scheduler: Starting...');
    this.running = true;
    
    // Check every minute
    this.intervalId = setInterval(() => {
      this.tick();
    }, 60000); // 60 seconds
    
    log.info('Scheduler: Started successfully');
  }

  // Stop the scheduler
  stop() {
    if (!this.running) {
      log.warn('Scheduler: Not running');
      return;
    }
    
    log.info('Scheduler: Stopping...');
    this.running = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    log.info('Scheduler: Stopped successfully');
  }

  // Check and run jobs
  async tick() {
    const now = new Date();
    log.debug(`Scheduler: Tick at ${now.toISOString()}`);
    
    for (const job of this.jobs) {
      if (now >= job.nextRun) {
        log.info(`Scheduler: Running job '${job.name}'`);
        
        try {
          await job.jobFunction();
          job.lastRun = now;
          job.nextRun = this.calculateNextRun(job.cronSpec);
          
          log.info(`Scheduler: Job '${job.name}' completed, next run: ${job.nextRun}`);
        } catch (error) {
          log.error(`Scheduler: Job '${job.name}' failed: ${error.message}`);
          
          // Schedule retry in 5 minutes
          job.nextRun = new Date(now.getTime() + 5 * 60 * 1000);
          log.warn(`Scheduler: Job '${job.name}' will retry at ${job.nextRun}`);
        }
      }
    }
  }

  // Get job status
  getStatus() {
    return {
      running: this.running,
      jobCount: this.jobs.length,
      jobs: this.jobs.map(job => ({
        name: job.name,
        cronSpec: job.cronSpec,
        lastRun: job.lastRun,
        nextRun: job.nextRun
      }))
    };
  }

  // Remove a job
  removeJob(name) {
    const index = this.jobs.findIndex(job => job.name === name);
    if (index !== -1) {
      this.jobs.splice(index, 1);
      log.info(`Scheduler: Removed job '${name}'`);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const scheduler = new Scheduler();

module.exports = scheduler; 