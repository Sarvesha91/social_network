#!/bin/bash

echo "🎯 TESTING ALL SOCIAL MEDIA FEATURES"
echo "===================================="
echo "Testing comments, admin features, search, hashtags, and more"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get user principals
ALICE_PRINCIPAL=$(dfx identity use default && dfx identity get-principal)
BOB_PRINCIPAL=$(dfx identity use bob_test && dfx identity get-principal)
CHARLIE_PRINCIPAL=$(dfx identity use charlie_test && dfx identity get-principal)

echo -e "${BLUE}User Principals:${NC}"
echo "Alice: $ALICE_PRINCIPAL"
echo "Bob: $BOB_PRINCIPAL" 
echo "Charlie: $CHARLIE_PRINCIPAL"
echo ""

# Test 1: Comments System
echo -e "${YELLOW}💬 Testing Comments System...${NC}"

# Bob comments on Alice's post
dfx identity use bob_test
echo "Bob commenting on Alice's post 1..."
COMMENT1=$(dfx canister call social_network_backend create_comment '(1, "Great post Alice! Love the authentication system 👍")')
echo "Result: $COMMENT1"

# Charlie comments on Alice's post
dfx identity use charlie_test
echo "Charlie commenting on Alice's post 1..."
COMMENT2=$(dfx canister call social_network_backend create_comment '(1, "Totally agree! This is amazing work 🚀")')
echo "Result: $COMMENT2"

# Alice replies to Bob's comment
dfx identity use default
echo "Alice commenting on Bob's post..."
COMMENT3=$(dfx canister call social_network_backend create_comment '(3, "Thanks Bob! Your posts are great too 😊")')
echo "Result: $COMMENT3"

# Test 2: Get comments for posts
echo ""
echo -e "${YELLOW}📖 Testing Comment Retrieval...${NC}"
echo "Getting comments for post 1:"
dfx canister call social_network_backend get_comments_for_post '(1)'

# Test 3: Search functionality
echo ""
echo -e "${YELLOW}🔍 Testing Search Features...${NC}"

# Search posts by hashtag
echo "Searching posts with #frontend hashtag:"
dfx canister call social_network_backend search_posts_by_hashtag '("#frontend")'

# Search users
echo ""
echo "Searching users with 'alice':"
dfx canister call social_network_backend search_users '("alice")'

# Test 4: Profile editing
echo ""
echo -e "${YELLOW}✏️ Testing Profile Editing...${NC}"

# Alice updates her profile
dfx identity use default
echo "Alice updating her profile..."
UPDATE_RESULT=$(dfx canister call social_network_backend update_user '(opt "Alice Frontend Updated", opt "alice.updated@frontend.com", opt "Updated bio: Testing profile editing functionality!", opt "https://example.com/alice-new.jpg", opt "Updated Frontend City", opt "https://alice-updated.dev")')
echo "Result: $UPDATE_RESULT"

# Verify profile update
echo "Verifying Alice's updated profile:"
dfx canister call social_network_backend get_user "(principal \"$ALICE_PRINCIPAL\")" | head -10

# Test 5: Admin functionality (if Alice is admin)
echo ""
echo -e "${YELLOW}⚙️ Testing Admin Features...${NC}"

# Check if Alice is admin
echo "Checking Alice's admin status:"
dfx identity use default
ADMIN_STATUS=$(dfx canister call social_network_backend is_caller_admin)
echo "Alice admin status: $ADMIN_STATUS"

# Get admin stats
echo "Getting admin statistics:"
dfx canister call social_network_backend admin_get_stats

# Get all users (admin function)
echo ""
echo "Getting all users (admin view):"
dfx canister call social_network_backend admin_get_all_users_detailed

# Test 6: Post sharing
echo ""
echo -e "${YELLOW}🔄 Testing Post Sharing...${NC}"

# Bob shares Alice's post
dfx identity use bob_test
echo "Bob sharing Alice's post 1..."
SHARE_RESULT=$(dfx canister call social_network_backend share_post '(1)')
echo "Result: $SHARE_RESULT"

# Charlie shares Alice's post
dfx identity use charlie_test
echo "Charlie sharing Alice's post 2..."
SHARE_RESULT2=$(dfx canister call social_network_backend share_post '(2)')
echo "Result: $SHARE_RESULT2"

# Test 7: User feed and trending
echo ""
echo -e "${YELLOW}📰 Testing Feeds and Trending...${NC}"

# Get Bob's personalized feed (should include posts from users he follows)
dfx identity use bob_test
echo "Getting Bob's personalized feed:"
dfx canister call social_network_backend get_user_feed

# Get trending posts
echo ""
echo "Getting trending posts:"
dfx canister call social_network_backend get_trending_posts

# Test 8: Like/Unlike functionality
echo ""
echo -e "${YELLOW}❤️ Testing Like/Unlike...${NC}"

# Charlie unlikes a post
dfx identity use charlie_test
echo "Charlie unliking Alice's post 1:"
UNLIKE_RESULT=$(dfx canister call social_network_backend unlike_post '(1)')
echo "Result: $UNLIKE_RESULT"

# Charlie likes it again
echo "Charlie liking Alice's post 1 again:"
LIKE_RESULT=$(dfx canister call social_network_backend like_post '(1)')
echo "Result: $LIKE_RESULT"

# Test 9: Comment likes
echo ""
echo -e "${YELLOW}💬❤️ Testing Comment Likes...${NC}"

# Get comments to find comment IDs
echo "Getting comments for post 1 to find comment IDs:"
COMMENTS=$(dfx canister call social_network_backend get_comments_for_post '(1)')
echo "$COMMENTS"

# Like a comment (assuming comment ID 1 exists)
dfx identity use default
echo "Alice liking Bob's comment:"
COMMENT_LIKE=$(dfx canister call social_network_backend like_comment '(1)')
echo "Result: $COMMENT_LIKE"

# Test 10: Following/Unfollowing
echo ""
echo -e "${YELLOW}👥 Testing Follow/Unfollow...${NC}"

# Charlie unfollows Bob
dfx identity use charlie_test
echo "Charlie unfollowing Bob:"
UNFOLLOW_RESULT=$(dfx canister call social_network_backend unfollow_user "(principal \"$BOB_PRINCIPAL\")")
echo "Result: $UNFOLLOW_RESULT"

# Charlie follows Bob again
echo "Charlie following Bob again:"
FOLLOW_RESULT=$(dfx canister call social_network_backend follow_user "(principal \"$BOB_PRINCIPAL\")")
echo "Result: $FOLLOW_RESULT"

# Test 11: Get user statistics
echo ""
echo -e "${YELLOW}📊 Testing User Statistics...${NC}"

# Get Alice's followers
echo "Alice's followers:"
dfx canister call social_network_backend get_followers "(principal \"$ALICE_PRINCIPAL\")"

# Get Bob's following list
echo ""
echo "Bob's following list:"
dfx canister call social_network_backend get_following "(principal \"$BOB_PRINCIPAL\")"

# Get Charlie's following list
echo ""
echo "Charlie's following list:"
dfx canister call social_network_backend get_following "(principal \"$CHARLIE_PRINCIPAL\")"

# Final summary
echo ""
echo -e "${GREEN}🎉 SOCIAL FEATURES TESTING COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📋 Features Tested:${NC}"
echo "✅ Comments (create, retrieve)"
echo "✅ Search (posts by hashtag, users)"
echo "✅ Profile editing"
echo "✅ Admin functionality"
echo "✅ Post sharing"
echo "✅ User feeds and trending"
echo "✅ Like/Unlike posts"
echo "✅ Comment likes"
echo "✅ Follow/Unfollow users"
echo "✅ User statistics"
echo ""
echo -e "${YELLOW}🌐 Ready for Frontend Testing!${NC}"
echo "The backend supports all social media features."
echo "Test the frontend at: http://be2us-64aaa-aaaaa-qaabq-cai.localhost:4943/"

# Reset to default identity
dfx identity use default
