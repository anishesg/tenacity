import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWeekStart } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = await request.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Find the user and check if they're a group admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const groupUser = await prisma.groupUser.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id
        }
      }
    })

    if (!groupUser || groupUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only group admins can create sessions' }, { status: 403 })
    }

    // Get all users in the group
    const groupUsers = await prisma.groupUser.findMany({
      where: { groupId },
      include: { user: true }
    })

    if (groupUsers.length < 2) {
      return NextResponse.json({ error: 'Group needs at least 2 members for sessions' }, { status: 400 })
    }

    const users = groupUsers.map(gu => gu.user).sort((a, b) => b.rating - a.rating)
    const weekStart = getWeekStart(new Date())

    // Check if sessions already exist for this week
    const existingSessions = await prisma.learningSession.findMany({
      where: {
        groupId,
        weekStart
      }
    })

    if (existingSessions.length > 0) {
      return NextResponse.json({ error: 'Sessions already exist for this week' }, { status: 400 })
    }

    // Create a default topic if none exists
    let topic = await prisma.topic.findFirst()
    
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          title: 'JavaScript Fundamentals',
          description: 'Learn the basics of JavaScript programming',
          contentItems: {
            create: [
              {
                order: 1,
                title: 'Variables and Data Types',
                body: '# JavaScript Variables\n\nJavaScript has several data types:\n\n- **String**: Text data\n- **Number**: Numeric data\n- **Boolean**: True/false values\n- **Array**: Lists of data\n- **Object**: Key-value pairs\n\n## Variable Declaration\n\n```javascript\nlet name = "John";\nconst age = 25;\nvar isStudent = true;\n```',
                questions: {
                  create: [
                    {
                      prompt: 'Which keyword declares a constant variable?',
                      choices: JSON.stringify(['var', 'let', 'const', 'static']),
                      answerIndex: 2,
                      points: 10
                    },
                    {
                      prompt: 'What data type is "Hello World"?',
                      choices: JSON.stringify(['Number', 'String', 'Boolean', 'Array']),
                      answerIndex: 1,
                      points: 10
                    }
                  ]
                }
              },
              {
                order: 2,
                title: 'Functions and Scope',
                body: '# JavaScript Functions\n\nFunctions are reusable blocks of code:\n\n```javascript\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconst add = (a, b) => a + b;\n```\n\n## Scope\n\n- **Global scope**: Variables accessible everywhere\n- **Function scope**: Variables only accessible within function\n- **Block scope**: Variables within {} blocks',
                questions: {
                  create: [
                    {
                      prompt: 'Which creates an arrow function?',
                      choices: JSON.stringify(['function() {}', '() => {}', 'func() {}', 'arrow() {}']),
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
    }

    // Create sessions by pairing adjacent users (by rating)
    const sessions = []
    for (let i = 0; i < users.length - 1; i += 2) {
      const playerA = users[i]
      const playerB = users[i + 1]
      
      const learningSession = await prisma.learningSession.create({
        data: {
          groupId,
          weekStart,
          topicId: topic.id,
          playerAId: playerA.id,
          playerBId: playerB.id,
          playerAScore: 0,
          playerBScore: 0,
          completed: false
        },
        include: {
          playerA: true,
          playerB: true,
          topic: {
            include: {
              contentItems: {
                include: {
                  questions: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          }
        }
      })
      
      sessions.push(learningSession)
    }

    return NextResponse.json({
      message: `Created ${sessions.length} learning sessions`,
      sessions: sessions.map(s => ({
        id: s.id,
        playerA: s.playerA.name || s.playerA.email,
        playerB: s.playerB.name || s.playerB.email,
        topic: s.topic?.title || 'Default Topic'
      }))
    })

  } catch (error) {
    console.error('Error creating sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 