const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTaskCreation() {
  try {
    console.log('🧪 Testing task creation system...')

    // Create a test user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          rating: 1200
        }
      })
      console.log('✅ Created test user:', user.name)
    } else {
      console.log('✅ Using existing test user:', user.name)
    }

    // Create a test group
    let group = await prisma.group.findFirst({
      where: { name: 'Test Learning Group' }
    })

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Test Learning Group',
          inviteCode: 'TEST123',
          creatorId: user.id,
          groupUsers: {
            create: {
              userId: user.id,
              role: 'ADMIN'
            }
          }
        }
      })
      console.log('✅ Created test group:', group.name)
    } else {
      console.log('✅ Using existing test group:', group.name)
    }

    // Test task creation
    const taskData = {
      title: 'Learn React Hooks',
      description: 'Complete a tutorial on React hooks and build a small project demonstrating useState and useEffect.',
      taskType: 'MANUAL',
      pointValue: 100,
      groupId: group.id,
      creatorId: user.id,
      requiresEvidence: true,
      evidencePrompt: 'Please share a screenshot or link to your completed project',
      votingThreshold: 1
    }

    const task = await prisma.task.create({
      data: taskData
    })

    console.log('✅ Created test task:', task.title)

    // Verify the task was created correctly
    const createdTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        creator: true,
        group: true
      }
    })

    console.log('📋 Task details:')
    console.log(`  - Title: ${createdTask.title}`)
    console.log(`  - Type: ${createdTask.taskType}`)
    console.log(`  - Points: ${createdTask.pointValue}`)
    console.log(`  - Creator: ${createdTask.creator.name}`)
    console.log(`  - Group: ${createdTask.group.name}`)

    console.log('\n🎉 Task creation system is working!')
    console.log('\n📝 Test data summary:')
    console.log(`  - User: ${user.email} (ID: ${user.id})`)
    console.log(`  - Group: ${group.name} (Code: ${group.inviteCode})`)
    console.log(`  - Task: ${task.title} (ID: ${task.id})`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTaskCreation() 