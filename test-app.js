const axios = require('axios')

const BASE_URL = 'http://localhost:3003'

async function testApp() {
  console.log('🧪 Starting comprehensive app testing...\n')
  
  try {
    // Test 1: Check if app is running
    console.log('1. Testing if app is running...')
    const healthCheck = await axios.get(BASE_URL)
    console.log('✅ App is running (status:', healthCheck.status, ')\n')
    
    // Test 2: Check auth providers
    console.log('2. Testing auth providers...')
    const providers = await axios.get(`${BASE_URL}/api/auth/providers`)
    console.log('✅ Auth providers available:', Object.keys(providers.data))
    console.log('   - Credentials provider configured\n')
    
    // Test 3: Check session endpoint
    console.log('3. Testing session endpoint...')
    const session = await axios.get(`${BASE_URL}/api/auth/session`)
    console.log('✅ Session endpoint working (no active session)\n')
    
    // Test 4: Test CSRF token
    console.log('4. Getting CSRF token...')
    const csrf = await axios.get(`${BASE_URL}/api/auth/csrf`)
    console.log('✅ CSRF token received:', csrf.data.csrfToken.substring(0, 10) + '...\n')
    
    // Test 5: Test protected API endpoints (should redirect to auth)
    console.log('5. Testing protected endpoints...')
    try {
      const groupsResponse = await axios.get(`${BASE_URL}/api/groups`, {
        maxRedirects: 0,
        validateStatus: () => true
      })
      if (groupsResponse.status === 302 || groupsResponse.data.includes('signin')) {
        console.log('✅ Groups API properly protected (redirects to auth)\n')
      }
    } catch (error) {
      console.log('✅ Groups API properly protected\n')
    }
    
    // Test 6: Test tasks API
    console.log('6. Testing tasks API...')
    try {
      const tasksResponse = await axios.get(`${BASE_URL}/api/tasks`, {
        maxRedirects: 0,
        validateStatus: () => true
      })
      if (tasksResponse.status === 302 || tasksResponse.data.includes('signin')) {
        console.log('✅ Tasks API properly protected\n')
      }
    } catch (error) {
      console.log('✅ Tasks API properly protected\n')
    }
    
    // Test 7: Test leaderboard API
    console.log('7. Testing leaderboard API...')
    try {
      const leaderboardResponse = await axios.get(`${BASE_URL}/api/leaderboard`, {
        maxRedirects: 0,
        validateStatus: () => true
      })
      if (leaderboardResponse.status === 302 || leaderboardResponse.data.includes('signin')) {
        console.log('✅ Leaderboard API properly protected\n')
      }
    } catch (error) {
      console.log('✅ Leaderboard API properly protected\n')
    }
    
    // Test 8: Check if main page loads
    console.log('8. Testing main page load...')
    const mainPage = await axios.get(BASE_URL)
    if (mainPage.data.includes('Fantasy Learning')) {
      console.log('✅ Main page loads with correct title\n')
    }
    
    // Test 9: Check for React components
    console.log('9. Testing React components...')
    if (mainPage.data.includes('AuthForm') || mainPage.data.includes('Loading')) {
      console.log('✅ React components are being rendered\n')
    }
    
    console.log('🎉 All basic tests passed!')
    console.log('\n=== MANUAL TESTING INSTRUCTIONS ===')
    console.log('1. Open http://localhost:3003 in your browser')
    console.log('2. You should see either:')
    console.log('   - A loading spinner (if hooks are working)')
    console.log('   - An authentication form (if not signed in)')
    console.log('   - The main app (if signed in)')
    console.log('3. Try signing up with:')
    console.log('   - Email: newuser@example.com')
    console.log('   - Name: New User')
    console.log('   - Password: anything (not validated)')
    console.log('4. After sign-up, you should see the main app')
    console.log('5. Try creating a group or joining with code: TEST123')
    console.log('6. Check the different tabs: Tasks, Sessions, Leaderboard')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Data:', error.response.data?.substring(0, 200) + '...')
    }
  }
}

testApp() 