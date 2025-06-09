import { sessionWorker, scheduleWeeklySessions } from './queue'

async function startWorker() {
  console.log('🚀 Starting Fantasy Learning queue worker...')
  
  try {
    // Schedule weekly sessions
    await scheduleWeeklySessions()
    console.log('✅ Weekly session creation scheduled for every Monday at midnight UTC')
    
    // Start worker
    sessionWorker.on('completed', (job) => {
      console.log(`✅ Job completed: ${job.name}`)
    })

    sessionWorker.on('failed', (job, err) => {
      console.error(`❌ Job failed: ${job?.name}`, err)
    })

    console.log('🔄 Queue worker is running and listening for jobs...')
    
    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Gracefully shutting down queue worker...')
      await sessionWorker.close()
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Failed to start queue worker:', error)
    process.exit(1)
  }
}

// Auto-start if this file is run directly
if (require.main === module) {
  startWorker()
}

export { startWorker }