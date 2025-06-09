const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupEnhancedDemo() {
  console.log('🚀 Setting up Enhanced Fantasy Learning Demo...\n')

  try {
    // 1. Create Users
    console.log('👥 Creating users...')
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'alice@example.com',
          name: 'Alice Johnson',
          rating: 1200
        }
      }),
      prisma.user.create({
        data: {
          email: 'bob@example.com',
          name: 'Bob Smith',
          rating: 1150
        }
      }),
      prisma.user.create({
        data: {
          email: 'charlie@example.com',
          name: 'Charlie Brown',
          rating: 1300
        }
      }),
      prisma.user.create({
        data: {
          email: 'diana@example.com',
          name: 'Diana Prince',
          rating: 1100
        }
      })
    ])
    console.log(`✅ Created ${users.length} users`)

    // 2. Create Group (Alice as leader)
    console.log('\n🏫 Creating learning group...')
    const group = await prisma.group.create({
      data: {
        name: 'Productivity Masters',
        inviteCode: 'PROD2024',
        creatorId: users[0].id // Alice is the group leader
      }
    })

    // 3. Add all users to group
    await Promise.all(users.map(user => 
      prisma.groupUser.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: user.id === users[0].id ? 'admin' : 'member'
        }
      })
    ))
    console.log(`✅ Added all users to group "${group.name}"`)

    // 4. Create Different Types of Tasks
    console.log('\n📋 Creating diverse tasks...')

    // Task 1: Manual Verification - Fitness Challenge
    const fitnessTask = await prisma.task.create({
      data: {
        groupId: group.id,
        creatorId: users[0].id, // Alice creates
        title: 'Complete 30-minute workout',
        description: 'Exercise for at least 30 minutes. Can be running, gym, yoga, or any physical activity.',
        taskType: 'MANUAL',
        pointValue: 15,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        requiresEvidence: true,
        evidencePrompt: 'Describe your workout and upload a photo of your exercise app/equipment',
        votingThreshold: 0.6,
        votingDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
      }
    })

    // Task 2: Auto Quiz - Productivity Knowledge
    const quizTask = await prisma.task.create({
      data: {
        groupId: group.id,
        creatorId: users[0].id,
        title: 'Productivity Fundamentals Quiz',
        description: 'Test your knowledge on time management and productivity principles.',
        taskType: 'AUTO_QUIZ',
        pointValue: 20,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        requiresEvidence: false,
        votingThreshold: 0.0 // Not needed for auto tasks
      }
    })

    // Add quiz questions
    await Promise.all([
      prisma.taskQuestion.create({
        data: {
          taskId: quizTask.id,
          prompt: 'What is the recommended duration for a focused work session (Pomodoro Technique)?',
          choices: JSON.stringify(['15 minutes', '25 minutes', '45 minutes', '60 minutes']),
          answerIndex: 1, // 25 minutes
          points: 5
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: quizTask.id,
          prompt: 'Which principle suggests focusing on tasks that yield the highest impact?',
          choices: JSON.stringify(['Parkinson\'s Law', '80/20 Rule (Pareto Principle)', 'Murphy\'s Law', 'Peter Principle']),
          answerIndex: 1, // 80/20 Rule
          points: 5
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: quizTask.id,
          prompt: 'What is "Deep Work" as defined by Cal Newport?',
          choices: JSON.stringify([
            'Working overtime', 
            'Professional activities in a distraction-free environment', 
            'Physical labor', 
            'Working from home'
          ]),
          answerIndex: 1, // Professional activities in distraction-free environment
          points: 5
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: quizTask.id,
          prompt: 'Which strategy is most effective for managing email overwhelm?',
          choices: JSON.stringify([
            'Check email every 5 minutes',
            'Never check email',
            'Batch process emails at set times',
            'Only use voice calls'
          ]),
          answerIndex: 2, // Batch process emails
          points: 5
        }
      })
    ])

    // Task 3: Hybrid - Reading + Project
    const hybridTask = await prisma.task.create({
      data: {
        groupId: group.id,
        creatorId: users[0].id,
        title: 'Read "Atomic Habits" Chapter 1 + Create Implementation Plan',
        description: 'Read Chapter 1 of Atomic Habits, take the comprehension quiz, and create a personal habit implementation plan.',
        taskType: 'HYBRID',
        pointValue: 30,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        requiresEvidence: true,
        evidencePrompt: 'Submit your 3-step habit implementation plan with specific examples',
        votingThreshold: 0.75, // Higher threshold for academic content
        votingDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
      }
    })

    // Add hybrid task quiz questions
    await Promise.all([
      prisma.taskQuestion.create({
        data: {
          taskId: hybridTask.id,
          prompt: 'According to Chapter 1, what is the main reason people struggle to build good habits?',
          choices: JSON.stringify([
            'Lack of motivation',
            'Focusing on outcomes instead of systems',
            'Not having enough time',
            'Bad genetics'
          ]),
          answerIndex: 1, // Focusing on outcomes instead of systems
          points: 7
        }
      }),
      prisma.taskQuestion.create({
        data: {
          taskId: hybridTask.id,
          prompt: 'What does James Clear call the "plateau of latent potential"?',
          choices: JSON.stringify([
            'The maximum human capacity',
            'The period where habits feel unrewarding before breakthrough',
            'A fitness exercise',
            'A business strategy'
          ]),
          answerIndex: 1, // The period where habits feel unrewarding before breakthrough
          points: 8
        }
      })
    ])

    console.log(`✅ Created 3 diverse tasks (Manual, Auto-Quiz, Hybrid)`)

    // 5. Create Sample Submissions
    console.log('\n📝 Creating sample submissions...')

    // Bob submits to fitness task
    const bobFitnessSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: fitnessTask.id,
        userId: users[1].id, // Bob
        evidenceText: 'Completed a 45-minute run in Central Park. Used Nike Run Club app to track. Felt great afterwards and maintained a steady 8:30/mile pace.',
        evidenceUrl: 'https://example.com/bob-run-screenshot.jpg',
        status: 'PENDING'
      }
    })

    // Charlie completes the quiz with perfect score
    const charlieQuizSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: quizTask.id,
        userId: users[2].id, // Charlie
        autoScore: 20, // Perfect score
        status: 'AUTO_SCORED',
        score: 20
      }
    })

    // Diana submits to hybrid task
    const dianaHybridSubmission = await prisma.taskSubmission.create({
      data: {
        taskId: hybridTask.id,
        userId: users[3].id, // Diana
        evidenceText: 'My 3-step habit plan: 1) Morning meditation (5 min after coffee), 2) Evening reading (20 min before bed), 3) Daily gratitude journal (3 items after dinner). I\'ll track using a simple checklist app.',
        autoScore: 12, // Got 12/15 on quiz portion
        status: 'PENDING' // Waiting for peer review of the plan
      }
    })

    console.log(`✅ Created sample submissions`)

    // 6. Create Sample Votes
    console.log('\n🗳️  Creating sample votes...')

    // Alice and Charlie vote on Bob's fitness submission
    await Promise.all([
      prisma.taskVote.create({
        data: {
          submissionId: bobFitnessSubmission.id,
          voterId: users[0].id, // Alice
          vote: 'APPROVE',
          comment: 'Great job Bob! 45 minutes is impressive and the tracking shows genuine effort.'
        }
      }),
      prisma.taskVote.create({
        data: {
          submissionId: bobFitnessSubmission.id,
          voterId: users[2].id, // Charlie
          vote: 'APPROVE',
          comment: 'Love the detailed tracking. That pace is solid!'
        }
      })
    ])

    // Alice and Bob vote on Diana's hybrid submission
    await Promise.all([
      prisma.taskVote.create({
        data: {
          submissionId: dianaHybridSubmission.id,
          voterId: users[0].id, // Alice
          vote: 'APPROVE',
          comment: 'Excellent implementation plan! Very specific and actionable. The habit stacking approach is perfect.'
        }
      }),
      prisma.taskVote.create({
        data: {
          submissionId: dianaHybridSubmission.id,
          voterId: users[1].id, // Bob
          vote: 'APPROVE',
          comment: 'This plan looks really thoughtful. I especially like how you tied each habit to an existing routine.'
        }
      })
    ])

    console.log(`✅ Created sample votes`)

    // 7. Process voting results and update scores
    console.log('\n📊 Processing voting results...')

    // Bob's fitness task: 2/2 approvals = 100% approval
    await prisma.taskSubmission.update({
      where: { id: bobFitnessSubmission.id },
      data: {
        status: 'APPROVED',
        score: 15, // Full points
        peerScore: 15
      }
    })

    // Diana's hybrid task: 2/2 approvals = 100% approval
    await prisma.taskSubmission.update({
      where: { id: dianaHybridSubmission.id },
      data: {
        status: 'APPROVED',
        score: 27, // 12 auto + 15 peer (100% of 15 peer points)
        peerScore: 15
      }
    })

    // Update user ratings based on performance
    await Promise.all([
      prisma.user.update({
        where: { id: users[1].id }, // Bob
        data: { rating: { increment: 10 } } // Bonus for fitness completion
      }),
      prisma.user.update({
        where: { id: users[2].id }, // Charlie  
        data: { rating: { increment: 15 } } // Bonus for perfect quiz
      }),
      prisma.user.update({
        where: { id: users[3].id }, // Diana
        data: { rating: { increment: 20 } } // Bonus for hybrid task
      })
    ])

    console.log(`✅ Updated scores and ratings`)

    // 8. Display Demo Summary
    console.log('\n🎉 ENHANCED FANTASY LEARNING DEMO SETUP COMPLETE!\n')
    
    console.log('📋 TASKS CREATED:')
    console.log(`1. "${fitnessTask.title}" (Manual, 15pts)`)
    console.log(`   - Evidence required, 60% approval threshold`)
    console.log(`   - Bob submitted and got APPROVED (100% approval)`)
    
    console.log(`\n2. "${quizTask.title}" (Auto-Quiz, 20pts)`)
    console.log(`   - 4 questions about productivity`)
    console.log(`   - Charlie completed with perfect score`)
    
    console.log(`\n3. "${hybridTask.title}" (Hybrid, 30pts)`)
    console.log(`   - Quiz (15pts) + Peer review (15pts)`)
    console.log(`   - Diana completed: 12/15 auto + 15/15 peer = 27/30 total`)

    console.log('\n👥 USERS & RATINGS:')
    const updatedUsers = await prisma.user.findMany({
      orderBy: { rating: 'desc' }
    })
    updatedUsers.forEach(user => {
      console.log(`   ${user.name}: ${user.rating} rating`)
    })

    console.log('\n🗳️  VOTING ACTIVITY:')
    console.log(`   - Bob's fitness: 2 approvals (Alice, Charlie)`)
    console.log(`   - Diana's plan: 2 approvals (Alice, Bob)`)

    console.log('\n🚀 TRY THE SYSTEM:')
    console.log('1. Login as alice@example.com (Group Leader)')
    console.log('   - Create new tasks for the group')
    console.log('   - Monitor submission and voting activity')
    console.log('   - View group analytics')
    
    console.log('\n2. Login as bob@example.com, charlie@example.com, or diana@example.com')
    console.log('   - View available tasks')
    console.log('   - Submit evidence for manual tasks')
    console.log('   - Take auto-graded quizzes')
    console.log('   - Vote on peer submissions')
    console.log('   - Track your progress and rating')

    console.log('\n💡 SYSTEM FEATURES DEMONSTRATED:')
    console.log('✅ Multiple task types (Manual, Auto-Quiz, Hybrid)')
    console.log('✅ Evidence submission and peer voting')
    console.log('✅ Automated scoring and rating updates')
    console.log('✅ Flexible approval thresholds')
    console.log('✅ Community-driven verification')
    console.log('✅ Rich feedback and comments')

    console.log('\n🌐 Visit http://localhost:3000 to explore!')
    console.log('   Group invite code: PROD2024\n')

  } catch (error) {
    console.error('Error setting up demo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupEnhancedDemo() 