const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('Testing database connection...')
    
    // Check existing data
    console.log('Checking existing data...')
    const existingUsers = await prisma.user.findMany()
    console.log('Existing users:', existingUsers.length)
    
    const existingGroups = await prisma.group.findMany()
    console.log('Existing groups:', existingGroups.length)
    
    // Test 1: Get or create a test user
    console.log('Getting or creating test user...')
    let user = await prisma.user.findUnique({
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
      console.log('Created user:', user)
    } else {
      console.log('Found existing user:', user)
    }

    // Test 2: Get or create a test group
    console.log('Getting or creating test group...')
    let group = await prisma.group.findUnique({
      where: { inviteCode: 'TEST123' }
    })
    
    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Test Learning Group',
          inviteCode: 'TEST123',
          creatorId: user.id
        }
      })
      console.log('Created group:', group)
    } else {
      console.log('Found existing group:', group)
    }

    // Test 3: Check if user is in group
    console.log('Checking group membership...')
    let groupUser = await prisma.groupUser.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id
        }
      }
    })
    
    if (!groupUser) {
      groupUser = await prisma.groupUser.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: 'admin'
        }
      })
      console.log('Added user to group:', groupUser)
    } else {
      console.log('User already in group:', groupUser)
    }

    // Test 4: Check topics
    console.log('Checking topics...')
    const topics = await prisma.topic.findMany({
      include: {
        contentItems: {
          include: {
            questions: true
          }
        }
      }
    })
    console.log('Found topics:', topics.length)
    
    if (topics.length === 0) {
      const topic = await prisma.topic.create({
        data: {
          title: 'JavaScript Basics',
          description: 'Learn the fundamentals of JavaScript programming',
          contentItems: {
            create: [
              {
                order: 1,
                title: 'Variables and Data Types',
                body: '# Variables in JavaScript\n\nJavaScript has three ways to declare variables:\n- `var`\n- `let`\n- `const`',
                questions: {
                  create: [
                    {
                      prompt: 'Which keyword is used to declare a constant in JavaScript?',
                      choices: JSON.stringify(['var', 'let', 'const', 'final']),
                      answerIndex: 2,
                      points: 1
                    }
                  ]
                }
              }
            ]
          }
        }
      })
      console.log('Created topic:', topic)
    }

    // Test 5: Check tasks
    console.log('Checking tasks...')
    const tasks = await prisma.task.findMany()
    console.log('Found tasks:', tasks.length)
    
    if (tasks.length === 0) {
      const task = await prisma.task.create({
        data: {
          groupId: group.id,
          creatorId: user.id,
          title: 'Daily Coding Practice',
          description: 'Complete a coding challenge and submit your solution',
          taskType: 'MANUAL',
          pointValue: 15,
          requiresEvidence: true,
          evidencePrompt: 'Submit a screenshot of your completed code',
          votingThreshold: 0.6
        }
      })
      console.log('Created task:', task)
    }

    console.log('✅ All database tests passed!')
    
    // Show summary
    console.log('\n=== DATABASE SUMMARY ===')
    const userCount = await prisma.user.count()
    const groupCount = await prisma.group.count()
    const topicCount = await prisma.topic.count()
    const taskCount = await prisma.task.count()
    
    console.log(`Users: ${userCount}`)
    console.log(`Groups: ${groupCount}`)
    console.log(`Topics: ${topicCount}`)
    console.log(`Tasks: ${taskCount}`)
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase() 