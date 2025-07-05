# Python Example File
import json
from datetime import datetime
from typing import List, Dict, Optional

class User:
    """A simple user class with basic functionality."""
    
    def __init__(self, name: str, age: int, email: str):
        self.name = name
        self.age = age
        self.email = email
        self.created_at = datetime.now()
    
    def greet(self) -> str:
        """Return a greeting message for the user."""
        return f"Hello, {self.name}! You are {self.age} years old."
    
    def is_adult(self) -> bool:
        """Check if the user is an adult (18 or older)."""
        return self.age >= 18
    
    def to_dict(self) -> Dict[str, any]:
        """Convert user to dictionary representation."""
        return {
            'name': self.name,
            'age': self.age,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_adult': self.is_adult()
        }

def create_users() -> List[User]:
    """Create a list of sample users."""
    users_data = [
        ("Alice", 25, "alice@example.com"),
        ("Bob", 17, "bob@example.com"),
        ("Charlie", 35, "charlie@example.com"),
        ("Diana", 16, "diana@example.com")
    ]
    
    return [User(name, age, email) for name, age, email in users_data]

def filter_adults(users: List[User]) -> List[User]:
    """Filter out adult users from the list."""
    return [user for user in users if user.is_adult()]

def process_users():
    """Main function to demonstrate user processing."""
    print("Creating users...")
    users = create_users()
    
    print(f"\nTotal users: {len(users)}")
    
    # Greet all users
    print("\nGreeting all users:")
    for user in users:
        print(f"  {user.greet()}")
    
    # Filter adults
    adults = filter_adults(users)
    print(f"\nAdult users: {len(adults)}")
    for adult in adults:
        print(f"  {adult.name} ({adult.age} years old)")
    
    # Export to JSON
    user_data = [user.to_dict() for user in users]
    json_output = json.dumps(user_data, indent=2)
    print(f"\nJSON representation:\n{json_output}")

if __name__ == "__main__":
    try:
        process_users()
    except Exception as e:
        print(f"Error: {e}")
