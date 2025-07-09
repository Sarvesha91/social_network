// Test script to verify authentication logic
const { social_network_backend } = require('./src/declarations/social_network_backend');

async function testAuth() {
  try {
    console.log('Testing authentication logic...');
    
    // Test 1: Check existing user
    console.log('\n=== Test 1: Check existing user ===');
    const existingPrincipal = '2vxsx-fae';
    const existingUser = await social_network_backend.get_user(existingPrincipal);
    console.log('Existing user result:', existingUser);
    
    // Test 2: Check non-existing user
    console.log('\n=== Test 2: Check non-existing user ===');
    const newPrincipal = 'rdmx6-jaaaa-aaaaa-aaadq-cai'; // Random principal
    const newUser = await social_network_backend.get_user(newPrincipal);
    console.log('New user result:', newUser);
    
    // Test 3: Get all users
    console.log('\n=== Test 3: Get all users ===');
    const allUsers = await social_network_backend.get_all_users();
    console.log('All users:', allUsers);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuth();
