// Rust Example File
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct User {
    name: String,
    age: u32,
    email: String,
}

impl User {
    fn new(name: &str, age: u32, email: &str) -> Self {
        User {
            name: name.to_string(),
            age,
            email: email.to_string(),
        }
    }

    fn greet(&self) -> String {
        format!("Hello, {}! You are {} years old.", self.name, self.age)
    }

    fn is_adult(&self) -> bool {
        self.age >= 18
    }
}

fn main() {
    let mut users: HashMap<String, User> = HashMap::new();
    
    // Create some users
    let user1 = User::new("Alice", 25, "alice@example.com");
    let user2 = User::new("Bob", 17, "bob@example.com");
    
    // Add to map
    users.insert(user1.name.clone(), user1);
    users.insert(user2.name.clone(), user2);
    
    // Process users
    for (name, user) in &users {
        println!("{}", user.greet());
        
        match user.is_adult() {
            true => println!("{} is an adult.", name),
            false => println!("{} is a minor.", name),
        }
    }
    
    // Filter adult users
    let adults: Vec<&User> = users.values()
        .filter(|user| user.is_adult())
        .collect();
    
    println!("Found {} adult users", adults.len());
}

// Generic function example
fn find_max<T: PartialOrd + Copy>(items: &[T]) -> Option<T> {
    items.iter().max().copied()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User::new("Test", 30, "test@example.com");
        assert_eq!(user.name, "Test");
        assert_eq!(user.age, 30);
        assert!(user.is_adult());
    }
}
