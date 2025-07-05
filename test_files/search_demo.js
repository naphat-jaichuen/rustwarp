// Search Demo JavaScript File
// This file contains repeated patterns to demonstrate search functionality

class SearchDemo {
    constructor() {
        this.data = [];
        this.results = [];
        this.searchTerm = '';
    }
    
    // Method to search through data
    search(term) {
        this.searchTerm = term;
        this.results = this.data.filter(item => {
            return item.name.toLowerCase().includes(term.toLowerCase()) ||
                   item.description.toLowerCase().includes(term.toLowerCase());
        });
        return this.results;
    }
    
    // Method to add data
    addData(item) {
        this.data.push(item);
        console.log('Added data item:', item);
    }
    
    // Method to get search results
    getResults() {
        return this.results;
    }
    
    // Method to clear search
    clearSearch() {
        this.searchTerm = '';
        this.results = [];
    }
}

// Example usage of SearchDemo
const demo = new SearchDemo();

// Add some sample data
demo.addData({ name: 'JavaScript', description: 'Programming language' });
demo.addData({ name: 'Python', description: 'Another programming language' });
demo.addData({ name: 'Search', description: 'Find functionality' });
demo.addData({ name: 'Demo', description: 'Demonstration purpose' });

// Perform search operations
console.log('Searching for "search":');
const searchResults = demo.search('search');
console.log('Search results:', searchResults);

console.log('Searching for "language":');
const languageResults = demo.search('language');
console.log('Language results:', languageResults);

// Function with search-related logic
function performAdvancedSearch(data, criteria) {
    const { searchField, searchValue, caseSensitive } = criteria;
    
    if (!searchValue) {
        return data; // Return all data if no search value
    }
    
    const search = caseSensitive ? searchValue : searchValue.toLowerCase();
    
    return data.filter(item => {
        const field = caseSensitive ? item[searchField] : item[searchField].toLowerCase();
        return field.includes(search);
    });
}

// Search configuration object
const searchConfig = {
    enabled: true,
    caseSensitive: false,
    highlightMatches: true,
    maxResults: 100,
    searchFields: ['name', 'description', 'content'],
    searchDelay: 300 // milliseconds
};

// Search utility functions
function escapeSearchTerm(term) {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchMatches(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${escapeSearchTerm(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Search event handlers
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value;
            if (term.length >= 2) {
                performSearch(term);
            } else {
                clearSearchResults();
            }
        });
    }
    
    function performSearch(term) {
        // Simulated search functionality
        console.log(`Performing search for: ${term}`);
        
        // This would be replaced with actual search logic
        const results = mockSearchFunction(term);
        displaySearchResults(results);
    }
    
    function clearSearchResults() {
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
    
    function displaySearchResults(results) {
        if (searchResults) {
            searchResults.innerHTML = results.map(result => 
                `<div class="search-result">${result}</div>`
            ).join('');
        }
    }
    
    function mockSearchFunction(term) {
        // Mock search results for demonstration
        return [
            `Found: ${term} in function names`,
            `Found: ${term} in comments`,
            `Found: ${term} in variable names`,
            `Found: ${term} in string literals`
        ];
    }
});

// Search API class
class SearchAPI {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.cache = new Map();
    }
    
    async search(query, options = {}) {
        const cacheKey = `${query}_${JSON.stringify(options)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, options })
            });
            
            const results = await response.json();
            this.cache.set(cacheKey, results);
            
            return results;
        } catch (error) {
            console.error('Search API error:', error);
            throw error;
        }
    }
    
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
export { SearchDemo, SearchAPI, performAdvancedSearch, searchConfig };
