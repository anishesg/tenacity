import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text', placeholder: 'Your Name (for sign up)' },
        action: { label: 'Action', type: 'hidden' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required')
        }

        const action = credentials.action || 'signin'

        if (action === 'signup') {
          // Sign up flow
          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (existingUser) {
            throw new Error('User already exists with this email')
          }

          if (!credentials.name?.trim()) {
            throw new Error('Name is required for sign up')
          }

          // Create new user
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name.trim(),
              rating: 1200, // Starting rating
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            rating: user.rating
          }
        } else {
          // Sign in flow
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              groupUsers: {
                include: {
                  group: true
                }
              }
            }
          })

          if (!user) {
            throw new Error('No account found with this email. Please sign up first.')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            rating: user.rating,
            groups: user.groupUsers.map(gu => gu.group)
          }
        }
      }
    }),
    // Email provider disabled for testing - uncomment when email is configured
    /*
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    */
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rating = user.rating
        token.groups = user.groups || []
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.rating = token.rating as number
        
        // Fetch fresh group data
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            groupUsers: {
              include: {
                group: {
                  include: {
                    _count: {
                      select: {
                        groupUsers: true
                      }
                    }
                  }
                }
              }
            }
          }
        })

        session.user.groups = user?.groupUsers.map(gu => ({
          ...gu.group,
          role: gu.role,
          memberCount: gu.group._count.groupUsers
        })) || []
      }
      return session
    }
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed up: ${user.email}`)
      } else {
        console.log(`User signed in: ${user.email}`)
      }
    }
  }
} 