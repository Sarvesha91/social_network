# Frontend Testing Plan

## Current Status
✅ Backend is working perfectly with multiple users, posts, likes, follows
✅ dfx identities can create users and interact with all features
❓ Need to test actual Internet Identity frontend flow

## Frontend Flow to Test

### 1. New User Signup Flow
1. Open: http://be2us-64aaa-aaaaa-qaabq-cai.localhost:4943/
2. Click "Join SocialNet" button
3. Internet Identity popup opens
4. Create new anchor (e.g., 10001)
5. Should redirect to profile creation form
6. Fill form with test data
7. Submit form
8. Should navigate to main app (feed view)
9. Verify user can see navigation, create posts, etc.

### 2. Existing User Login Flow
1. Logout from previous user
2. Click "Sign In" button  
3. Use same Internet Identity anchor (10001)
4. Should automatically navigate to main app
5. Should see previous profile data and posts

### 3. Multi-User Testing
1. Logout from User 1
2. Create User 2 with different anchor (10002)
3. Verify User 2 has separate profile/data
4. Test interactions between users

## Issues to Debug
- Profile creation not navigating to main app
- Login not recognizing existing users
- Console errors in browser dev tools

## Test Data for Forms
User 1:
- Username: frontend_user1
- Full Name: Frontend Test User 1
- Email: user1@test.com
- Bio: Testing the frontend authentication flow
- Location: Test City

User 2:
- Username: frontend_user2  
- Full Name: Frontend Test User 2
- Email: user2@test.com
- Bio: Second user for multi-user testing
- Location: Another City
