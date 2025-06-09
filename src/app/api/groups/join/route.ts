import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteCode } = await request.json()
    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the group
    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        groupUsers: {
          include: {
            user: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if user is already in the group
    const existingMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Add user to group
    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: group.id
      }
    })

    // Return updated group
    const updatedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        groupUsers: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 