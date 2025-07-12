use ic_cdk::api::caller;
use ic_principal::Principal;
use std::collections::{HashMap, HashSet};
use candid::{CandidType};
use once_cell::sync::Lazy;
use std::sync::Mutex; // Import Mutex for mutable access

#[derive(CandidType, Clone)]
pub struct User {
    user_id: Principal,
    username: String,
    full_name: Option<String>,
    email: Option<String>,
    bio: Option<String>,
    profile_pic: Option<String>,
    location: Option<String>,
    website: Option<String>,
    is_admin: bool,
    created_at: u64,
    last_active: u64,
}

#[derive(CandidType, Clone)]
pub struct AdminStats {
    total_users: u64,
    total_admins: u64,
    recent_registrations: u64, // Last 24 hours
}

#[derive(CandidType, Clone)]
pub struct Post {
    post_id: u64,
    author_id: Principal,
    content: String,
    created_at: u64,
    updated_at: Option<u64>,
    likes: u64,
    comments_count: u64,
    shares_count: u64,
    hashtags: Vec<String>,
    mentions: Vec<Principal>,
    media_urls: Vec<String>,
    is_deleted: bool,
}

#[derive(CandidType, Clone)]
pub struct Comment {
    comment_id: u64,
    post_id: u64,
    author_id: Principal,
    content: String,
    created_at: u64,
    updated_at: Option<u64>,
    likes: u64,
    is_deleted: bool,
}

#[derive(CandidType, Clone)]
pub struct Follow {
    follower_id: Principal,
    following_id: Principal,
    created_at: u64,
}

#[derive(CandidType, Clone)]
pub struct PostStats {
    total_posts: u64,
    recent_posts: u64, // Last 24 hours
    total_likes: u64,
}

// Use Lazy to initialize the USERS HashMap wrapped in a Mutex
pub type Users = HashMap<Principal, User>;
static USERS: Lazy<Mutex<Users>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Posts storage - using post_id as key
pub type Posts = HashMap<u64, Post>;
static POSTS: Lazy<Mutex<Posts>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Post ID counter for generating unique post IDs
static POST_ID_COUNTER: Lazy<Mutex<u64>> = Lazy::new(|| Mutex::new(0));

// User likes tracking - maps user_id to set of post_ids they liked
static USER_LIKES: Lazy<Mutex<HashMap<Principal, HashSet<u64>>>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Comments storage - using comment_id as key
pub type Comments = HashMap<u64, Comment>;
static COMMENTS: Lazy<Mutex<Comments>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Comment ID counter for generating unique comment IDs
static COMMENT_ID_COUNTER: Lazy<Mutex<u64>> = Lazy::new(|| Mutex::new(0));

// Comment likes tracking - maps user_id to set of comment_ids they liked
static USER_COMMENT_LIKES: Lazy<Mutex<HashMap<Principal, HashSet<u64>>>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Follows storage - maps follower_id to set of following_ids
static FOLLOWS: Lazy<Mutex<HashMap<Principal, HashSet<Principal>>>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Post shares tracking - maps user_id to set of post_ids they shared
static USER_SHARES: Lazy<Mutex<HashMap<Principal, HashSet<u64>>>> = Lazy::new(|| Mutex::new(HashMap::new()));

// Predefined admin principals - Add your admin principals here
static PREDEFINED_ADMINS: Lazy<HashSet<Principal>> = Lazy::new(|| {
    let mut admins = HashSet::new();
    // Add your admin principals here - replace with actual admin principals
    // Example: admins.insert(Principal::from_text("your-admin-principal-here").unwrap());

    // For development, you can add a test admin principal
    // Uncomment and replace with your actual principal when you know it
    // admins.insert(Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap());

    // Add the original Sarv29 principal as admin for development
    if let Ok(admin_principal) = Principal::from_text("6qa2u-gctfq-jppnt-e2ai3-mp4ng-qotip-hidii-kascv-srdfq-htjfx-nqe") {
        admins.insert(admin_principal);
    }

    // Add the Internet Identity anchor 10000 principal as admin
    if let Ok(admin_principal) = Principal::from_text("4xgob-2qimn-cbswc-yywe2-spgmi-yg7az-xbu3r-vbi3p-vyf7y-myipw-cae") {
        admins.insert(admin_principal);
    }

    admins
});

// Additional admins that can be promoted by existing admins
static PROMOTED_ADMINS: Lazy<Mutex<HashSet<Principal>>> = Lazy::new(|| Mutex::new(HashSet::new()));

// Helper function to get current timestamp in nanoseconds
fn current_time() -> u64 {
    ic_cdk::api::time()
}

// Helper function to check if a principal is an admin
fn is_admin(principal: &Principal) -> bool {
    PREDEFINED_ADMINS.contains(principal) ||
    PROMOTED_ADMINS.lock().unwrap().contains(principal)
}

// Helper function to check if caller is admin
fn require_admin() -> Result<(), String> {
    let caller_principal = caller();
    if is_admin(&caller_principal) {
        Ok(())
    } else {
        Err("Access denied: Admin privileges required".to_string())
    }
}

// Helper function to generate next post ID
fn next_post_id() -> u64 {
    let mut counter = POST_ID_COUNTER.lock().unwrap();
    *counter += 1;
    *counter
}

// Helper function to check if user exists
fn user_exists(user_id: &Principal) -> bool {
    let users = USERS.lock().unwrap();
    users.contains_key(user_id)
}

#[ic_cdk::update]
fn create_user(
    username: String,
    full_name: Option<String>,
    email: Option<String>,
    bio: Option<String>,
    profile_pic: Option<String>,
    location: Option<String>,
    website: Option<String>,
) -> String {
    let user_id = caller();
    let current_timestamp = current_time();

    // Check if user already exists
    {
        let users = USERS.lock().unwrap();
        if users.contains_key(&user_id) {
            return "User already exists".to_string();
        }
    }

    let user = User {
        user_id,
        username,
        full_name,
        email,
        bio,
        profile_pic,
        location,
        website,
        is_admin: is_admin(&user_id), // Check if this user is a predefined admin
        created_at: current_timestamp,
        last_active: current_timestamp,
    };

    // Lock the USERS Mutex to insert the user
    let mut users = USERS.lock().unwrap();
    users.insert(user_id, user);

    "User created successfully".to_string()
}

#[ic_cdk::query]
fn get_user(user_id: Principal) -> Option<User> {
    let users = USERS.lock().unwrap();
    users.get(&user_id).cloned()
}

#[ic_cdk::update]
fn update_user(
    full_name: Option<String>,
    email: Option<String>,
    bio: Option<String>,
    profile_pic: Option<String>,
    location: Option<String>,
    website: Option<String>,
) -> String {
    let user_id = caller();

    // Lock the USERS Mutex to update the user information
    let mut users = USERS.lock().unwrap();
    if let Some(user) = users.get_mut(&user_id) {
        if let Some(name) = full_name {
            user.full_name = Some(name);
        }
        if let Some(email) = email {
            user.email = Some(email);
        }
        if let Some(bio) = bio {
            user.bio = Some(bio);
        }
        if let Some(pic) = profile_pic {
            user.profile_pic = Some(pic);
        }
        if let Some(loc) = location {
            user.location = Some(loc);
        }
        if let Some(web) = website {
            user.website = Some(web);
        }
        // Update last active timestamp
        user.last_active = current_time();
        return "User updated successfully".to_string();
    }

    "User not found".to_string()
}

#[ic_cdk::update]
fn delete_user() -> String {
    let user_id = caller();

    // Lock the USERS Mutex to remove the user
    let mut users = USERS.lock().unwrap();
    if users.remove(&user_id).is_some() {
        return "User deleted successfully".to_string();
    }

    "User not found".to_string()
}

#[ic_cdk::query]
fn get_all_users() -> Vec<User> {
    let users = USERS.lock().unwrap();
    users.values().cloned().collect()
}

#[ic_cdk::query]
fn debug_user_count() -> u64 {
    let users = USERS.lock().unwrap();
    users.len() as u64
}

#[ic_cdk::query]
fn debug_user_exists(user_id: Principal) -> bool {
    let users = USERS.lock().unwrap();
    users.contains_key(&user_id)
}

// ============ POST FUNCTIONS ============

#[ic_cdk::update]
fn create_post(content: String, hashtags: Vec<String>, media_urls: Vec<String>) -> Result<u64, String> {
    let author_id = caller();

    // Check if user exists
    if !user_exists(&author_id) {
        return Err("User must be registered to create posts".to_string());
    }

    // Validate content
    if content.trim().is_empty() {
        return Err("Post content cannot be empty".to_string());
    }

    if content.len() > 2000 {
        return Err("Post content too long (max 2000 characters)".to_string());
    }

    // Extract mentions from content (@username)
    let mentions = extract_mentions(&content);

    let post_id = next_post_id();
    let current_timestamp = current_time();

    let post = Post {
        post_id,
        author_id,
        content: content.trim().to_string(),
        created_at: current_timestamp,
        updated_at: None,
        likes: 0,
        comments_count: 0,
        shares_count: 0,
        hashtags,
        mentions,
        media_urls,
        is_deleted: false,
    };

    // Store the post
    let mut posts = POSTS.lock().unwrap();
    posts.insert(post_id, post);

    // Update user's last active timestamp
    {
        let mut users = USERS.lock().unwrap();
        if let Some(user) = users.get_mut(&author_id) {
            user.last_active = current_timestamp;
        }
    }

    Ok(post_id)
}

#[ic_cdk::query]
fn get_post(post_id: u64) -> Option<Post> {
    let posts = POSTS.lock().unwrap();
    posts.get(&post_id).filter(|post| !post.is_deleted).cloned()
}

#[ic_cdk::query]
fn get_all_posts() -> Vec<Post> {
    let posts = POSTS.lock().unwrap();
    let mut post_list: Vec<Post> = posts.values()
        .filter(|post| !post.is_deleted)
        .cloned()
        .collect();

    // Sort by creation date (most recent first)
    post_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    post_list
}

#[ic_cdk::query]
fn get_user_posts(user_id: Principal) -> Vec<Post> {
    let posts = POSTS.lock().unwrap();
    let mut user_posts: Vec<Post> = posts.values()
        .filter(|post| post.author_id == user_id && !post.is_deleted)
        .cloned()
        .collect();

    // Sort by creation date (most recent first)
    user_posts.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    user_posts
}

#[ic_cdk::update]
fn update_post(post_id: u64, new_content: String) -> String {
    let caller_id = caller();

    // Validate content
    if new_content.trim().is_empty() {
        return "Post content cannot be empty".to_string();
    }

    if new_content.len() > 2000 {
        return "Post content too long (max 2000 characters)".to_string();
    }

    let mut posts = POSTS.lock().unwrap();
    if let Some(post) = posts.get_mut(&post_id) {
        // Check if caller is the author or admin
        if post.author_id != caller_id && !is_admin(&caller_id) {
            return "Access denied: You can only edit your own posts".to_string();
        }

        if post.is_deleted {
            return "Cannot edit deleted post".to_string();
        }

        post.content = new_content.trim().to_string();
        post.updated_at = Some(current_time());

        return "Post updated successfully".to_string();
    }

    "Post not found".to_string()
}

#[ic_cdk::update]
fn delete_post(post_id: u64) -> String {
    let caller_id = caller();

    let mut posts = POSTS.lock().unwrap();
    if let Some(post) = posts.get_mut(&post_id) {
        // Check if caller is the author or admin
        if post.author_id != caller_id && !is_admin(&caller_id) {
            return "Access denied: You can only delete your own posts".to_string();
        }

        if post.is_deleted {
            return "Post already deleted".to_string();
        }

        post.is_deleted = true;
        return "Post deleted successfully".to_string();
    }

    "Post not found".to_string()
}

#[ic_cdk::update]
fn like_post(post_id: u64) -> String {
    let caller_id = caller();

    // Check if user exists
    if !user_exists(&caller_id) {
        return "User must be registered to like posts".to_string();
    }

    // Check if post exists and is not deleted
    {
        let posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get(&post_id) {
            if post.is_deleted {
                return "Cannot like deleted post".to_string();
            }
        } else {
            return "Post not found".to_string();
        }
    }

    // Check if user already liked this post
    {
        let mut user_likes = USER_LIKES.lock().unwrap();
        let user_liked_posts = user_likes.entry(caller_id).or_insert_with(HashSet::new);

        if user_liked_posts.contains(&post_id) {
            return "You have already liked this post".to_string();
        }

        user_liked_posts.insert(post_id);
    }

    // Increment like count
    {
        let mut posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get_mut(&post_id) {
            post.likes += 1;
        }
    }

    "Post liked successfully".to_string()
}

#[ic_cdk::update]
fn unlike_post(post_id: u64) -> String {
    let caller_id = caller();

    // Check if user exists
    if !user_exists(&caller_id) {
        return "User must be registered to unlike posts".to_string();
    }

    // Check if user has liked this post
    {
        let mut user_likes = USER_LIKES.lock().unwrap();
        if let Some(user_liked_posts) = user_likes.get_mut(&caller_id) {
            if !user_liked_posts.contains(&post_id) {
                return "You haven't liked this post".to_string();
            }

            user_liked_posts.remove(&post_id);
        } else {
            return "You haven't liked this post".to_string();
        }
    }

    // Decrement like count
    {
        let mut posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get_mut(&post_id) {
            if post.likes > 0 {
                post.likes -= 1;
            }
        }
    }

    "Post unliked successfully".to_string()
}

#[ic_cdk::query]
fn has_user_liked_post(post_id: u64) -> bool {
    let caller_id = caller();
    let user_likes = USER_LIKES.lock().unwrap();

    if let Some(user_liked_posts) = user_likes.get(&caller_id) {
        user_liked_posts.contains(&post_id)
    } else {
        false
    }
}

#[ic_cdk::query]
fn get_user_liked_posts() -> Vec<u64> {
    let caller_id = caller();
    let user_likes = USER_LIKES.lock().unwrap();

    if let Some(user_liked_posts) = user_likes.get(&caller_id) {
        user_liked_posts.iter().cloned().collect()
    } else {
        Vec::new()
    }
}

// ============ ADMIN-ONLY FUNCTIONS ============

#[ic_cdk::query]
fn is_caller_admin() -> bool {
    is_admin(&caller())
}

#[ic_cdk::update]
fn admin_delete_user(target_user_id: Principal) -> String {
    match require_admin() {
        Ok(_) => {
            // First, delete all posts by this user
            {
                let mut posts = POSTS.lock().unwrap();
                for post in posts.values_mut() {
                    if post.author_id == target_user_id {
                        post.is_deleted = true;
                    }
                }
            }

            // Delete all comments by this user
            {
                let mut comments = COMMENTS.lock().unwrap();
                for comment in comments.values_mut() {
                    if comment.author_id == target_user_id {
                        comment.is_deleted = true;
                    }
                }
            }

            // Remove user from likes
            {
                let mut user_likes = USER_LIKES.lock().unwrap();
                user_likes.remove(&target_user_id);
            }

            // Remove user from following relationships
            {
                let mut user_following = USER_FOLLOWING.lock().unwrap();
                user_following.remove(&target_user_id);

                // Also remove this user from other users' following lists
                for following_set in user_following.values_mut() {
                    following_set.remove(&target_user_id);
                }
            }

            // Finally, delete the user
            let mut users = USERS.lock().unwrap();
            if users.remove(&target_user_id).is_some() {
                format!("User {} and all their data deleted successfully by admin", target_user_id)
            } else {
                "User not found".to_string()
            }
        }
        Err(e) => e,
    }
}

#[ic_cdk::update]
fn admin_promote_user(target_user_id: Principal) -> String {
    match require_admin() {
        Ok(_) => {
            // Add to promoted admins
            let mut promoted_admins = PROMOTED_ADMINS.lock().unwrap();
            promoted_admins.insert(target_user_id);

            // Update user's admin status
            let mut users = USERS.lock().unwrap();
            if let Some(user) = users.get_mut(&target_user_id) {
                user.is_admin = true;
                format!("User {} promoted to admin successfully", target_user_id)
            } else {
                "User not found".to_string()
            }
        }
        Err(e) => e,
    }
}

#[ic_cdk::update]
fn admin_demote_user(target_user_id: Principal) -> String {
    match require_admin() {
        Ok(_) => {
            // Check if user is a predefined admin (cannot be demoted)
            if PREDEFINED_ADMINS.contains(&target_user_id) {
                return "Cannot demote predefined admin".to_string();
            }

            // Remove from promoted admins
            let mut promoted_admins = PROMOTED_ADMINS.lock().unwrap();
            promoted_admins.remove(&target_user_id);

            // Update user's admin status
            let mut users = USERS.lock().unwrap();
            if let Some(user) = users.get_mut(&target_user_id) {
                user.is_admin = false;
                format!("User {} demoted from admin successfully", target_user_id)
            } else {
                "User not found".to_string()
            }
        }
        Err(e) => e,
    }
}

#[ic_cdk::update]
fn admin_create_follow_relationship(follower: Principal, following: Principal) -> String {
    match require_admin() {
        Ok(_) => {
            // Check if both users exist
            if !user_exists(&follower) {
                return "Follower user not found".to_string();
            }
            if !user_exists(&following) {
                return "Following user not found".to_string();
            }

            // Can't follow yourself
            if follower == following {
                return "User cannot follow themselves".to_string();
            }

            let mut follows = FOLLOWS.lock().unwrap();
            let user_following = follows.entry(follower).or_insert_with(HashSet::new);

            if user_following.contains(&following) {
                return "Follow relationship already exists".to_string();
            }

            user_following.insert(following);
            format!("Follow relationship created: {} now follows {}", follower, following)
        }
        Err(e) => e,
    }
}

#[ic_cdk::query]
fn admin_get_stats() -> Result<AdminStats, String> {
    match require_admin() {
        Ok(_) => {
            let users = USERS.lock().unwrap();
            let current_timestamp = current_time();
            let twenty_four_hours_ago = current_timestamp.saturating_sub(24 * 60 * 60 * 1_000_000_000); // 24 hours in nanoseconds

            let total_users = users.len() as u64;
            let total_admins = users.values().filter(|user| user.is_admin).count() as u64;
            let recent_registrations = users.values()
                .filter(|user| user.created_at > twenty_four_hours_ago)
                .count() as u64;

            Ok(AdminStats {
                total_users,
                total_admins,
                recent_registrations,
            })
        }
        Err(e) => Err(e),
    }
}

#[ic_cdk::query]
fn admin_get_post_stats() -> Result<PostStats, String> {
    match require_admin() {
        Ok(_) => {
            let posts = POSTS.lock().unwrap();
            let current_timestamp = current_time();
            let twenty_four_hours_ago = current_timestamp.saturating_sub(24 * 60 * 60 * 1_000_000_000);

            let total_posts = posts.values().filter(|post| !post.is_deleted).count() as u64;
            let recent_posts = posts.values()
                .filter(|post| !post.is_deleted && post.created_at > twenty_four_hours_ago)
                .count() as u64;
            let total_likes = posts.values()
                .filter(|post| !post.is_deleted)
                .map(|post| post.likes)
                .sum::<u64>();

            Ok(PostStats {
                total_posts,
                recent_posts,
                total_likes,
            })
        }
        Err(e) => Err(e),
    }
}

#[ic_cdk::update]
fn admin_delete_post(post_id: u64) -> String {
    match require_admin() {
        Ok(_) => {
            let mut posts = POSTS.lock().unwrap();
            if let Some(post) = posts.get_mut(&post_id) {
                if post.is_deleted {
                    return "Post already deleted".to_string();
                }

                post.is_deleted = true;
                format!("Post {} deleted successfully by admin", post_id)
            } else {
                "Post not found".to_string()
            }
        }
        Err(e) => e,
    }
}

#[ic_cdk::query]
fn admin_get_all_posts() -> Result<Vec<Post>, String> {
    match require_admin() {
        Ok(_) => {
            let posts = POSTS.lock().unwrap();
            let mut post_list: Vec<Post> = posts.values().cloned().collect();

            // Sort by creation date (most recent first)
            post_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

            Ok(post_list)
        }
        Err(e) => Err(e),
    }
}

#[ic_cdk::query]
fn admin_get_all_users_detailed() -> Result<Vec<User>, String> {
    match require_admin() {
        Ok(_) => {
            let users = USERS.lock().unwrap();
            Ok(users.values().cloned().collect())
        }
        Err(e) => Err(e),
    }
}

#[ic_cdk::query]
fn admin_search_users(query: String) -> Result<Vec<User>, String> {
    match require_admin() {
        Ok(_) => {
            let users = USERS.lock().unwrap();
            let query_lower = query.to_lowercase();
            let filtered_users: Vec<User> = users.values()
                .filter(|user| {
                    user.username.to_lowercase().contains(&query_lower) ||
                    user.full_name.as_ref().map_or(false, |name| name.to_lowercase().contains(&query_lower)) ||
                    user.email.as_ref().map_or(false, |email| email.to_lowercase().contains(&query_lower))
                })
                .cloned()
                .collect();
            Ok(filtered_users)
        }
        Err(e) => Err(e),
    }
}

// Admin function to manually create or update a user with specific principal
#[ic_cdk::update]
fn admin_create_user_with_principal(
    target_principal: Principal,
    username: String,
    full_name: Option<String>,
    email: Option<String>,
    bio: Option<String>,
    profile_pic: Option<String>,
    location: Option<String>,
    website: Option<String>,
) -> String {
    match require_admin() {
        Ok(_) => {
            let current_timestamp = current_time();

            let user = User {
                user_id: target_principal,
                username,
                full_name,
                email,
                bio,
                profile_pic,
                location,
                website,
                is_admin: is_admin(&target_principal),
                created_at: current_timestamp,
                last_active: current_timestamp,
            };

            let mut users = USERS.lock().unwrap();
            users.insert(target_principal, user);

            format!("User created/updated successfully for principal: {}", target_principal)
        }
        Err(e) => e,
    }
}

#[ic_cdk::query]
fn admin_get_recent_users(limit: u64) -> Result<Vec<User>, String> {
    match require_admin() {
        Ok(_) => {
            let users = USERS.lock().unwrap();
            let mut user_list: Vec<User> = users.values().cloned().collect();

            // Sort by creation date (most recent first)
            user_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

            // Take only the requested number
            user_list.truncate(limit as usize);

            Ok(user_list)
        }
        Err(e) => Err(e),
    }
}

#[ic_cdk::query]
fn admin_get_all_users() -> Result<Vec<User>, String> {
    match require_admin() {
        Ok(_) => {
            let users = USERS.lock().unwrap();
            let user_list: Vec<User> = users.values().cloned().collect();
            Ok(user_list)
        }
        Err(e) => Err(e),
    }
}

// ============ HELPER FUNCTIONS ============

fn extract_mentions(content: &str) -> Vec<Principal> {
    let mut mentions = Vec::new();
    let words: Vec<&str> = content.split_whitespace().collect();

    for word in words {
        if word.starts_with('@') && word.len() > 1 {
            let username = &word[1..];
            // Find user by username and get their principal
            let users = USERS.lock().unwrap();
            for user in users.values() {
                if user.username == username {
                    mentions.push(user.user_id);
                    break;
                }
            }
        }
    }

    mentions
}

fn next_comment_id() -> u64 {
    let mut counter = COMMENT_ID_COUNTER.lock().unwrap();
    *counter += 1;
    *counter
}

// ============ SEARCH FUNCTIONS ============

#[ic_cdk::query]
fn search_users(query: String) -> Vec<User> {
    let users = USERS.lock().unwrap();
    let query_lower = query.to_lowercase();

    users.values()
        .filter(|user| {
            user.username.to_lowercase().contains(&query_lower) ||
            user.full_name.as_ref().map_or(false, |name| name.to_lowercase().contains(&query_lower)) ||
            user.bio.as_ref().map_or(false, |bio| bio.to_lowercase().contains(&query_lower))
        })
        .cloned()
        .collect()
}

#[ic_cdk::query]
fn search_posts(query: String) -> Vec<Post> {
    let posts = POSTS.lock().unwrap();
    let query_lower = query.to_lowercase();

    let mut filtered_posts: Vec<Post> = posts.values()
        .filter(|post| {
            !post.is_deleted && (
                post.content.to_lowercase().contains(&query_lower) ||
                post.hashtags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            )
        })
        .cloned()
        .collect();

    // Sort by creation date (most recent first)
    filtered_posts.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    filtered_posts
}

#[ic_cdk::query]
fn get_posts_by_hashtag(hashtag: String) -> Vec<Post> {
    let posts = POSTS.lock().unwrap();
    let hashtag_lower = hashtag.to_lowercase();

    let mut filtered_posts: Vec<Post> = posts.values()
        .filter(|post| {
            !post.is_deleted &&
            post.hashtags.iter().any(|tag| tag.to_lowercase() == hashtag_lower)
        })
        .cloned()
        .collect();

    // Sort by creation date (most recent first)
    filtered_posts.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    filtered_posts
}

#[ic_cdk::query]
fn get_trending_posts() -> Vec<Post> {
    let posts = POSTS.lock().unwrap();
    let current_timestamp = current_time();
    let twenty_four_hours_ago = current_timestamp.saturating_sub(24 * 60 * 60 * 1_000_000_000);

    let mut recent_posts: Vec<Post> = posts.values()
        .filter(|post| !post.is_deleted && post.created_at > twenty_four_hours_ago)
        .cloned()
        .collect();

    // Sort by engagement (likes + comments + shares)
    recent_posts.sort_by(|a, b| {
        let a_engagement = a.likes + a.comments_count + a.shares_count;
        let b_engagement = b.likes + b.comments_count + b.shares_count;
        b_engagement.cmp(&a_engagement)
    });

    // Take top 20 trending posts
    recent_posts.truncate(20);

    recent_posts
}

// ============ COMMENT FUNCTIONS ============

#[ic_cdk::update]
fn create_comment(post_id: u64, content: String) -> Result<u64, String> {
    let author_id = caller();

    // Check if user exists
    if !user_exists(&author_id) {
        return Err("User must be registered to create comments".to_string());
    }

    // Validate content
    if content.trim().is_empty() {
        return Err("Comment content cannot be empty".to_string());
    }

    if content.len() > 500 {
        return Err("Comment content too long (max 500 characters)".to_string());
    }

    // Check if post exists and is not deleted
    {
        let posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get(&post_id) {
            if post.is_deleted {
                return Err("Cannot comment on deleted post".to_string());
            }
        } else {
            return Err("Post not found".to_string());
        }
    }

    let comment_id = next_comment_id();
    let current_timestamp = current_time();

    let comment = Comment {
        comment_id,
        post_id,
        author_id,
        content: content.trim().to_string(),
        created_at: current_timestamp,
        updated_at: None,
        likes: 0,
        is_deleted: false,
    };

    // Store the comment
    {
        let mut comments = COMMENTS.lock().unwrap();
        comments.insert(comment_id, comment);
    }

    // Increment comment count on the post
    {
        let mut posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get_mut(&post_id) {
            post.comments_count += 1;
        }
    }

    // Update user's last active timestamp
    {
        let mut users = USERS.lock().unwrap();
        if let Some(user) = users.get_mut(&author_id) {
            user.last_active = current_timestamp;
        }
    }

    Ok(comment_id)
}

#[ic_cdk::query]
fn get_post_comments(post_id: u64) -> Vec<Comment> {
    let comments = COMMENTS.lock().unwrap();
    let mut post_comments: Vec<Comment> = comments.values()
        .filter(|comment| comment.post_id == post_id && !comment.is_deleted)
        .cloned()
        .collect();

    // Sort by creation date (oldest first for comments)
    post_comments.sort_by(|a, b| a.created_at.cmp(&b.created_at));

    post_comments
}

#[ic_cdk::update]
fn update_comment(comment_id: u64, new_content: String) -> String {
    let caller_id = caller();

    // Validate content
    if new_content.trim().is_empty() {
        return "Comment content cannot be empty".to_string();
    }

    if new_content.len() > 500 {
        return "Comment content too long (max 500 characters)".to_string();
    }

    let mut comments = COMMENTS.lock().unwrap();
    if let Some(comment) = comments.get_mut(&comment_id) {
        // Check if caller is the author or admin
        if comment.author_id != caller_id && !is_admin(&caller_id) {
            return "Access denied: You can only edit your own comments".to_string();
        }

        if comment.is_deleted {
            return "Cannot edit deleted comment".to_string();
        }

        comment.content = new_content.trim().to_string();
        comment.updated_at = Some(current_time());

        return "Comment updated successfully".to_string();
    }

    "Comment not found".to_string()
}

#[ic_cdk::update]
fn delete_comment(comment_id: u64) -> String {
    let caller_id = caller();

    let mut comments = COMMENTS.lock().unwrap();
    if let Some(comment) = comments.get_mut(&comment_id) {
        // Check if caller is the author or admin
        if comment.author_id != caller_id && !is_admin(&caller_id) {
            return "Access denied: You can only delete your own comments".to_string();
        }

        if comment.is_deleted {
            return "Comment already deleted".to_string();
        }

        let post_id = comment.post_id;
        comment.is_deleted = true;

        // Decrement comment count on the post
        drop(comments); // Release the comments lock
        let mut posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get_mut(&post_id) {
            if post.comments_count > 0 {
                post.comments_count -= 1;
            }
        }

        return "Comment deleted successfully".to_string();
    }

    "Comment not found".to_string()
}

// ============ FOLLOW FUNCTIONS ============

#[ic_cdk::update]
fn follow_user(user_to_follow: Principal) -> String {
    let follower_id = caller();

    // Check if user exists
    if !user_exists(&follower_id) {
        return "User must be registered to follow others".to_string();
    }

    // Check if target user exists
    if !user_exists(&user_to_follow) {
        return "User to follow not found".to_string();
    }

    // Can't follow yourself
    if follower_id == user_to_follow {
        return "You cannot follow yourself".to_string();
    }

    let mut follows = FOLLOWS.lock().unwrap();
    let user_following = follows.entry(follower_id).or_insert_with(HashSet::new);

    if user_following.contains(&user_to_follow) {
        return "You are already following this user".to_string();
    }

    user_following.insert(user_to_follow);
    "User followed successfully".to_string()
}

#[ic_cdk::update]
fn unfollow_user(user_to_unfollow: Principal) -> String {
    let follower_id = caller();

    let mut follows = FOLLOWS.lock().unwrap();
    if let Some(user_following) = follows.get_mut(&follower_id) {
        if user_following.remove(&user_to_unfollow) {
            return "User unfollowed successfully".to_string();
        }
    }

    "You are not following this user".to_string()
}

#[ic_cdk::query]
fn get_followers(user_id: Principal) -> Vec<Principal> {
    let follows = FOLLOWS.lock().unwrap();
    let mut followers = Vec::new();

    for (follower, following_set) in follows.iter() {
        if following_set.contains(&user_id) {
            followers.push(*follower);
        }
    }

    followers
}

#[ic_cdk::query]
fn get_following(user_id: Principal) -> Vec<Principal> {
    let follows = FOLLOWS.lock().unwrap();
    if let Some(following_set) = follows.get(&user_id) {
        following_set.iter().cloned().collect()
    } else {
        Vec::new()
    }
}

#[ic_cdk::query]
fn is_following(user_id: Principal) -> bool {
    let caller_id = caller();
    let follows = FOLLOWS.lock().unwrap();

    if let Some(following_set) = follows.get(&caller_id) {
        following_set.contains(&user_id)
    } else {
        false
    }
}

#[ic_cdk::query]
fn get_user_feed() -> Vec<Post> {
    let caller_id = caller();
    let follows = FOLLOWS.lock().unwrap();
    let posts = POSTS.lock().unwrap();

    // Get list of users the caller is following
    let following_set = follows.get(&caller_id).cloned().unwrap_or_default();

    // Include caller's own posts in the feed
    let mut feed_users = following_set;
    feed_users.insert(caller_id);

    // Get posts from followed users
    let mut feed_posts: Vec<Post> = posts.values()
        .filter(|post| !post.is_deleted && feed_users.contains(&post.author_id))
        .cloned()
        .collect();

    // Sort by creation date (most recent first)
    feed_posts.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    // Limit to 50 most recent posts
    feed_posts.truncate(50);

    feed_posts
}

// ============ SHARE FUNCTIONS ============

#[ic_cdk::update]
fn share_post(post_id: u64) -> String {
    let caller_id = caller();

    // Check if user exists
    if !user_exists(&caller_id) {
        return "User must be registered to share posts".to_string();
    }

    // Check if post exists and is not deleted
    {
        let posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get(&post_id) {
            if post.is_deleted {
                return "Cannot share deleted post".to_string();
            }
        } else {
            return "Post not found".to_string();
        }
    }

    // Track the share
    {
        let mut user_shares = USER_SHARES.lock().unwrap();
        let user_shared_posts = user_shares.entry(caller_id).or_insert_with(HashSet::new);
        user_shared_posts.insert(post_id);
    }

    // Increment share count
    {
        let mut posts = POSTS.lock().unwrap();
        if let Some(post) = posts.get_mut(&post_id) {
            post.shares_count += 1;
        }
    }

    "Post shared successfully".to_string()
}

// ============ COMMENT LIKE FUNCTIONS ============

#[ic_cdk::update]
fn like_comment(comment_id: u64) -> String {
    let caller_id = caller();

    // Check if user exists
    if !user_exists(&caller_id) {
        return "User must be registered to like comments".to_string();
    }

    // Check if comment exists and is not deleted
    {
        let comments = COMMENTS.lock().unwrap();
        if let Some(comment) = comments.get(&comment_id) {
            if comment.is_deleted {
                return "Cannot like deleted comment".to_string();
            }
        } else {
            return "Comment not found".to_string();
        }
    }

    // Check if user already liked this comment
    {
        let mut user_comment_likes = USER_COMMENT_LIKES.lock().unwrap();
        let user_liked_comments = user_comment_likes.entry(caller_id).or_insert_with(HashSet::new);

        if user_liked_comments.contains(&comment_id) {
            return "You have already liked this comment".to_string();
        }

        user_liked_comments.insert(comment_id);
    }

    // Increment like count
    {
        let mut comments = COMMENTS.lock().unwrap();
        if let Some(comment) = comments.get_mut(&comment_id) {
            comment.likes += 1;
        }
    }

    "Comment liked successfully".to_string()
}

#[ic_cdk::update]
fn unlike_comment(comment_id: u64) -> String {
    let caller_id = caller();

    // Check if user exists
    if !user_exists(&caller_id) {
        return "User must be registered to unlike comments".to_string();
    }

    // Check if user has liked this comment
    {
        let mut user_comment_likes = USER_COMMENT_LIKES.lock().unwrap();
        if let Some(user_liked_comments) = user_comment_likes.get_mut(&caller_id) {
            if !user_liked_comments.contains(&comment_id) {
                return "You haven't liked this comment".to_string();
            }

            user_liked_comments.remove(&comment_id);
        } else {
            return "You haven't liked this comment".to_string();
        }
    }

    // Decrement like count
    {
        let mut comments = COMMENTS.lock().unwrap();
        if let Some(comment) = comments.get_mut(&comment_id) {
            if comment.likes > 0 {
                comment.likes -= 1;
            }
        }
    }

    "Comment unliked successfully".to_string()
}
