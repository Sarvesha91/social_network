#!/bin/bash

echo "🚀 COMPREHENSIVE SOCIAL MEDIA TESTING"
echo "====================================="
echo "Testing complete multi-user social media functionality"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and check result
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    result=$(eval "$command" 2>&1)
    
    if [[ $result == *"$expected_pattern"* ]]; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        echo "Expected: $expected_pattern"
        echo "Got: $result"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Setup: Clear any existing data
echo -e "${YELLOW}🧹 Setting up clean environment...${NC}"
dfx canister call social_network_backend delete_user 2>/dev/null || true
dfx identity use bob_test 2>/dev/null && dfx canister call social_network_backend delete_user 2>/dev/null || true
dfx identity use charlie_test 2>/dev/null && dfx canister call social_network_backend delete_user 2>/dev/null || true
dfx identity use default

# Test 1: Initial state
run_test "Initial user count is 0" \
    "dfx canister call social_network_backend debug_user_count" \
    "(0 : nat64)"

# Test 2: Create User 1 (Alice)
echo -e "${YELLOW}👤 Creating User 1 (Alice)...${NC}"
dfx identity use default
run_test "Create Alice user" \
    "dfx canister call social_network_backend create_user '(\"alice_frontend\", opt \"Alice Frontend\", opt \"alice@frontend.com\", opt \"Testing frontend authentication flow\", opt \"https://example.com/alice.jpg\", opt \"Frontend City\", opt \"https://alice-frontend.dev\")'" \
    "User created successfully"

# Test 3: Create User 2 (Bob)
echo -e "${YELLOW}👤 Creating User 2 (Bob)...${NC}"
dfx identity new bob_test --storage-mode=plaintext 2>/dev/null || echo "Bob identity exists"
dfx identity use bob_test
run_test "Create Bob user" \
    "dfx canister call social_network_backend create_user '(\"bob_frontend\", opt \"Bob Frontend\", opt \"bob@frontend.com\", opt \"Second user for multi-user testing\", null, opt \"Backend City\", null)'" \
    "User created successfully"

# Test 4: Create User 3 (Charlie)
echo -e "${YELLOW}👤 Creating User 3 (Charlie)...${NC}"
dfx identity new charlie_test --storage-mode=plaintext 2>/dev/null || echo "Charlie identity exists"
dfx identity use charlie_test
run_test "Create Charlie user" \
    "dfx canister call social_network_backend create_user '(\"charlie_frontend\", opt \"Charlie Frontend\", opt \"charlie@frontend.com\", opt \"Third user for comprehensive testing\", null, opt \"Test City\", null)'" \
    "User created successfully"

# Test 5: Verify user count
run_test "Total user count is 3" \
    "dfx canister call social_network_backend debug_user_count" \
    "(3 : nat64)"

# Test 6: Create posts for each user
echo -e "${YELLOW}📝 Creating posts for all users...${NC}"

# Alice posts
dfx identity use default
run_test "Alice creates post 1" \
    "dfx canister call social_network_backend create_post '(\"Hello from Alice! Testing the frontend authentication system 🚀\", vec {\"#frontend\"; \"#authentication\"; \"#testing\"}, vec {})'" \
    "Ok"

run_test "Alice creates post 2" \
    "dfx canister call social_network_backend create_post '(\"The multi-user system is working great! Each user has their own identity 💪\", vec {\"#multiuser\"; \"#identity\"; \"#web3\"}, vec {})'" \
    "Ok"

# Bob posts
dfx identity use bob_test
run_test "Bob creates post 1" \
    "dfx canister call social_network_backend create_post '(\"Hey everyone! Bob here, testing the social features 👋\", vec {\"#social\"; \"#testing\"; \"#hello\"}, vec {})'" \
    "Ok"

run_test "Bob creates post 2" \
    "dfx canister call social_network_backend create_post '(\"Love how each user maintains their own data and posts! 🎉\", vec {\"#data\"; \"#privacy\"; \"#decentralized\"}, vec {})'" \
    "Ok"

# Charlie posts
dfx identity use charlie_test
run_test "Charlie creates post 1" \
    "dfx canister call social_network_backend create_post '(\"Charlie joining the conversation! This social network is amazing 🌟\", vec {\"#amazing\"; \"#social\"; \"#network\"}, vec {})'" \
    "Ok"

# Test 7: Test social interactions
echo -e "${YELLOW}❤️ Testing social interactions...${NC}"

# Get user principals for interactions
ALICE_PRINCIPAL=$(dfx identity use default && dfx identity get-principal)
BOB_PRINCIPAL=$(dfx identity use bob_test && dfx identity get-principal)
CHARLIE_PRINCIPAL=$(dfx identity use charlie_test && dfx identity get-principal)

echo "User principals:"
echo "Alice: $ALICE_PRINCIPAL"
echo "Bob: $BOB_PRINCIPAL"
echo "Charlie: $CHARLIE_PRINCIPAL"
echo ""

# Bob likes Alice's posts
dfx identity use bob_test
run_test "Bob likes Alice's post 1" \
    "dfx canister call social_network_backend like_post '(1)'" \
    "Post liked successfully"

run_test "Bob likes Alice's post 2" \
    "dfx canister call social_network_backend like_post '(2)'" \
    "Post liked successfully"

# Charlie likes everyone's posts
dfx identity use charlie_test
run_test "Charlie likes Alice's post 1" \
    "dfx canister call social_network_backend like_post '(1)'" \
    "Post liked successfully"

run_test "Charlie likes Bob's post 1" \
    "dfx canister call social_network_backend like_post '(3)'" \
    "Post liked successfully"

# Test following
dfx identity use bob_test
run_test "Bob follows Alice" \
    "dfx canister call social_network_backend follow_user '(principal \"$ALICE_PRINCIPAL\")'" \
    "User followed successfully"

dfx identity use charlie_test
run_test "Charlie follows Alice" \
    "dfx canister call social_network_backend follow_user '(principal \"$ALICE_PRINCIPAL\")'" \
    "User followed successfully"

run_test "Charlie follows Bob" \
    "dfx canister call social_network_backend follow_user '(principal \"$BOB_PRINCIPAL\")'" \
    "User followed successfully"

# Test 8: Verify data integrity
echo -e "${YELLOW}🔍 Verifying data integrity...${NC}"

# Check posts count
POSTS_COUNT=$(dfx canister call social_network_backend get_all_posts | grep -o "post_id" | wc -l)
if [ "$POSTS_COUNT" -eq 5 ]; then
    echo -e "${GREEN}✅ PASSED: Total posts count is 5${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Expected 5 posts, got $POSTS_COUNT${NC}"
    ((TESTS_FAILED++))
fi

# Check Alice's followers
ALICE_FOLLOWERS=$(dfx canister call social_network_backend get_followers "(principal \"$ALICE_PRINCIPAL\")" | grep -o "principal" | wc -l)
if [ "$ALICE_FOLLOWERS" -eq 2 ]; then
    echo -e "${GREEN}✅ PASSED: Alice has 2 followers${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Expected Alice to have 2 followers, got $ALICE_FOLLOWERS${NC}"
    ((TESTS_FAILED++))
fi

# Test 9: Test user profile retrieval
echo -e "${YELLOW}👤 Testing user profile retrieval...${NC}"

dfx identity use default
run_test "Alice can retrieve her own profile" \
    "dfx canister call social_network_backend get_user '(principal \"$ALICE_PRINCIPAL\")'" \
    "alice_frontend"

dfx identity use bob_test
run_test "Bob can retrieve Alice's profile" \
    "dfx canister call social_network_backend get_user '(principal \"$ALICE_PRINCIPAL\")'" \
    "alice_frontend"

# Final summary
echo ""
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "==============="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! The social media backend is working perfectly!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Frontend Testing Instructions:${NC}"
    echo "1. Open: http://be2us-64aaa-aaaaa-qaabq-cai.localhost:4943/"
    echo "2. Click 'Join SocialNet' to test new user signup"
    echo "3. Create Internet Identity anchor (e.g., 10001)"
    echo "4. Fill profile form and verify navigation to main app"
    echo "5. Test creating posts, viewing feed, discovering users"
    echo "6. Logout and test 'Sign In' with existing anchor"
    echo "7. Create second user with different anchor (e.g., 10002)"
    echo "8. Test multi-user interactions (likes, follows, comments)"
else
    echo -e "${RED}❌ Some tests failed. Please check the backend implementation.${NC}"
fi

# Reset to default identity
dfx identity use default

echo ""
echo -e "${YELLOW}🔧 Backend is ready for frontend testing!${NC}"
