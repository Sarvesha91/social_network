use ic_cdk::api::caller;
use ic_principal::Principal;
use std::collections::HashMap;
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
}

// Use Lazy to initialize the USERS HashMap wrapped in a Mutex
pub type Users = HashMap<Principal, User>;
static USERS: Lazy<Mutex<Users>> = Lazy::new(|| Mutex::new(HashMap::new())); // Corrected initialization

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
    let user = User {
        user_id,
        username,
        full_name,
        email,
        bio,
        profile_pic,
        location,
        website,
    };

    // Lock the USERS Mutex to insert the user
    let mut users = USERS.lock().unwrap();
    users.insert(user_id, user);

    "User  created successfully".to_string()
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
        return "User  updated successfully".to_string();
    }

    "User  not found".to_string()
}

#[ic_cdk::update]
fn delete_user() -> String {
    let user_id = caller();

    // Lock the USERS Mutex to remove the user
    let mut users = USERS.lock().unwrap();
    if users.remove(&user_id).is_some() {
        return "User  deleted successfully".to_string();
    }

    "User  not found".to_string()
}

#[ic_cdk::query]
fn get_all_users() -> Vec<User> {
    let users = USERS.lock().unwrap();
    users.values().cloned().collect()
}
