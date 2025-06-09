import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GeneratedContent {
  title: string
  description: string
  contentItems: {
    title: string
    body: string
    questions: {
      prompt: string
      choices: string[]
      answerIndex: number
      points: number
    }[]
  }[]
}

export async function generateTopicContent(topicTitle: string): Promise<GeneratedContent> {
  const prompt = `Create educational content for the topic: "${topicTitle}"

Please generate:
1. A comprehensive learning module with 3-4 content sections
2. Each section should have 2-3 multiple choice questions
3. Content should be engaging and educational
4. Questions should test understanding of the material

Format the response as JSON with this structure:
{
  "title": "Topic Title",
  "description": "Brief description of what students will learn",
  "contentItems": [
    {
      "title": "Section Title",
      "body": "Educational content in markdown format (2-3 paragraphs)",
      "questions": [
        {
          "prompt": "Question text",
          "choices": ["Option A", "Option B", "Option C", "Option D"],
          "answerIndex": 0,
          "points": 1
        }
      ]
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create engaging, accurate, and well-structured learning materials."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    return JSON.parse(content) as GeneratedContent
  } catch (error) {
    console.error('Error generating content:', error)
    throw new Error('Failed to generate content')
  }
}

export async function generateRandomTopic(): Promise<string> {
  const prompt = `Generate a random educational topic that would be interesting for adult learners. 
  Topics should be from areas like science, history, technology, psychology, economics, philosophy, or current events.
  Return only the topic title, nothing else.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 50
    })

    const topic = completion.choices[0]?.message?.content?.trim()
    if (!topic) {
      throw new Error('No topic generated')
    }

    return topic
  } catch (error) {
    console.error('Error generating topic:', error)
    throw new Error('Failed to generate topic')
  }
} 