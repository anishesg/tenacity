const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addUserToNMLABSM() {
  try {
    console.log('🔄 Adding anishesg@gmail.com to NMLABSM group...')

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'anishesg@gmail.com' }
    })

    if (!user) {
      console.log('❌ User anishesg@gmail.com not found')
      return
    }

    console.log(`✅ Found user: ${user.name || user.email}`)

    // Find NMLABSM group
    const nmlabsmGroup = await prisma.group.findUnique({
      where: { inviteCode: 'NMLABSM' }
    })

    if (!nmlabsmGroup) {
      console.log('❌ NMLABSM group not found')
      return
    }

    console.log(`✅ Found NMLABSM group: ${nmlabsmGroup.name}`)

    // Remove user from all other groups
    const existingMemberships = await prisma.groupUser.findMany({
      where: { userId: user.id },
      include: { group: true }
    })

    console.log(`📋 User is currently in ${existingMemberships.length} groups`)

    for (const membership of existingMemberships) {
      if (membership.groupId !== nmlabsmGroup.id) {
        await prisma.groupUser.delete({
          where: {
            groupId_userId: {
              groupId: membership.groupId,
              userId: user.id
            }
          }
        })
        console.log(`🗑️  Removed from group: ${membership.group.name}`)
      }
    }

    // Add user to NMLABSM group
    const existingNMLABSMMembership = await prisma.groupUser.findUnique({
      where: {
        groupId_userId: {
          groupId: nmlabsmGroup.id,
          userId: user.id
        }
      }
    })

    if (existingNMLABSMMembership) {
      console.log('✅ User is already in NMLABSM group')
    } else {
      await prisma.groupUser.create({
        data: {
          groupId: nmlabsmGroup.id,
          userId: user.id,
          role: 'member'
        }
      })
      console.log('✅ Added user to NMLABSM group')
    }

    // Verify final state
    const finalMemberships = await prisma.groupUser.findMany({
      where: { userId: user.id },
      include: { group: true }
    })

    console.log('\n🎉 Final group memberships:')
    finalMemberships.forEach(membership => {
      console.log(`   - ${membership.group.name} (${membership.group.inviteCode}) - ${membership.role}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addUserToNMLABSM()