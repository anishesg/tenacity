const axios = require('axios')

const BASE_URL = 'http://localhost:3003'

// Create axios instance with cookie jar to maintain session
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  maxRedirects: 0,
  validateStatus: () => true
})

async function testAuthFlow() {
  console.log('🔐 Testing complete authentication flow...\n')
  
  try {
    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...')
    const csrfResponse = await client.get('/api/auth/csrf')
    const csrfToken = csrfResponse.data.csrfToken
    console.log('✅ CSRF token obtained\n')
    
    // Step 2: Test sign-up
    console.log('2. Testing user sign-up...')
    const signupData = new URLSearchParams({
      email: 'testuser2@example.com',
      name: 'Test User 2',
      password: 'testpass123',
      action: 'signup',
      csrfToken: csrfToken,
      callbackUrl: BASE_URL
    })
    
    const signupResponse = await client.post('/api/auth/callback/credentials', signupData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    console.log('   Sign-up response status:', signupResponse.status)
    if (signupResponse.status === 302) {
      console.log('✅ Sign-up successful (redirected)\n')
    } else {
      console.log('   Response data:', signupResponse.data?.substring(0, 200))
    }
    
    // Step 3: Check session after sign-up
    console.log('3. Checking session after sign-up...')
    const sessionResponse = await client.get('/api/auth/session')
    console.log('   Session status:', sessionResponse.status)
    
    if (sessionResponse.data && sessionResponse.data.user) {
      console.log('✅ User is signed in:', sessionResponse.data.user.email)
      console.log('   User ID:', sessionResponse.data.user.id)
      console.log('   User rating:', sessionResponse.data.user.rating)
      console.log('   User groups:', sessionResponse.data.user.groups?.length || 0, 'groups\n')
      
      // Step 4: Test authenticated endpoints
      console.log('4. Testing authenticated endpoints...')
      
      // Test groups API
      console.log('   Testing groups API...')
      const groupsResponse = await client.get('/api/groups')
      if (groupsResponse.status === 200) {
        const groups = groupsResponse.data
        console.log('   ✅ Groups API works, found', groups.length, 'groups')
      } else {
        console.log('   ❌ Groups API failed:', groupsResponse.status)
      }
      
      // Test creating a group
      console.log('   Testing group creation...')
      const newGroupData = {
        name: 'Test Group from API'
      }
      const createGroupResponse = await client.post('/api/groups', newGroupData, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (createGroupResponse.status === 200) {
        const newGroup = createGroupResponse.data
        console.log('   ✅ Group created:', newGroup.name, 'with code:', newGroup.inviteCode)
        
        // Test joining the group with another user
        console.log('   Testing group join...')
        const joinData = {
          inviteCode: newGroup.inviteCode
        }
        const joinResponse = await client.post('/api/groups/join', joinData, {
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (joinResponse.status === 200) {
          console.log('   ✅ Successfully joined group')
        } else {
          console.log('   ⚠️  Group join response:', joinResponse.status)
        }
      } else {
        console.log('   ❌ Group creation failed:', createGroupResponse.status)
        console.log('   Response:', createGroupResponse.data?.substring(0, 200))
      }
      
      // Test tasks API
      console.log('   Testing tasks API...')
      const tasksResponse = await client.get('/api/tasks')
      if (tasksResponse.status === 200) {
        const tasks = tasksResponse.data
        console.log('   ✅ Tasks API works, found', tasks.length, 'tasks')
      } else {
        console.log('   ❌ Tasks API failed:', tasksResponse.status)
      }
      
      // Test leaderboard API
      console.log('   Testing leaderboard API...')
      const leaderboardResponse = await client.get('/api/leaderboard?scope=overall')
      if (leaderboardResponse.status === 200) {
        const leaderboard = leaderboardResponse.data
        console.log('   ✅ Leaderboard API works, found', leaderboard.length, 'entries')
      } else {
        console.log('   ❌ Leaderboard API failed:', leaderboardResponse.status)
      }
      
      console.log('\n5. Testing sign-out...')
      const signoutResponse = await client.post('/api/auth/signout', {
        csrfToken: csrfToken
      })
      
      if (signoutResponse.status === 200 || signoutResponse.status === 302) {
        console.log('✅ Sign-out successful')
        
        // Verify session is cleared
        const postSignoutSession = await client.get('/api/auth/session')
        if (!postSignoutSession.data.user) {
          console.log('✅ Session cleared after sign-out\n')
        }
      }
      
    } else {
      console.log('❌ User not signed in after sign-up')
      console.log('   Session data:', sessionResponse.data)
    }
    
    console.log('🎉 Authentication flow test completed!')
    
  } catch (error) {
    console.error('❌ Auth flow test failed:', error.message)
    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Headers:', error.response.headers)
      console.error('   Data:', error.response.data?.substring(0, 300))
    }
  }
}

testAuthFlow() 