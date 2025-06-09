const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createNMLABSMDemo() {
  try {
    console.log('🚀 Creating NMLABSM demo data...')

    // Create users
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'alex@nmlabsm.com' },
        update: {},
        create: { email: 'alex@nmlabsm.com', name: 'Alex Chen', rating: 1350 }
      }),
      prisma.user.upsert({
        where: { email: 'sarah@nmlabsm.com' },
        update: {},
        create: { email: 'sarah@nmlabsm.com', name: 'Sarah Johnson', rating: 1200 }
      }),
      prisma.user.upsert({
        where: { email: 'mike@nmlabsm.com' },
        update: {},
        create: { email: 'mike@nmlabsm.com', name: 'Mike Rodriguez', rating: 1180 }
      }),
      prisma.user.upsert({
        where: { email: 'emma@nmlabsm.com' },
        update: {},
        create: { email: 'emma@nmlabsm.com', name: 'Emma Thompson', rating: 1420 }
      })
    ])

    // Create group
    const group = await prisma.group.upsert({
      where: { inviteCode: 'NMLABSM' },
      update: {},
      create: {
        name: 'NMLABSM Learning Team',
        inviteCode: 'NMLABSM',
        creatorId: users[0].id
      }
    })

    // Add users to group
    for (const [index, user] of users.entries()) {
      await prisma.groupUser.upsert({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
        update: {},
        create: {
          groupId: group.id,
          userId: user.id,
          role: index === 0 ? 'admin' : 'member'
        }
      })
    }

    // Create tasks
    const fitnessTask = await prisma.task.create({
      data: {
        groupId: group.id,
        creatorId: users[0].id,
        title: 'Complete 45-minute workout session',
        description: 'Complete any form of exercise for at least 45 minutes.',
        taskType: 'MANUAL',
        pointValue: 25,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        requiresEvidence: true,
        evidencePrompt: 'Upload a photo of your workout and describe your session',
        votingThreshold: 0.6,
        votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    const quizTask = await prisma.task.create({
      data: {
        groupId: group.id,
        creatorId: users[0].id,
        title: 'JavaScript Fundamentals Quiz',
        description: 'Test your knowledge of core JavaScript concepts.',
        taskType: 'AUTO_QUIZ',
        pointValue: 30,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        requiresEvidence: false,
        votingThreshold: 0.0
      }
    })

    // Add quiz questions
    await prisma.taskQuestion.create({
      data: {
        taskId: quizTask.id,
        prompt: 'Which of the following declares a constant in JavaScript?',
        choices: JSON.stringify(['var PI = 3.14', 'let PI = 3.14', 'const PI = 3.14', 'constant PI = 3.14']),
        answerIndex: 2,
        points: 15
      }
    })

    await prisma.taskQuestion.create({
      data: {
        taskId: quizTask.id,
        prompt: 'What does the spread operator (...) do?',
        choices: JSON.stringify([
          'Creates a function',
          'Expands arrays/objects',
          'Delays execution',
          'Handles errors'
        ]),
        answerIndex: 1,
        points: 15
      }
    })

    // Create submissions
    const submission1 = await prisma.taskSubmission.create({
      data: {
        taskId: fitnessTask.id,
        userId: users[1].id,
        evidenceText: 'Completed 50-minute HIIT workout at the gym. 30 min cardio + 20 min strength training.',
        evidenceUrl: 'https://example.com/sarah-gym.jpg',
        status: 'PENDING'
      }
    })

    const submission2 = await prisma.taskSubmission.create({
      data: {
        taskId: fitnessTask.id,
        userId: users[2].id,
        evidenceText: 'Went for a 6-mile run along the waterfront. Maintained 8:30/mile pace.',
        evidenceUrl: 'https://example.com/mike-run.png',
        status: 'PENDING'
      }
    })

    // Create votes
    await prisma.taskVote.create({
      data: {
        submissionId: submission1.id,
        voterId: users[0].id,
        vote: 'APPROVE',
        comment: 'Great workout combination Sarah! Nice detail on the training split.'
      }
    })

    await prisma.taskVote.create({
      data: {
        submissionId: submission2.id,
        voterId: users[3].id,
        vote: 'APPROVE',
        comment: 'Impressive pace Mike! The waterfront is a beautiful route.'
      }
    })

    console.log('✅ NMLABSM demo data created successfully!')
    console.log('\n📊 Summary:')
    console.log(`👥 Users: ${users.map(u => u.name).join(', ')}`)
    console.log(`🏫 Group: ${group.name} (Code: ${group.inviteCode})`)
    console.log(`📋 Tasks: Fitness Challenge, JS Quiz`)
    console.log(`📝 Submissions: 2 pending review`)
    console.log('\n🚀 Login with: alex@nmlabsm.com, sarah@nmlabsm.com, mike@nmlabsm.com, emma@nmlabsm.com')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createNMLABSMDemo() 