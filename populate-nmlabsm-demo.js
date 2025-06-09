const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

async function populateNMLABSMDemo() {
  try {
    console.log('🚀 Populating NMLABSM group with comprehensive demo data...\n')

    // 1. Create demo users for NMLABSM group
    console.log('👥 Creating demo users...')
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'alex@nmlabsm.com' },
        update: {},
        create: {
          email: 'alex@nmlabsm.com',
          name: 'Alex Chen',
          rating: 1350
        }
      }),
      prisma.user.upsert({
        where: { email: 'sarah@nmlabsm.com' },
        update: {},
        create: {
          email: 'sarah@nmlabsm.com',
          name: 'Sarah Johnson',
          rating: 1200
        }
      }),
      prisma.user.upsert({
        where: { email: 'mike@nmlabsm.com' },
        update: {},
        create: {
          email: 'mike@nmlabsm.com',
          name: 'Mike Rodriguez',
          rating: 1180
        }
      }),
      prisma.user.upsert({
        where: { email: 'emma@nmlabsm.com' },
        update: {},
        create: {
          email: 'emma@nmlabsm.com',
          name: 'Emma Thompson',
          rating: 1420
        }
      }),
      prisma.user.upsert({
        where: { email: 'david@nmlabsm.com' },
        update: {},
        create: {
          email: 'david@nmlabsm.com',
          name: 'David Kim',
          rating: 1100
        }
      })
    ])
    console.log(`✅ Created/updated ${users.length} users`)

    // 2. Create or find NMLABSM group
    console.log('\n🏫 Creating NMLABSM group...')
    const nmlabsmGroup = await prisma.group.upsert({
      where: { inviteCode: 'NMLABSM' },
      update: {},
      create: {
        name: 'NMLABSM Learning Team',
        inviteCode: 'NMLABSM',
        creatorId: users[0].id // Alex is the group leader
      }
    })

    // Add all users to the group
    for (const [index, user] of users.entries()) {
      await prisma.groupUser.upsert({
        where: {
          groupId_userId: {
            groupId: nmlabsmGroup.id,
            userId: user.id
          }
        },
        update: {},
        create: {
          groupId: nmlabsmGroup.id,
          userId: user.id,
          role: index === 0 ? 'admin' : 'member' // Alex is admin
        }
      })
    }
    console.log(`✅ Added all users to NMLABSM group`)

    // 3. Create diverse tasks
    console.log('\n📋 Creating diverse tasks...')

    // Task 1: Fitness Challenge (Manual)
    const fitnessTask = await prisma.task.create({
      data: {
        groupId: nmlabsmGroup.id,
        creatorId: users[0].id, // Alex creates
        title: 'Complete 45-minute workout session',
        description: 'Complete any form of exercise for at least 45 minutes. This can include gym workouts, running, yoga, swimming, cycling, or team sports. Focus on maintaining consistent effort throughout.',
        taskType: 'MANUAL',
        pointValue: 25,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        requiresEvidence: true,
        evidencePrompt: 'Upload a photo of your workout (gym equipment, running route, yoga mat, etc.) and describe your session',
        votingThreshold: 0.6,
        votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    // Task 2: Learning Quiz (Auto)
    const learningTask = await prisma.task.create({
      data: {
        groupId: nmlabsmGroup.id,
        creatorId: users[0].id,
        title: 'JavaScript Fundamentals Assessment',
        description: 'Test your knowledge of core JavaScript concepts including variables, functions, arrays, and objects. This quiz covers ES6+ features and best practices.',
        taskType: 'AUTO_QUIZ',
        pointValue: 30,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        requiresEvidence: false,
        votingThreshold: 0.0
      }
    })

    // Add quiz questions
    await Promise.all([
      prisma.taskQuestion.create({
        data: {
          taskId: learningTask.id,
          prompt: 'Which of the following is the correct way to declare a constant in JavaScript?',
          choices: JSON.stringify(['var PI = 3.14', 'let PI = 3.14', 'const PI = 3.14', 'constant PI = 3.14']),
          answerIndex: 2,
          points: 10
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: learningTask.id,
          prompt: 'What does the spread operator (...) do in JavaScript?',
          choices: JSON.stringify([
            'Creates a new function',
            'Expands an array or object into individual elements',
            'Delays code execution',
            'Handles errors'
          ]),
          answerIndex: 1,
          points: 10
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: learningTask.id,
          prompt: 'Which array method returns a new array with all elements that pass a test?',
          choices: JSON.stringify(['map()', 'filter()', 'forEach()', 'reduce()']),
          answerIndex: 1,
          points: 10
        }
      })
    ])

    // Task 3: Project Task (Hybrid)
    const projectTask = await prisma.task.create({
      data: {
        groupId: nmlabsmGroup.id,
        creatorId: users[3].id, // Emma creates
        title: 'Build a Personal Portfolio Website',
        description: 'Create a responsive personal portfolio website showcasing your projects and skills. Must include: responsive design, at least 3 sections (about, projects, contact), and clean, professional styling.',
        taskType: 'HYBRID',
        pointValue: 50,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        requiresEvidence: true,
        evidencePrompt: 'Submit the live URL and GitHub repository link. Include screenshots of responsive design on different screen sizes.',
        votingThreshold: 0.75,
        votingDeadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)
      }
    })

    // Add hybrid task questions
    await Promise.all([
      prisma.taskQuestion.create({
        data: {
          taskId: projectTask.id,
          prompt: 'Which CSS property is most commonly used for responsive design?',
          choices: JSON.stringify(['display: flex', 'position: relative', 'media queries', 'float: left']),
          answerIndex: 2,
          points: 15
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: projectTask.id,
          prompt: 'What is the standard viewport meta tag for responsive design?',
          choices: JSON.stringify([
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<meta name="viewport" content="width=100%, height=100%">',
            '<meta name="responsive" content="true">',
            '<meta name="mobile" content="optimized">'
          ]),
          answerIndex: 0,
          points: 10
        }
      })
    ])

    // Task 4: Reading Challenge (Manual)
    const readingTask = await prisma.task.create({
      data: {
        groupId: nmlabsmGroup.id,
        creatorId: users[1].id, // Sarah creates
        title: 'Read "Atomic Habits" Chapter 2-3 + Summary',
        description: 'Read chapters 2-3 of "Atomic Habits" by James Clear and write a 500-word summary of key insights. Focus on the concepts of habit stacking and environment design.',
        taskType: 'MANUAL',
        pointValue: 35,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        requiresEvidence: true,
        evidencePrompt: 'Submit your 500-word summary and one practical example of how you plan to apply these concepts',
        votingThreshold: 0.7,
        votingDeadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
      }
    })

    console.log(`✅ Created 4 diverse tasks`)

    // 4. Create submissions with different statuses
    console.log('\n📝 Creating sample submissions...')

    // Sarah submits to fitness task (PENDING)
    const sarahFitnessSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: fitnessTask.id,
        userId: users[1].id,
        evidenceText: 'Completed a 50-minute HIIT workout at the gym today. Did 30 minutes of cardio (treadmill and elliptical) followed by 20 minutes of strength training focusing on upper body. Heart rate stayed in target zone throughout the session.',
        evidenceUrl: 'https://example.com/sarah-gym-selfie.jpg',
        status: 'PENDING'
      }
    })

    // Mike submits to fitness task (PENDING)
    const mikeFitnessSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: fitnessTask.id,
        userId: users[2].id,
        evidenceText: 'Went for a 6-mile run along the waterfront trail. Perfect weather and maintained a steady 8:30/mile pace. Used my running app to track distance, time, and route. Feeling great and ready for more!',
        evidenceUrl: 'https://example.com/mike-running-stats.png',
        status: 'PENDING'
      }
    })

    // Emma completes learning quiz (AUTO_SCORED)
    const emmaQuizSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: learningTask.id,
        userId: users[3].id,
        autoScore: 30, // Perfect score
        status: 'AUTO_SCORED',
        score: 30
      }
    })

    // David submits to reading task (PENDING)
    const davidReadingSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: readingTask.id,
        userId: users[4].id,
        evidenceText: 'Completed chapters 2-3 of Atomic Habits. Key insights: 1) Habit stacking links new habits to existing ones (after I pour my coffee, I will read for 10 minutes). 2) Environment design makes good habits obvious and bad habits invisible. 3) The 1% rule - small improvements compound over time. My application: I\'m redesigning my desk to make healthy snacks visible and hiding my phone to reduce distractions during work.',
        status: 'PENDING'
      }
    })

    console.log(`✅ Created 4 sample submissions`)

    // 5. Create some votes
    console.log('\n🗳️  Creating sample votes...')

    // Alex votes on Sarah's fitness submission
    await prisma.taskVote.create({
      data: {
        submissionId: sarahFitnessSubmission.id,
        voterId: users[0].id,
        vote: 'APPROVE',
        comment: 'Great work Sarah! Love the combination of cardio and strength training. The detail about staying in target heart rate zone shows real commitment.'
      }
    })

    // Emma votes on Mike's fitness submission
    await prisma.taskVote.create({
      data: {
        submissionId: mikeFitnessSubmission.id,
        voterId: users[3].id,
        vote: 'APPROVE',
        comment: 'Impressive pace and distance! The waterfront trail is beautiful for running. Great job tracking your metrics too.'
      }
    })

    // Mike votes on David's reading submission
    await prisma.taskVote.create({
      data: {
        submissionId: davidReadingSubmission.id,
        voterId: users[2].id,
        vote: 'APPROVE',
        comment: 'Excellent summary David! I especially like your practical application example about redesigning your workspace. Very actionable insights.'
      }
    })

    console.log(`✅ Created 3 sample votes`)

    // 6. Create a learning session
    console.log('\n🎯 Creating learning session...')

    // Create topic for learning session
    const weeklyTopic = await prisma.topic.create({
      data: {
        title: 'Advanced React Patterns',
        description: 'Learn advanced React patterns including render props, higher-order components, and custom hooks',
        contentItems: {
          create: [
            {
              order: 1,
              title: 'Understanding Render Props',
              body: '# Render Props Pattern\n\nRender props is a technique for sharing code between React components using a prop whose value is a function.\n\n## Key Benefits:\n- Code reusability\n- Separation of concerns\n- Flexible composition\n\n## Example:\n```jsx\nclass DataProvider extends React.Component {\n  render() {\n    return this.props.render(this.state.data)\n  }\n}\n```',
              questions: {
                create: [
                  {
                    prompt: 'What is the main purpose of the render props pattern?',
                    choices: JSON.stringify(['Styling components', 'Sharing logic between components', 'Handling events', 'Managing state']),
                    answerIndex: 1,
                    points: 10
                  },
                  {
                    prompt: 'In render props, what type of value should the render prop be?',
                    choices: JSON.stringify(['String', 'Number', 'Function', 'Object']),
                    answerIndex: 2,
                    points: 10
                  }
                ]
              }
            },
            {
              order: 2,
              title: 'Custom Hooks',
              body: '# Custom Hooks\n\nCustom hooks allow you to extract component logic into reusable functions.\n\n## Rules:\n- Must start with "use"\n- Can call other hooks\n- Follow hooks rules\n\n## Example:\n```jsx\nfunction useCounter(initialValue = 0) {\n  const [count, setCount] = useState(initialValue)\n  const increment = () => setCount(count + 1)\n  return { count, increment }\n}\n```',
              questions: {
                create: [
                  {
                    prompt: 'Custom hooks must start with which prefix?',
                    choices: JSON.stringify(['hook', 'use', 'custom', 'my']),
                    answerIndex: 1,
                    points: 10
                  }
                ]
              }
            }
          ]
        }
      }
    })

    // Create learning session between Alex and Sarah
    const currentWeek = getWeekStart(new Date())
    const learningSession = await prisma.learningSession.create({
      data: {
        groupId: nmlabsmGroup.id,
        weekStart: currentWeek,
        topicId: weeklyTopic.id,
        playerAId: users[0].id, // Alex
        playerBId: users[1].id, // Sarah
        playerAScore: 15,
        playerBScore: 20,
        completed: false
      }
    })

    console.log(`✅ Created learning session: Alex vs Sarah`)

    // 7. Update user ratings based on activity
    console.log('\n📊 Updating user ratings...')
    await Promise.all([
      prisma.user.update({
        where: { id: users[0].id },
        data: { rating: { increment: 5 } } // Alex gains rating
      }),
      prisma.user.update({
        where: { id: users[1].id },
        data: { rating: { increment: 10 } } // Sarah gains more for activity
      }),
      prisma.user.update({
        where: { id: users[3].id },
        data: { rating: { increment: 15 } } // Emma gains for perfect quiz
      })
    ])

    console.log(`✅ Updated user ratings`)

    // 8. Display summary
    console.log('\n🎉 NMLABSM DEMO DATA SETUP COMPLETE!\n')
    
    console.log('👥 USERS CREATED:')
    users.forEach(user => {
      console.log(`   ${user.name} (${user.email}) - Rating: ${user.rating}`)
    })

    console.log('\n🏫 GROUP DETAILS:')
    console.log(`   Name: ${nmlabsmGroup.name}`)
    console.log(`   Invite Code: ${nmlabsmGroup.inviteCode}`)
    console.log(`   Leader: Alex Chen`)
    console.log(`   Members: ${users.length}`)

    console.log('\n📋 TASKS CREATED:')
    console.log(`   1. "${fitnessTask.title}" (Manual, ${fitnessTask.pointValue}pts)`)
    console.log(`      - Sarah & Mike submitted (PENDING)`)
    console.log(`   2. "${learningTask.title}" (Auto-Quiz, ${learningTask.pointValue}pts)`)
    console.log(`      - Emma completed with perfect score`)
    console.log(`   3. "${projectTask.title}" (Hybrid, ${projectTask.pointValue}pts)`)
    console.log(`      - No submissions yet`)
    console.log(`   4. "${readingTask.title}" (Manual, ${readingTask.pointValue}pts)`)
    console.log(`      - David submitted (PENDING)`)

    console.log('\n🎯 LEARNING SESSION:')
    console.log(`   Topic: ${weeklyTopic.title}`)
    console.log(`   Players: Alex (15pts) vs Sarah (20pts)`)

    console.log('\n🗳️  VERIFICATION QUEUE:')
    console.log(`   - 3 submissions awaiting peer review`)
    console.log(`   - Various vote examples created`)

    console.log('\n🚀 LOGIN INSTRUCTIONS:')
    console.log('   Use any of these emails to test different user perspectives:')
    console.log('   - alex@nmlabsm.com (Group Leader)')
    console.log('   - sarah@nmlabsm.com (Active Member)')
    console.log('   - emma@nmlabsm.com (High Performer)')
    console.log('   - mike@nmlabsm.com (Regular Member)')
    console.log('   - david@nmlabsm.com (New Member)')

  } catch (error) {
    console.error('❌ Error populating NMLABSM demo data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateNMLABSMDemo() 