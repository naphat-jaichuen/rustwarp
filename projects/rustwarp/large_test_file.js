// Large test file for verifying search optimizations
// This file contains many lines and lots of repeated content

function generateTestContent() {
    const patterns = [
        'function example',
        'const variable',
        'let data',
        'if condition',
        'for loop',
        'while statement',
        'return value',
        'console.log',
        'document.getElementById',
        'addEventListener'
    ];
    
    let content = '';
    for (let i = 0; i < 1000; i++) {
        content += `// Line ${i + 1}: This is a test line with pattern\n`;
        
        patterns.forEach((pattern, index) => {
            content += `${pattern}${i}_${index}() {\n`;
            content += `    // Implementation for ${pattern} number ${i}\n`;
            content += `    const result = performOperation('${pattern}', ${i});\n`;
            content += `    console.log('Processing ${pattern} at line ${i}');\n`;
            content += `    return result;\n`;
            content += `}\n\n`;
        });
        
        if (i % 100 === 0) {
            content += `/* Checkpoint ${i}: This is a milestone comment */\n`;
            content += `function milestone_${i}() {\n`;
            content += `    console.log('Reached milestone ${i}');\n`;
            content += `    const data = {\n`;
            content += `        checkpoint: ${i},\n`;
            content += `        timestamp: Date.now(),\n`;
            content += `        status: 'complete'\n`;
            content += `    };\n`;
            content += `    return data;\n`;
            content += `}\n\n`;
        }
    }
    
    return content;
}

// Additional test functions
function searchTestFunction() {
    console.log('This function is for testing search functionality');
    const keywords = ['test', 'search', 'function', 'keyword'];
    
    keywords.forEach(keyword => {
        console.log(`Testing keyword: ${keyword}`);
    });
}

function performanceTestFunction() {
    console.log('This function tests performance with large files');
    const startTime = performance.now();
    
    // Simulate some processing
    for (let i = 0; i < 10000; i++) {
        const randomData = Math.random() * 1000;
        console.log(`Processing item ${i}: ${randomData}`);
    }
    
    const endTime = performance.now();
    console.log(`Performance test completed in ${endTime - startTime}ms`);
}

// Generate the test content
const testContent = generateTestContent();
console.log('Large test file generated with', testContent.length, 'characters');

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = {
        generateTestContent,
        searchTestFunction,
        performanceTestFunction
    };
}
