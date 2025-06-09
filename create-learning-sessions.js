const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

async function createLearningSession() {
  try {
    console.log('🎯 Creating learning session for testing...')

    // Get existing users and groups
    const users = await prisma.user.findMany()
    const groups = await prisma.group.findMany({
      include: {
        groupUsers: true
      }
    })

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create a learning session')
      return
    }

    if (groups.length === 0) {
      console.log('❌ No groups found')
      return
    }

    const group = groups[0] // Use first group
    console.log(`Using group: ${group.name} (${group.id})`)

    // Get current week start
    const weekStart = getWeekStart(new Date())
    console.log(`Week start: ${weekStart.toISOString()}`)

    // Check if topic exists, create one if not
    let topic = await prisma.topic.findFirst()
    
    if (!topic) {
      console.log('Creating topic with content...')
      topic = await prisma.topic.create({
        data: {
          title: 'Introduction to Productivity',
          description: 'Learn the fundamentals of personal productivity and time management',
          contentItems: {
            create: [
              {
                order: 1,
                title: 'Getting Things Done Method',
                body: '# Getting Things Done (GTD)\n\nThe GTD method by David Allen focuses on moving tasks out of your mind and into a trusted system. Key principles:\n\n- **Capture**: Write down all tasks and ideas\n- **Clarify**: Process what each item means\n- **Organize**: Put items in appropriate lists\n- **Reflect**: Review your system regularly\n- **Engage**: Take action with confidence',
                questions: {
                  create: [
                    {
                      prompt: 'What is the first step in the GTD method?',
                      choices: JSON.stringify(['Organize', 'Capture', 'Reflect', 'Engage']),
                      answerIndex: 1,
                      points: 5
                    },
                    {
                      prompt: 'How often should you review your GTD system?',
                      choices: JSON.stringify(['Never', 'Daily', 'Regularly', 'Only when stressed']),
                      answerIndex: 2,
                      points: 5
                    }
                  ]
                }
              },
              {
                order: 2,
                title: 'Time Blocking Technique',
                body: '# Time Blocking\n\nTime blocking involves scheduling specific time slots for different activities:\n\n- **Deep Work Blocks**: 2-4 hour focused sessions\n- **Meeting Blocks**: Group similar meetings\n- **Admin Blocks**: Email, planning, admin tasks\n- **Buffer Time**: Space between activities\n\nBenefits include better focus, realistic scheduling, and reduced decision fatigue.',
                questions: {
                  create: [
                    {
                      prompt: 'What is the recommended duration for deep work blocks?',
                      choices: JSON.stringify(['30 minutes', '1 hour', '2-4 hours', '8 hours']),
                      answerIndex: 2,
                      points: 5
                    }
                  ]
                }
              }
            ]
          }
        }
      })
      console.log(`✅ Created topic: ${topic.title}`)
    } else {
      console.log(`✅ Using existing topic: ${topic.title}`)
    }

    // Create learning session
    const playerA = users[0]
    const playerB = users[1]

    const existingSession = await prisma.learningSession.findFirst({
      where: {
        groupId: group.id,
        weekStart,
        OR: [
          { playerAId: playerA.id, playerBId: playerB.id },
          { playerAId: playerB.id, playerBId: playerA.id }
        ]
      }
    })

    if (existingSession) {
      console.log('✅ Learning session already exists for this week')
      console.log(`Session: ${playerA.name} vs ${playerB.name}`)
      return
    }

    const learningSession = await prisma.learningSession.create({
      data: {
        groupId: group.id,
        weekStart,
        topicId: topic.id,
        playerAId: playerA.id,
        playerBId: playerB.id,
        playerAScore: 0,
        playerBScore: 0,
        completed: false
      }
    })

    console.log('🎉 Successfully created learning session!')
    console.log(`Session ID: ${learningSession.id}`)
    console.log(`Group: ${group.name}`)
    console.log(`Topic: ${topic.title}`)
    console.log(`Players: ${playerA.name} vs ${playerB.name}`)
    console.log(`Week Start: ${weekStart.toISOString()}`)

  } catch (error) {
    console.error('❌ Error creating learning session:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLearningSession() 