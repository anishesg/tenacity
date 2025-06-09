import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    rating: number
    groups?: any[]
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      rating: number
      groups: Array<{
        id: string
        name: string
        inviteCode: string
        role: string
        memberCount: number
        createdAt: Date
        updatedAt: Date
      }>
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rating: number
    groups: any[]
  }
} 