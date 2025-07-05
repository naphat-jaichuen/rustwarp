// JavaScript Example File
function greetUser(name) {
    const greeting = `Hello, ${name}!`;
    console.log(greeting);
    
    // Return an object with user info
    return {
        name: name,
        timestamp: new Date().toISOString(),
        isGreeted: true
    };
}

// Usage example
const result = greetUser("World");
console.log(result);

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Async function example
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}
