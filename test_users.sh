#!/bin/bash

echo "🧪 Testing Social Network Backend Functionality"
echo "=============================================="

# Test 1: Check initial state
echo "📊 Initial user count:"
dfx canister call social_network_backend debug_user_count

# Test 2: Create User 1 (Alice)
echo ""
echo "👤 Creating User 1 (Alice)..."
RESULT1=$(dfx canister call social_network_backend create_user '("alice_dev", opt "Alice Developer", opt "alice@example.com", opt "I love coding and building dApps!", opt "https://example.com/alice.jpg", opt "San Francisco", opt "https://alice.dev")')
echo "Result: $RESULT1"

# Test 3: Create User 2 (Bob) - using different dfx identity
echo ""
echo "👤 Creating User 2 (Bob) with different identity..."
dfx identity new bob_test --storage-mode=plaintext || echo "Identity already exists"
dfx identity use bob_test
RESULT2=$(dfx canister call social_network_backend create_user '("bob_builder", opt "Bob Builder", opt "bob@example.com", opt "Building the future one block at a time", null, opt "New York", null)')
echo "Result: $RESULT2"

# Test 4: Switch back to default identity and create posts for Alice
echo ""
echo "📝 Creating posts for Alice..."
dfx identity use default
POST1=$(dfx canister call social_network_backend create_post '("Hello world! This is my first post on the decentralized social network! 🚀", vec {"#hello"; "#web3"; "#icp"}, vec {})')
echo "Alice Post 1: $POST1"

POST2=$(dfx canister call social_network_backend create_post '("Just deployed my first canister! The future is decentralized 💪", vec {"#canister"; "#deployment"; "#blockchain"}, vec {})')
echo "Alice Post 2: $POST2"

# Test 5: Create posts for Bob
echo ""
echo "📝 Creating posts for Bob..."
dfx identity use bob_test
POST3=$(dfx canister call social_network_backend create_post '("Building amazing dApps with Internet Computer! Who else is excited about Web3? 🌐", vec {"#dapps"; "#web3"; "#building"}, vec {})')
echo "Bob Post 1: $POST3"

# Test 6: Test interactions - Bob likes Alice's posts
echo ""
echo "❤️ Bob likes Alice's posts..."
ALICE_PRINCIPAL=$(dfx identity use default && dfx identity get-principal)
dfx identity use bob_test
LIKE1=$(dfx canister call social_network_backend like_post '(1)')
echo "Bob likes post 1: $LIKE1"
LIKE2=$(dfx canister call social_network_backend like_post '(2)')
echo "Bob likes post 2: $LIKE2"

# Test 7: Bob follows Alice
echo ""
echo "👥 Bob follows Alice..."
FOLLOW=$(dfx canister call social_network_backend follow_user "(principal \"$ALICE_PRINCIPAL\")")
echo "Follow result: $FOLLOW"

# Test 8: Check final state
echo ""
echo "📊 Final statistics:"
dfx identity use default
echo "Total users:"
dfx canister call social_network_backend debug_user_count

echo ""
echo "All users:"
dfx canister call social_network_backend get_all_users

echo ""
echo "All posts:"
dfx canister call social_network_backend get_all_posts

echo ""
echo "Bob's following list:"
BOB_PRINCIPAL=$(dfx identity use bob_test && dfx identity get-principal)
dfx canister call social_network_backend get_following "(principal \"$BOB_PRINCIPAL\")"

echo ""
echo "✅ Backend testing complete!"
echo "🌐 Now test the frontend at: http://be2us-64aaa-aaaaa-qaabq-cai.localhost:4943/"
echo ""
echo "🔑 Test identities created:"
echo "  - default (Alice): $ALICE_PRINCIPAL"
echo "  - bob_test (Bob): $BOB_PRINCIPAL"
echo ""
echo "📋 To test frontend:"
echo "  1. Open the app in browser"
echo "  2. Click 'Sign In' and use Internet Identity"
echo "  3. Create new anchor for testing or use existing"
echo "  4. Verify profile creation and navigation works"
echo "  5. Test creating posts, liking, following"

# Reset to default identity
dfx identity use default
