import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from './prisma'
import { generateRandomTopic, generateTopicContent } from './openai'
import { getWeekStart } from './utils'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export const sessionQueue = new Queue('session-creation', {
  connection: redis,
})

export interface SessionCreationJobData {
  groupId: string
}

// Schedule weekly session creation
export async function scheduleWeeklySessions() {
  // Remove existing jobs
  await sessionQueue.obliterate({ force: true })
  
  // Schedule for every Monday at 00:00 UTC
  await sessionQueue.add(
    'create-weekly-sessions',
    {},
    {
      repeat: {
        pattern: '0 0 * * 1', // Every Monday at midnight
        tz: 'UTC',
      },
    }
  )
}

// Worker to process session creation
export const sessionWorker = new Worker(
  'session-creation',
  async (job: Job) => {
    console.log('Processing job:', job.name)
    
    if (job.name === 'create-weekly-sessions') {
      await createWeeklySessionsForAllGroups()
    }
  },
  {
    connection: redis,
  }
)

async function createWeeklySessionsForAllGroups() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        groupUsers: {
          include: {
            user: true,
          },
        },
      },
    })

    for (const group of groups) {
      if (group.groupUsers.length >= 2) {
        await createSessionsForGroup(group.id, group.groupUsers.map((gu: any) => gu.user))
      }
    }
  } catch (error) {
    console.error('Error creating weekly sessions:', error)
    throw error
  }
}

async function createSessionsForGroup(groupId: string, users: any[]) {
  try {
    // Sort users by rating for pairing
    const sortedUsers = users.sort((a, b) => b.rating - a.rating)
    
    // Generate topic
    const topicTitle = await generateRandomTopic()
    const generatedContent = await generateTopicContent(topicTitle)
    
    // Create topic in database
    const topic = await prisma.topic.create({
      data: {
        title: generatedContent.title,
        description: generatedContent.description,
        contentItems: {
          create: generatedContent.contentItems.map((item, index) => ({
            order: index + 1,
            title: item.title,
            body: item.body,
            questions: {
              create: item.questions.map(q => ({
                prompt: q.prompt,
                choices: JSON.stringify(q.choices),
                answerIndex: q.answerIndex,
                points: q.points,
              })),
            },
          })),
        },
      },
    })

    // Create sessions by pairing adjacent users
    const weekStart = getWeekStart(new Date())
    
    for (let i = 0; i < sortedUsers.length - 1; i += 2) {
      const playerA = sortedUsers[i]
      const playerB = sortedUsers[i + 1]
      
      await prisma.session.create({
        data: {
          groupId,
          weekStart,
          topicId: topic.id,
          playerAId: playerA.id,
          playerBId: playerB.id,
        },
      })
    }
    
    console.log(`Created sessions for group ${groupId} with topic: ${topicTitle}`)
  } catch (error) {
    console.error(`Error creating sessions for group ${groupId}:`, error)
    throw error
  }
}

// Initialize the queue system
export async function initializeQueue() {
  await scheduleWeeklySessions()
  console.log('Queue system initialized')
} 