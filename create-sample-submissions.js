const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleSubmissions() {
  try {
    console.log('📝 Creating sample task submissions for testing...')

    // Get existing users and tasks
    const users = await prisma.user.findMany()
    const tasks = await prisma.task.findMany({
      include: {
        group: true
      }
    })

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create submissions')
      return
    }

    if (tasks.length === 0) {
      console.log('❌ No tasks found')
      return
    }

    const task = tasks[0] // Use first task
    console.log(`Using task: ${task.title} (${task.id})`)

    // Create sample submissions
    const submissionData = [
      {
        taskId: task.id,
        userId: users[0].id,
        evidenceText: `Completed the task "${task.title}". I spent about 2 hours working on this and learned a lot about time management principles. Applied the techniques to my daily routine and saw immediate improvements in my productivity.`,
        evidenceUrl: 'https://example.com/my-screenshot.jpg',
        status: 'PENDING'
      },
      {
        taskId: task.id,
        userId: users[1].id,
        evidenceText: `Finished "${task.title}" successfully. Created a detailed action plan and implemented the strategies discussed. The results were impressive - I was able to organize my tasks much better and reduce procrastination significantly.`,
        evidenceUrl: 'https://example.com/evidence-doc.pdf',
        status: 'PENDING'
      }
    ]

    for (const data of submissionData) {
      // Check if submission already exists
      const existing = await prisma.taskSubmission.findUnique({
        where: {
          taskId_userId: {
            taskId: data.taskId,
            userId: data.userId
          }
        }
      })

      if (!existing) {
        const submission = await prisma.taskSubmission.create({
          data
        })
        console.log(`✅ Created submission by user ${data.userId}: ${submission.id}`)
      } else {
        console.log(`⚠️  Submission already exists for user ${data.userId}`)
      }
    }

    console.log('\n🎉 Sample submissions created successfully!')
    
    // Show summary
    const allSubmissions = await prisma.taskSubmission.findMany({
      include: {
        user: {
          select: { name: true }
        },
        task: {
          select: { title: true }
        }
      }
    })

    console.log('\n📋 CURRENT SUBMISSIONS:')
    allSubmissions.forEach(sub => {
      console.log(`- ${sub.user.name}: "${sub.task.title}" (${sub.status})`)
    })

  } catch (error) {
    console.error('❌ Error creating sample submissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleSubmissions() 