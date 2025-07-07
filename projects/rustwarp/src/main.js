// Global state
let viewCounter = 1;
let viewData = {}; // Store data for each view
let maxViews = 2;
let currentFontSize = 13; // Default font size in pixels
const minFontSize = 8;
const maxFontSize = 24;
const CONFIG_FILE = 'config.json';

// Configuration object
let config = {
  fontSize: 13
};

// Popup state
let selectedPopupIndex = -1;
let popupData = []; // Will be loaded from JSON file
let yamlFileTimestamps = {}; // Track file modification times

// Initialize view data
function initializeViewData(viewId) {
  viewData[viewId] = {
    rowCounter: 0,
    textInputEl: null,
    rowCountEl: null
  };
}

// Function to add a new entry to the terminal-like output with optional expandable content
function addTerminalEntry(text, viewId, isFileContent = false, expandableContent = null, allowHtml = false) {
  if (!text.trim() && !isFileContent) return; // Don't process empty text unless it's file content

  const viewInfo = viewData[viewId];
  if (!viewInfo) return;

  viewInfo.rowCounter++;
  const currentTime = new Date().toLocaleString();
  const rowId = `row-${viewId}-${viewInfo.rowCounter}`;

  // Create new terminal row with column structure
  const terminalRow = document.createElement('div');
  terminalRow.className = isFileContent ? 'terminal-row file-content-row' : 'terminal-row';
  terminalRow.id = rowId;
  
  // Build the row content with optional expand button
  let rowHTML = `
    <div class="row-time-column" style="font-size: ${Math.max(8, currentFontSize - 2)}px;">${currentTime}</div>
    <div class="row-content-column ${isFileContent ? 'file-content' : ''}" style="font-size: ${currentFontSize}px;">
      <div class="row-main-content">
        ${expandableContent ? '<span class="expand-button" onclick="toggleRowContent(\'' + rowId + '\')" title="Click to expand/collapse">▶</span>' : ''}
        <span class="row-text">${allowHtml ? text : escapeHtml(text)}</span>
      </div>
    </div>
  `;
  
  terminalRow.innerHTML = rowHTML;

  // Add expandable content if provided
  if (expandableContent) {
    const expandableDiv = document.createElement('div');
    expandableDiv.className = 'row-expandable-content';
    expandableDiv.id = `${rowId}-expandable`;
    expandableDiv.style.display = 'none';
    
    // Handle different types of expandable content
    if (typeof expandableContent === 'string') {
      expandableDiv.innerHTML = `<div class="expandable-text">${escapeHtml(expandableContent)}</div>`;
    } else if (expandableContent.type === 'buffer') {
      // Extract filename from title for language detection
      const fileName = expandableContent.fileName || (expandableContent.title ? expandableContent.title.replace('File Content: ', '') : null);
      const langPreset = fileName ? getLanguagePreset(fileName) : null;
      
      // Apply language styling to content
      const contentStyle = langPreset ? `background-color: ${langPreset.bgColor}; border-left: 3px solid ${langPreset.color};` : '';
      const langClass = langPreset ? `language-${langPreset.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
      
      // Enhanced header with language info
      const syntaxHighlightingBadge = langPreset && langPreset.prismLang ? 
        `<span class="syntax-badge" title="Syntax highlighting enabled for ${langPreset.name}">✨ Highlighted</span>` : '';
      
      const headerContent = langPreset ? 
        `<span class="lang-icon">${langPreset.icon}</span> ${expandableContent.title || 'Buffer Content'} <span class="lang-name" style="color: ${langPreset.color}; font-size: 0.8em; opacity: 0.7;">${langPreset.name}</span> ${syntaxHighlightingBadge}` :
        expandableContent.title || 'Buffer Content';
      
      const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if this is a large file and add performance indicators
      const isLargeFile = expandableContent.content && expandableContent.content.length > 50000;
      const largeFileWarning = isLargeFile ? 
        `<div class="large-file-warning">⚡ Large file detected (${expandableContent.content.length} chars) - search optimizations enabled</div>` : '';
      
      expandableDiv.innerHTML = `
        <div class="expandable-buffer">
          <div class="buffer-header">
            <div class="buffer-title-row">
              <span class="buffer-title">${headerContent}</span>
              <span class="buffer-info">${expandableContent.lines || 0} lines, ${expandableContent.size || 'unknown size'}</span>
            </div>
            ${largeFileWarning}
            <div class="buffer-search-row">
              <div class="search-container">
                <input type="text" id="${searchId}" class="search-input" placeholder="${isLargeFile ? 'Search in large file (optimized)...' : 'Search in file...'}" />
                <button class="search-clear" onclick="clearFileSearch('${searchId}', '${contentId}')" title="Clear search">✕</button>
                <span class="search-results" id="${searchId}-results"></span>
                <div class="search-nav">
                  <button class="search-prev" onclick="navigateSearch('${searchId}', '${contentId}', -1)" title="Previous match">↑</button>
                  <button class="search-next" onclick="navigateSearch('${searchId}', '${contentId}', 1)" title="Next match">↓</button>
                </div>
              </div>
            </div>
          </div>
          <div class="buffer-content ${langClass}" style="${contentStyle}" id="${contentId}">
            <pre><code class="language-${langPreset ? langPreset.prismLang || 'text' : 'text'}" data-original-content="${escapeHtml(expandableContent.content)}">${escapeHtml(expandableContent.content)}</code></pre>
          </div>
        </div>
      `;
      
      // Apply syntax highlighting after DOM insertion with optimizations for large files
      setTimeout(() => {
        if (window.Prism) {
          const codeElements = expandableDiv.querySelectorAll('pre code');
          codeElements.forEach(code => {
            // For very large files, skip syntax highlighting to improve performance
            const contentLength = code.textContent.length;
            if (contentLength > 100000) {
              console.log(`⚡ Skipping syntax highlighting for very large file (${contentLength} chars)`);
              code.className = 'language-text'; // Use plain text highlighting
            } else if (contentLength > 50000) {
              console.log(`⚡ Using basic syntax highlighting for large file (${contentLength} chars)`);
              // Use a timeout to prevent blocking
              setTimeout(() => window.Prism.highlightElement(code), 100);
            } else {
              window.Prism.highlightElement(code);
            }
          });
        }
        
        // Setup search functionality
        setupFileSearch(searchId, contentId);
      }, isLargeFile ? 100 : 10); // Longer delay for large files
    } else if (expandableContent.type === 'output') {
      expandableDiv.innerHTML = `
        <div class="expandable-output">
          <div class="output-header">
            <span class="output-title">${expandableContent.title || 'Command Output'}</span>
            <span class="output-info">${expandableContent.exitCode !== undefined ? 'Exit code: ' + expandableContent.exitCode : ''}</span>
          </div>
          <div class="output-content">${escapeHtml(expandableContent.content)}</div>
        </div>
      `;
    } else if (expandableContent.type === 'image') {
      const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      expandableDiv.innerHTML = `
        <div class="expandable-image">
          <div class="image-header">
            <span class="image-title">🖼️ ${expandableContent.title || 'Image'}</span>
            <span class="image-info">${expandableContent.size || 'unknown size'}</span>
          </div>
          <div class="image-content">
            <img id="${imageId}" src="${expandableContent.imageData}" alt="${expandableContent.fileName}" class="image-display" />
          </div>
          <div class="image-actions">
            <button class="image-action-btn" onclick="downloadImage('${escapeHtml(expandableContent.fileName)}', '${expandableContent.imageData}')" title="Download image">
              💾 Download
            </button>
            <button class="image-action-btn" onclick="copyImageToClipboard('${imageId}')" title="Copy image to clipboard">
              📋 Copy
            </button>
            <span class="image-dimensions" id="${imageId}-dimensions">Loading...</span>
          </div>
        </div>
      `;
      
      // Set up image load handler to get dimensions
      setTimeout(() => {
        const imgElement = document.getElementById(imageId);
        const dimensionsElement = document.getElementById(`${imageId}-dimensions`);
        
        if (imgElement && dimensionsElement) {
          imgElement.onload = function() {
            dimensionsElement.textContent = `${this.naturalWidth} × ${this.naturalHeight} pixels`;
          };
          
          imgElement.onerror = function() {
            dimensionsElement.textContent = 'Failed to load image';
          };
        }
      }, 10);
    }
    terminalRow.appendChild(expandableDiv);
  }

  // Add terminal entry
  const terminalOutput = document.getElementById(`terminal-output-${viewId}`);
  terminalOutput.appendChild(terminalRow);

  // Update row count
  updateRowCount(viewId);

  // Clear input only if it's the main input that's focused
  const activeElement = document.activeElement;
  const isMainInputFocused = activeElement === viewInfo.textInputEl;
  if (isMainInputFocused) {
    viewInfo.textInputEl.value = '';
  }

  // Auto-scroll to keep input visible
  scrollToInput(viewId);

  // Add fade-in effect
  terminalRow.style.opacity = '0';
  setTimeout(() => {
    terminalRow.style.transition = 'opacity 0.1s ease-in';
    terminalRow.style.opacity = '1';
  }, 5);
  
  return rowId; // Return the row ID for potential further manipulation
}


// Function to toggle expandable content in a terminal row
function toggleRowContent(rowId) {
  const expandableDiv = document.getElementById(`${rowId}-expandable`);
  const expandButton = document.querySelector(`#${rowId} .expand-button`);
  
  if (!expandableDiv || !expandButton) {
    console.warn(`Could not find expandable content for row ${rowId}`);
    return;
  }
  
  const isExpanded = expandableDiv.style.display !== 'none';
  
  if (isExpanded) {
    // Collapse - clean up any search states for this content
    const searchInputs = expandableDiv.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
      if (input.id && searchState[input.id]) {
        cleanupSearchState(input.id);
      }
    });
    
    expandableDiv.style.display = 'none';
    expandButton.innerHTML = '▶'; // Right arrow
    expandButton.title = 'Click to expand';
    console.log(`🗃️ Collapsed content for row ${rowId}`);
  } else {
    // Expand
    expandableDiv.style.display = 'block';
    expandButton.innerHTML = '▼'; // Down arrow
    expandButton.title = 'Click to collapse';
    console.log(`📜 Expanded content for row ${rowId}`);
    
    // Re-apply syntax highlighting for newly visible content
    setTimeout(() => {
      if (window.Prism) {
        const codeElements = expandableDiv.querySelectorAll('pre code[class*="language-"]');
        codeElements.forEach(code => {
          window.Prism.highlightElement(code);
        });
      }
      
      // Re-setup search functionality if it exists
      const searchInputs = expandableDiv.querySelectorAll('.search-input');
      searchInputs.forEach(input => {
        if (input.id) {
          const searchId = input.id;
          const contentId = searchId.replace('search-', 'content-');
          setupFileSearch(searchId, contentId);
        }
      });
      
      // Auto-scroll to keep the expanded content visible
      expandableDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}

// Function to update row count for a specific view
function updateRowCount(viewId) {
  const viewInfo = viewData[viewId];
  if (!viewInfo) return;
  
  const terminalOutput = document.getElementById(`terminal-output-${viewId}`);
  const currentRows = terminalOutput ? terminalOutput.children.length : 0;
  viewInfo.rowCountEl.textContent = currentRows;
}

// Function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to scroll to input and ensure it's visible
function scrollToInput(viewId) {
  const viewInfo = viewData[viewId];
  if (!viewInfo || !viewInfo.textInputEl) return;
  
  // Get the terminal output container and scroll it to bottom
  const terminalOutput = document.getElementById(`terminal-output-${viewId}`);
  if (terminalOutput) {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
      
      // Removed automatic focus - let user manually focus when needed
    });
  }
}

// Function to handle Enter key press
function handleEnterKey(event) {
  // Don't handle if a search input is currently focused
  const activeElement = document.activeElement;
  if (activeElement && activeElement.classList.contains('search-input')) {
    return;
  }
  
  console.log('🔑 Key pressed:', event.key, 'in view:', event.target.dataset.viewId);
  if (event.key === 'Enter') {
    const viewId = parseInt(event.target.dataset.viewId);
    const text = event.target.value.trim();
    console.log('✅ Enter pressed, text:', text, 'viewId:', viewId);
    if (text) {
      // Check for special commands
      if (text.toLowerCase() === 'update') {
        addTerminalEntry(text, viewId);
        reloadPopupData();
      } else {
        addTerminalEntry(text, viewId);
      }
    }
  }
}

// Enhanced YAML parser for our command files
function parseSimpleYAML(yamlText) {
  const lines = yamlText.split('\n');
  const result = {};
  let currentArray = null;
  let currentArrayKey = null;
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    
    // Handle key-value pairs (with or without space after colon)
    if (line.includes(':') && indent === 0) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/["']/g, '');
      
      if (value) {
        // Simple key-value pair
        result[key] = value;
        currentArray = null;
        currentArrayKey = null;
      } else {
        // This is starting an array or object
        currentArrayKey = key;
        currentArray = [];
        result[key] = currentArray;
      }
    }
    // Handle array items
    else if (trimmed.startsWith('- ') && indent > 0) {
      const item = trimmed.substring(2).trim().replace(/["']/g, '');
      // Only add simple string items (skip complex nested items)
      if (currentArray && currentArrayKey && !item.includes(':')) {
        currentArray.push(item);
      }
    }
  }
  
  return result;
}

// Function to load popup data from YAML command files
async function loadPopupData() {
  try {
    popupData = [];
    
    // List of main command files to load
    const mainCommands = [
      'findall', 'install', 'get', 'run', 'zip', 'unzip', 'ci', 'create', 'register', 'update'
    ];
    
    console.log('🔧 Loading command data from YAML files...');
    
    for (const commandName of mainCommands) {
      try {
        let yamlContent = '';
        
        // Try loading with Tauri first
        if (window.__TAURI__ && window.__TAURI__.fs) {
          try {
            const { readTextFile, BaseDirectory } = window.__TAURI__.fs;
            yamlContent = await readTextFile(`data/command/${commandName}.yml`, {
              baseDir: BaseDirectory.Resource
            });
          } catch (tauriError) {
            // Fallback to fetch
            const response = await fetch(`./data/command/${commandName}.yml`);
            if (response.ok) {
              yamlContent = await response.text();
            } else {
              throw new Error(`Failed to fetch ${commandName}.yml`);
            }
          }
        } else {
          // Use fetch for development
          const response = await fetch(`./data/command/${commandName}.yml`);
          if (response.ok) {
            yamlContent = await response.text();
          } else {
            throw new Error(`Failed to fetch ${commandName}.yml`);
          }
        }
        
        // Parse the YAML content
        const commandData = parseSimpleYAML(yamlContent);
        // Convert to popup format
        const popupCommand = {
          command: commandData.command || commandName,
          description: commandData.description || `${commandName} command`,
          example: commandData.example || `${commandName} ...`,
          category: commandData.category || 'general'
        };
        
        // Load subcommands if they exist
        if (commandData.subcommands && Array.isArray(commandData.subcommands)) {
          console.log(`🔥 ${commandName} has subcommands:`, commandData.subcommands);
          popupCommand.subcommands = [];
          
          for (const subCommandName of commandData.subcommands) {
            console.log(`🔄 Loading subcommand: ${commandName}/${subCommandName}`);
            try {
              let subYamlContent = '';
              
              // Handle special characters in filename (like *.pdf -> pdf.yml)
              let fileName = subCommandName;
              if (fileName.startsWith('*.')) {
                fileName = fileName.substring(2); // Remove *.  (*.pdf -> pdf)
              }
              if (fileName.startsWith('-')) {
                fileName = fileName.substring(1); // Remove - (-r -> r)
              }
              
              const filePath = `data/command/${commandName}/${fileName}.yml`;
              
              if (window.__TAURI__ && window.__TAURI__.fs) {
                try {
                  const { readTextFile, BaseDirectory } = window.__TAURI__.fs;
                  subYamlContent = await readTextFile(filePath, {
                    baseDir: BaseDirectory.Resource
                  });
                } catch (tauriError) {
                  const response = await fetch(`./${filePath}`);
                  if (response.ok) {
                    subYamlContent = await response.text();
                  }
                }
              } else {
                const response = await fetch(`./${filePath}`);
                if (response.ok) {
                  subYamlContent = await response.text();
                }
              }
              
              if (subYamlContent) {
                const subCommandData = parseSimpleYAML(subYamlContent);
                popupCommand.subcommands.push({
                  command: subCommandData.command || subCommandName,
                  description: subCommandData.description || `${subCommandName} subcommand`,
                  example: subCommandData.example || `${commandName} ${subCommandName}`,
                  category: subCommandData.category || popupCommand.category
                });
              } else {
                // If no YAML file found, create a basic entry
                popupCommand.subcommands.push({
                  command: subCommandName,
                  description: `${subCommandName} subcommand for ${commandName}`,
                  example: `${commandName} ${subCommandName}`,
                  category: popupCommand.category
                });
              }
            } catch (subError) {
              console.warn(`⚠️ Could not load subcommand ${commandName}/${subCommandName}:`, subError.message);
              // Add a fallback entry even if loading fails
              popupCommand.subcommands.push({
                command: subCommandName,
                description: `${subCommandName} subcommand for ${commandName}`,
                example: `${commandName} ${subCommandName}`,
                category: popupCommand.category
              });
            }
          }
        }
        
        popupData.push(popupCommand);
        console.log(`✅ Loaded command: ${commandName}`);
        
        // Store initial file timestamp
        const filePath = window.__TAURI__ ? `data/command/${commandName}.yml` : `./data/command/${commandName}.yml`;
        const modTime = await getFileModTime(filePath);
        if (modTime) {
          yamlFileTimestamps[filePath] = modTime;
        }
        
      } catch (commandError) {
        console.warn(`⚠️ Could not load command ${commandName}:`, commandError.message);
      }
    }
    
    console.log(`✅ Loaded ${popupData.length} commands from YAML files`);
    
    // Log categories for debugging
    const categories = [...new Set(popupData.map(cmd => cmd.category))];
    console.log(`📊 Categories available: ${categories.join(', ')}`);
    
    // Debug: Log the complete structure
    console.log(`🔍 Complete popupData structure:`, JSON.stringify(popupData, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to load YAML command data:', error);
    // Fallback to basic commands if YAML loading fails
    popupData = [
      { command: 'ls', description: 'List directory contents', example: 'ls -la', category: 'file-system' },
      { command: 'cd', description: 'Change directory', example: 'cd /home/user', category: 'navigation' },
      { command: 'pwd', description: 'Print working directory', example: 'pwd', category: 'navigation' },
      { command: 'mkdir', description: 'Create directory', example: 'mkdir newfolder', category: 'file-system' },
      { command: 'rm', description: 'Remove files/directories', example: 'rm file.txt', category: 'file-system' }
    ];
    console.log('📋 Using fallback popup data');
  }
}

// Utility function to get commands by category
function getCommandsByCategory(category) {
  return popupData.filter(cmd => cmd.category === category);
}

// Utility function to add new commands (for future extensibility)
function addCustomCommand(command, description, example, category = 'custom') {
  popupData.push({ command, description, example, category });
  console.log(`➕ Added custom command: ${command}`);
}

// Function to load configuration from file
async function loadConfig() {
  if (!window.__TAURI__) {
    console.log('Not running in Tauri, using defaults');
    return;
  }

  try {
    const { readTextFile, BaseDirectory } = window.__TAURI__.fs;
    const configData = await readTextFile(CONFIG_FILE, { 
      baseDir: BaseDirectory.AppConfig 
    });
    config = JSON.parse(configData);
    
    // Apply loaded font size
    if (config.fontSize && config.fontSize >= minFontSize && config.fontSize <= maxFontSize) {
      currentFontSize = config.fontSize;
      console.log(`✅ Loaded font size: ${currentFontSize}px`);
    } else {
      console.log('⚠️ Invalid font size in config, using default');
      currentFontSize = 13;
      config.fontSize = 13;
      // Don't await saveConfig to prevent blocking
      saveConfig().catch(err => console.log('Failed to save default config:', err));
    }
  } catch (error) {
    console.log('📁 No existing config found, creating default config');
    // Create default config
    config = { fontSize: 13 };
    currentFontSize = 13;
    // Don't await saveConfig to prevent blocking
    saveConfig().catch(err => console.log('Failed to save default config:', err));
    console.log(`✅ Created default config with font size: ${currentFontSize}px`);
  }
}

// Function to save configuration to file
async function saveConfig() {
  if (!window.__TAURI__) {
    console.log('Not running in Tauri, cannot save config');
    return;
  }

  try {
    const { writeTextFile, BaseDirectory } = window.__TAURI__.fs;
    config.fontSize = currentFontSize;
    await writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
      baseDir: BaseDirectory.AppConfig
    });
    console.log(`💾 Saved font size: ${currentFontSize}px`);
  } catch (error) {
    console.error('❌ Failed to save config:', error);
    // Try to create the directory first and retry
    try {
      const { mkdir, BaseDirectory } = window.__TAURI__.fs;
      await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
      await writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
        baseDir: BaseDirectory.AppConfig
      });
      console.log(`💾 Created directory and saved font size: ${currentFontSize}px`);
    } catch (retryError) {
      console.error('❌ Failed to save config even after creating directory:', retryError);
    }
  }
}

// Function to adjust font size
function adjustFontSize(delta) {
  const newSize = Math.max(minFontSize, Math.min(maxFontSize, currentFontSize + delta));
  if (newSize !== currentFontSize) {
    currentFontSize = newSize;
    updateTerminalFontSize();
    // Save the new font size
    saveConfig();
  }
}

// Function to update all terminal elements with new font size
function updateTerminalFontSize() {
  // Update CSS custom property for dynamic font sizing
  document.documentElement.style.setProperty('--terminal-font-size', `${currentFontSize}px`);
  
  // Update terminal outputs
  const terminalOutputs = document.querySelectorAll('.terminal-output');
  terminalOutputs.forEach(output => {
    output.style.fontSize = `${currentFontSize}px`;
  });
  
  // Update terminal inputs
  const terminalInputs = document.querySelectorAll('.terminal-input');
  terminalInputs.forEach(input => {
    input.style.fontSize = `${currentFontSize}px`;
  });
  
  // Update text inputs
  const textInputs = document.querySelectorAll('.text-input');
  textInputs.forEach(input => {
    input.style.fontSize = `${currentFontSize}px`;
  });
  
  // Update terminal stats
  const terminalStats = document.querySelectorAll('.terminal-stats');
  terminalStats.forEach(stats => {
    stats.style.fontSize = `${Math.max(8, currentFontSize - 2)}px`;
  });
  
  // Update timestamp font size (slightly smaller)
  const terminalTimes = document.querySelectorAll('.row-time-column');
  terminalTimes.forEach(time => {
    time.style.fontSize = `${Math.max(8, currentFontSize - 2)}px`;
  });
  
  // Update terminal text
  const terminalTexts = document.querySelectorAll('.row-content-column');
  terminalTexts.forEach(text => {
    text.style.fontSize = `${currentFontSize}px`;
  });
}

// Function to apply current font size to a specific view
function applyFontSizeToView(viewId) {
  // Update terminal output for this view
  const terminalOutput = document.querySelector(`#terminal-output-${viewId}`);
  if (terminalOutput) {
    terminalOutput.style.fontSize = `${currentFontSize}px`;
  }
  
  // Update terminal input for this view
  const terminalInput = document.querySelector(`#view-${viewId} .terminal-input`);
  if (terminalInput) {
    terminalInput.style.fontSize = `${currentFontSize}px`;
  }
  
  // Update text input for this view
  const textInput = document.querySelector(`#text-input-${viewId}`);
  if (textInput) {
    textInput.style.fontSize = `${currentFontSize}px`;
  }
  
  // Update terminal stats for this view
  const terminalStats = document.querySelector(`#view-${viewId} .terminal-stats`);
  if (terminalStats) {
    terminalStats.style.fontSize = `${Math.max(8, currentFontSize - 2)}px`;
  }
}

// Function to handle global keyboard shortcuts
function handleGlobalKeydown(event) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;
  
  // Check if focus is already on an input field
  const activeElement = document.activeElement;
  const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
  
  // Handle font size shortcuts first (these should work even when input is focused)
  if (ctrlOrCmd) {
    if (event.key === '=' || event.key === '+') {
      // Increase font size
      event.preventDefault();
      adjustFontSize(1);
      return;
    } else if (event.key === '-' || event.key === '_') {
      // Decrease font size
      event.preventDefault();
      adjustFontSize(-1);
      return;
    } else if (event.key === '0') {
      // Reset to default font size
      event.preventDefault();
      currentFontSize = 13;
      updateTerminalFontSize();
      saveConfig();
      return;
    } else if (event.key === 'r' || event.key === 'R') {
      // Update popup data (Ctrl/Cmd + R)
      event.preventDefault();
      reloadPopupData();
      return;
    }
  }
  
  // Focus input on any key press (if not already focused on an input)
  if (!isInputFocused) {
    // Skip certain special keys that shouldn't trigger focus
    const skipKeys = ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
    
    if (!skipKeys.includes(event.key) && !ctrlOrCmd) {
      // Focus the active view's input
      const activeViewId = window.currentActiveView || 1;
      const viewInfo = viewData[activeViewId];
      if (viewInfo && viewInfo.textInputEl) {
        // Don't prevent default here - let the key press go through to the input
        viewInfo.textInputEl.focus();
        console.log(`🎯 Key '${event.key}' pressed - focused input for view ${activeViewId}`);
        
        // Re-dispatch the key event to the input so the character appears
        setTimeout(() => {
          const newEvent = new KeyboardEvent('keydown', {
            key: event.key,
            code: event.code,
            keyCode: event.keyCode,
            which: event.which,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey
          });
          viewInfo.textInputEl.dispatchEvent(newEvent);
        }, 0);
      }
      return;
    }
  }
}

// Function to check if horizontal scrollbar is present
function hasHorizontalScrollbar() {
  const viewContainer = document.querySelector('#view-container');
  return viewContainer.scrollWidth > viewContainer.clientWidth;
}

// Function to calculate required width to show all views without scrolling
function calculateRequiredWidth(viewCount) {
  const minViewWidth = 360; // Minimum width per view
  const borderPadding = 40; // Extra space for borders, padding, etc.
  return (viewCount * minViewWidth) + borderPadding;
}

// Function to resize window based on view count and content
async function resizeWindowForViews(viewCount) {
  try {
    if (window.__TAURI__) {
      const { getCurrentWindow } = window.__TAURI__.window;
      const appWindow = getCurrentWindow();
      
      // Calculate required width to show all content without scrolling
      const requiredWidth = calculateRequiredWidth(viewCount);
      
      // Get current window size
      const currentSize = await appWindow.innerSize();
      
      // Check if we need to expand the window
      let newWidth = Math.max(800, requiredWidth); // Never go below 800px minimum
      
      // Only resize if the new width is different from current width
      if (Math.abs(currentSize.width - newWidth) > 10) { // 10px tolerance
        await appWindow.setSize({
          width: newWidth,
          height: currentSize.height
        });
        
        // Wait a bit for the resize to take effect, then check if scrollbar still exists
        setTimeout(async () => {
          if (hasHorizontalScrollbar()) {
            // If scrollbar still exists, add more width
            const extraWidth = 100;
            newWidth += extraWidth;
            await appWindow.setSize({
              width: newWidth,
              height: currentSize.height
            });
          }
        }, 100);
      }
    }
  } catch (error) {
    console.log('Window resize not available (likely in development mode)');
  }
}

// Function to monitor and auto-expand window when scrollbar appears
function setupScrollbarMonitoring() {
  const viewContainer = document.querySelector('#view-container');
  let resizeTimeout;
  
  // Monitor for content changes that might cause scrollbars
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (hasHorizontalScrollbar()) {
        const currentViews = viewContainer.children.length;
        resizeWindowForViews(currentViews);
      }
    }, 150); // Debounce to avoid too many resize calls
  });
  
  resizeObserver.observe(viewContainer);
  
  // Also monitor window resize events
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (hasHorizontalScrollbar()) {
        const currentViews = viewContainer.children.length;
        resizeWindowForViews(currentViews);
      }
    }, 150);
  });
}

// Function to create a new view
async function createNewView() {
  console.log('🔨 Starting createNewView...');
  
  // Check if YAML files have changed and reload only if necessary
  console.log('🔍 Checking for YAML file changes before creating new view...');
  try {
    const reloaded = await reloadPopupDataIfChanged();
    if (reloaded) {
      console.log('✅ YAML files were updated for new view');
    } else {
      console.log('✅ Using cached YAML data for new view');
    }
  } catch (error) {
    console.warn('⚠️ Failed to check YAML file changes for new view:', error);
  }
  
  const viewContainer = document.querySelector('#view-container');
  console.log('📆 View container found:', !!viewContainer);
  
  if (!viewContainer) {
    console.error('❌ View container not found!');
    return;
  }
  
  const currentViews = viewContainer.children.length;
  console.log('📈 Current views count:', currentViews, 'Max views:', maxViews);
  
  // Limit to max 2 views
  if (currentViews >= maxViews) {
    console.log('⚠️ Maximum views reached');
    alert(`Maximum of ${maxViews} views allowed. Please close a view first.`);
    return;
  }
  
  viewCounter++;
  const newViewId = viewCounter;
  console.log('🆕 Creating new view with ID:', newViewId);
  
  // Add divider before the new view if this is the second view
  if (currentViews === 1) {
    const dividerHtml = `<div class="view-divider" id="view-divider"></div>`;
    viewContainer.insertAdjacentHTML('beforeend', dividerHtml);
    setupDividerResizing();
  }
  
  // Create new view HTML
  const newViewHtml = `
    <div class="view-panel" id="view-${newViewId}" data-view-id="${newViewId}">
      <div class="view-header">
        <div class="view-header-main">
          <h2>Terminal View ${newViewId}</h2>
          <div class="current-folder-info">
            <span class="folder-path" id="folder-path-${newViewId}" title="Current folder">No folder set</span>
            <button class="browse-btn" id="browse-btn-${newViewId}" onclick="browseCurrentFolder(${newViewId})" title="Browse current folder" disabled>📁</button>
          </div>
        </div>
        <button class="close-view-btn" onclick="closeView(${newViewId})" title="Close view">×</button>
      </div>
      
      <div class="view-content">
        <div class="terminal-output" id="terminal-output-${newViewId}">
          <!-- Terminal rows will be added here dynamically -->
        </div>
        
        <div class="terminal-stats">
          <span>Total entries: <span id="row-count-${newViewId}" class="row-count">0</span></span>
        </div>
        
        <div class="terminal-input">
          <div class="popup-overlay" id="popup-overlay-${newViewId}">
            <table class="popup-table">
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Description</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody id="popup-table-body-${newViewId}">
                <!-- Popup rows will be added here dynamically -->
              </tbody>
            </table>
          </div>
          <span class="terminal-prompt">$</span>
          <input 
            id="text-input-${newViewId}" 
            class="text-input"
            type="text" 
            placeholder="type your command here..." 
            autocomplete="off"
            data-view-id="${newViewId}"
          />
        </div>
      </div>
    </div>
  `;
  
  // Add new view to container
  console.log('📎 Adding new view HTML to container...');
  viewContainer.insertAdjacentHTML('beforeend', newViewHtml);
  console.log('✅ HTML added to container');
  
  // Initialize view data and event listeners
  console.log('⚙️ Initializing view data and event listeners...');
  initializeView(newViewId);
  console.log('✅ View initialized');
  
  // Apply current font size to the new view
  console.log('🎨 Applying font size to new view...');
  applyFontSizeToView(newViewId);
  console.log('✅ Font size applied');
  
  // Focus on new view's input
  console.log('🎯 Focusing on new view input...');
  if (viewData[newViewId] && viewData[newViewId].textInputEl) {
    viewData[newViewId].textInputEl.focus();
    console.log('✅ New view input focused');
  } else {
    console.error('❌ Failed to focus on new view input');
  }
  
  // Resize window for new view count
  console.log('📄 Calculating new view count...');
  const newViewCount = viewContainer.children.filter(child => child.classList.contains('view-panel')).length;
  console.log('📈 New view count:', newViewCount);
  
  console.log('🗨️ Resizing window for new view count...');
  resizeWindowForViews(newViewCount);
  
  console.log('🎉 createNewView completed successfully!');
}

// Function to setup divider resizing
function setupDividerResizing() {
  const divider = document.querySelector('#view-divider');
  const viewContainer = document.querySelector('#view-container');
  let isResizing = false;
  let startX = 0;
  let startLeftWidth = 0;
  let startRightWidth = 0;
  
  divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    
    const views = viewContainer.querySelectorAll('.view-panel');
    const leftView = views[0];
    const rightView = views[1];
    
    startLeftWidth = leftView.offsetWidth;
    startRightWidth = rightView.offsetWidth;
    
    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const views = viewContainer.querySelectorAll('.view-panel');
    const leftView = views[0];
    const rightView = views[1];
    
    const minWidth = 380; // Minimum width for each view
    const containerWidth = viewContainer.offsetWidth - 8; // Subtract divider width
    
    let newLeftWidth = startLeftWidth + deltaX;
    let newRightWidth = startRightWidth - deltaX;
    
    // Enforce minimum widths
    if (newLeftWidth < minWidth) {
      newLeftWidth = minWidth;
      newRightWidth = containerWidth - newLeftWidth;
    }
    
    if (newRightWidth < minWidth) {
      newRightWidth = minWidth;
      newLeftWidth = containerWidth - newRightWidth;
    }
    
    // Apply new widths using flex-basis
    leftView.style.flexBasis = `${newLeftWidth}px`;
    leftView.style.flexGrow = '0';
    leftView.style.flexShrink = '0';
    
    rightView.style.flexBasis = `${newRightWidth}px`;
    rightView.style.flexGrow = '0';
    rightView.style.flexShrink = '0';
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  });
}

// Function to close a view
function closeView(viewId) {
  const viewContainer = document.querySelector('#view-container');
  const viewPanels = viewContainer.querySelectorAll('.view-panel');
  
  // Don't allow closing if it's the only view
  if (viewPanels.length <= 1) {
    alert('Cannot close the last remaining view.');
    return;
  }
  
  const viewElement = document.querySelector(`#view-${viewId}`);
  if (viewElement) {
    // Remove from DOM
    viewElement.remove();
    
    // Remove divider if going back to single view
    const divider = document.querySelector('#view-divider');
    if (divider && viewPanels.length === 2) { // 2 because we haven't updated the count yet
      divider.remove();
      
      // Reset remaining view's flex properties
      const remainingView = viewContainer.querySelector('.view-panel');
      if (remainingView) {
        remainingView.style.flexBasis = '';
        remainingView.style.flexGrow = '1';
        remainingView.style.flexShrink = '1';
      }
    }
    
    // Clean up view data
    delete viewData[viewId];
    
    // Update layout classes if needed
    updateViewLayout();
    
    // Focus on remaining view's input if it exists
    const remainingViews = viewContainer.querySelectorAll('.view-panel');
    if (remainingViews.length === 1) {
      const remainingViewId = remainingViews[0].dataset.viewId;
      const remainingViewData = viewData[remainingViewId];
      if (remainingViewData && remainingViewData.textInputEl) {
        remainingViewData.textInputEl.focus();
      }
    }
    
    // Resize window for new view count
    const newViewCount = viewContainer.querySelectorAll('.view-panel').length;
    resizeWindowForViews(newViewCount);
  }
}

// Function to update view layout classes
function updateViewLayout() {
  const viewContainer = document.querySelector('#view-container');
  const views = viewContainer.children;
  
  // Add/remove single class based on view count
  for (let view of views) {
    if (views.length === 1) {
      view.classList.add('single');
    } else {
      view.classList.remove('single');
    }
  }
}

// Popup functionality

// Function to get dynamic suggestions based on current input
function getDynamicSuggestions(inputText) {
  console.log(`🔍 getDynamicSuggestions: "${inputText}"`);
  
  if (!inputText.trim()) {
    return popupData; // Show all main commands if input is empty
  }
  
  const words = inputText.trim().split(/\s+/);
  const firstWord = words[0].toLowerCase();
  
  // Find the main command that matches the first word
  const mainCommand = popupData.find(cmd => cmd.command.toLowerCase() === firstWord);
  
  if (mainCommand && mainCommand.subcommands && (words.length > 1 || inputText.endsWith(' '))) {
    console.log(`🔥 Showing subcommands for ${firstWord}:`, mainCommand.subcommands);
    // If we found a main command with subcommands and user has typed more words,
    // show subcommands filtered by the remaining text
    const remainingText = words.slice(1).join(' ').toLowerCase();
    
    if (!remainingText) {
      // Show all subcommands if no additional text after the main command
      return mainCommand.subcommands;
    }
    
    // Filter subcommands based on remaining text
    const filtered = mainCommand.subcommands.filter(subcmd => 
      subcmd.command.toLowerCase().includes(remainingText) ||
      subcmd.description.toLowerCase().includes(remainingText)
    );
    return filtered;
  } else {
    // Show main commands filtered by input text
    const filtered = popupData.filter(item => 
      item.command.toLowerCase().includes(inputText.toLowerCase()) ||
      item.description.toLowerCase().includes(inputText.toLowerCase())
    );
    return filtered;
  }
}

// Function to show popup with filtered suggestions
function showPopup(viewId, filterText = '') {
  const popup = document.getElementById(`popup-overlay-${viewId}`);
  const tableBody = document.getElementById(`popup-table-body-${viewId}`);
  
  if (!popup || !tableBody) return;
  
  // Get dynamic suggestions based on current input
  const filteredData = getDynamicSuggestions(filterText);
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add context header for subcommands
  const words = filterText.trim().split(/\s+/);
  const isSubcommandContext = words.length > 1 && 
    popupData.find(cmd => cmd.command.toLowerCase() === words[0].toLowerCase() && cmd.subcommands);
    
  if (isSubcommandContext && filteredData.length > 0) {
    const contextHeader = document.createElement('tr');
    contextHeader.innerHTML = `
      <td colspan="3" class="popup-context-header">
        Subcommands for "${words[0]}"
      </td>
    `;
    tableBody.appendChild(contextHeader);
  }
  
  // Add filtered rows
  filteredData.forEach((item, index) => {
    const row = document.createElement('tr');
    row.setAttribute('data-index', index);
    
    // Format the command display based on context
    let displayCommand = item.command;
    let commandClass = isSubcommandContext ? 'subcommand' : 'main-command';
    
    if (isSubcommandContext) {
      // For subcommands, show the full command including the main command
      displayCommand = `${words[0]} ${item.command}`;
    }
    
    row.innerHTML = `
      <td class="${commandClass}">${displayCommand}</td>
      <td>${item.description}</td>
      <td>${item.example}</td>
    `;
    
    // Add click handler
    row.addEventListener('click', () => {
      if (isSubcommandContext) {
        // For subcommands, replace the entire input with the full command
        selectPopupItem(viewId, displayCommand);
      } else {
        selectPopupItem(viewId, item.command);
      }
    });
    
    tableBody.appendChild(row);
  });
  
  // Show popup if there are results
  if (filteredData.length > 0) {
    popup.style.display = 'block';
    selectedPopupIndex = -1;
    
    // Log for debugging
    const words = filterText.trim().split(/\s+/);
    if (words.length > 1) {
      console.log(`🔄 Showing ${filteredData.length} subcommands for '${words[0]}'`);
    } else {
      console.log(`📋 Showing ${filteredData.length} main commands`);
    }
  } else {
    popup.style.display = 'none';
  }
}

// Function to hide popup
function hidePopup(viewId) {
  const popup = document.getElementById(`popup-overlay-${viewId}`);
  if (popup) {
    popup.style.display = 'none';
    selectedPopupIndex = -1;
  }
}

// Function to select item from popup
function selectPopupItem(viewId, command) {
  const viewInfo = viewData[viewId];
  if (viewInfo && viewInfo.textInputEl) {
    viewInfo.textInputEl.value = command;
    hidePopup(viewId);
    viewInfo.textInputEl.focus();
  }
}

// Function to navigate popup with arrow keys
function navigatePopup(viewId, direction) {
  const popup = document.getElementById(`popup-overlay-${viewId}`);
  const tableBody = document.getElementById(`popup-table-body-${viewId}`);
  
  if (!popup || popup.style.display === 'none') return;
  
  const allRows = tableBody.querySelectorAll('tr');
  // Filter out header rows (context headers are not selectable)
  const selectableRows = Array.from(allRows).filter(row => {
    return !row.querySelector('.popup-context-header');
  });
  
  if (selectableRows.length === 0) return;
  
  // Remove current selection from all rows
  allRows.forEach(row => row.classList.remove('selected'));
  
  // Update selected index
  if (direction === 'down') {
    selectedPopupIndex = (selectedPopupIndex + 1) % selectableRows.length;
  } else if (direction === 'up') {
    selectedPopupIndex = selectedPopupIndex <= 0 ? selectableRows.length - 1 : selectedPopupIndex - 1;
  }
  
  // Apply selection to the selectable row
  if (selectedPopupIndex >= 0 && selectedPopupIndex < selectableRows.length) {
    selectableRows[selectedPopupIndex].classList.add('selected');
  }
}

// Function to select current popup item with Enter
function selectCurrentPopupItem(viewId) {
  const popup = document.getElementById(`popup-overlay-${viewId}`);
  const tableBody = document.getElementById(`popup-table-body-${viewId}`);
  
  if (!popup || popup.style.display === 'none') return false;
  
  const allRows = tableBody.querySelectorAll('tr');
  // Filter out header rows (context headers are not selectable)
  const selectableRows = Array.from(allRows).filter(row => {
    return !row.querySelector('.popup-context-header');
  });
  
  if (selectedPopupIndex >= 0 && selectedPopupIndex < selectableRows.length) {
    const selectedRow = selectableRows[selectedPopupIndex];
    const command = selectedRow.cells[0].textContent;
    selectPopupItem(viewId, command);
    return true;
  }
  
  return false;
}

// Function to handle smart completion for subcommands
function handleSmartCompletion(viewId, currentInput) {
  const words = currentInput.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word - check if it's a complete main command with subcommands
    const mainCommand = popupData.find(cmd => cmd.command.toLowerCase() === words[0].toLowerCase());
    if (mainCommand && mainCommand.subcommands) {
      // Add a space and show subcommands
      const viewInfo = viewData[viewId];
      if (viewInfo && viewInfo.textInputEl) {
        viewInfo.textInputEl.value = currentInput + ' ';
        showPopup(viewId, currentInput + ' ');
        return true;
      }
    }
  }
  
  return false;
}

// Enhanced input event handlers
function setupPopupEventListeners(viewId) {
  const input = document.getElementById(`text-input-${viewId}`);
  if (!input) return;
  
  // Show popup on input
  input.addEventListener('input', (e) => {
    const value = e.target.value;
    
    // Show popup immediately after first space or if there's any input
    if (value.length > 0) {
      // Check if we just typed a space after the first word (immediate popup trigger)
      const words = value.trim().split(/\s+/);
      const hasSpace = value.includes(' ');
      
      if (hasSpace || value.length > 0) {
        showPopup(viewId, value);
      }
    } else {
      hidePopup(viewId);
    }
  });
  
  // Handle special keys
  input.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigatePopup(viewId, 'down');
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigatePopup(viewId, 'up');
        break;
      case 'Escape':
        hidePopup(viewId);
        break;
      case 'Tab':
        e.preventDefault();
        // Try smart completion first
        if (!handleSmartCompletion(viewId, e.target.value)) {
          // If no smart completion, select current item
          if (selectCurrentPopupItem(viewId)) {
            // Item was selected, don't process as normal tab
          }
        }
        break;
      case ' ': // Space key
        // Show popup immediately when space is pressed after any character
        setTimeout(() => {
          const currentValue = e.target.value;
          if (currentValue.includes(' ') && currentValue.trim().length > 0) {
            // Show popup immediately for command suggestions
            showPopup(viewId, currentValue);
            
            // Also check for smart completion
            if (currentValue.endsWith(' ')) {
              handleSmartCompletion(viewId, currentValue.trim());
            }
          }
        }, 10);
        break;
    }
  });
  
  // Hide popup when input loses focus (with delay to allow for clicks)
  input.addEventListener('blur', () => {
    setTimeout(() => {
      hidePopup(viewId);
    }, 150);
  });
}

// Tauri File Drop functionality

// Function to get the currently active or focused view
function getActiveViewId() {
  // First priority: active drag target set by auto-activation during drag
  if (window.activeDragTargetView) {
    console.log(`🎯 Found active drag target: ${window.activeDragTargetView}`);
    return window.activeDragTargetView;
  }
  
  // Second priority: current active view set by hover
  if (window.currentActiveView) {
    console.log(`🎯 Found current active view: ${window.currentActiveView}`);
    return window.currentActiveView;
  }
  
  // Third priority: try to find which input is focused
  const focusedInput = document.querySelector('.text-input:focus');
  if (focusedInput) {
    const viewId = parseInt(focusedInput.dataset.viewId);
    console.log(`🎯 Found focused view: ${viewId}`);
    return viewId;
  }
  
  // Fourth priority: try to find the view with active-target class
  const activeView = document.querySelector('.view-panel.active-target');
  if (activeView) {
    const viewId = parseInt(activeView.dataset.viewId);
    console.log(`🎯 Found active-target view: ${viewId}`);
    return viewId;
  }
  
  // Fallback to the first view
  console.log('🎯 No specific view detected, using view 1 as fallback');
  return 1;
}

// Function to setup Tauri onDragDropEvent
function onDragDropEvent(event) {
  console.log('DragDrop event detected:', event);
  
  const files = event.payload.paths || event.payload;
  if (files && files.length > 0) {
    // Try to detect which view should receive the files
    const viewId = getActiveViewId();
    console.log(`🎯 Tauri drop target: view ${viewId}`);
    
    files.forEach(async (filePath) => {
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
      const message = `📁 Dropped file: ${fileName}`;
      addTerminalEntry(message, viewId);
      
      // Try to read file content (function will handle text vs binary detection)
      await readTauriFileContent(filePath, viewId);
    });
  }
}

// Function to setup Tauri file drop listener using getCurrentWebview().onDragDropEvent()
async function setupTauriFileDropListener() {
  if (!window.__TAURI__) {
    console.log('Tauri not available, file drop disabled');
    return;
  }
  
  console.log('Setting up Tauri file drop listener with getCurrentWebview()...');
  
  try {
    // Import Tauri webview
    const { getCurrentWebview } = window.__TAURI__.webview;
    
    // Setup drag drop event listener
    const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
      console.log('getCurrentWebview onDragDropEvent triggered:', event);
      
      if (event.payload.type === 'drop') {
        console.log('File drop detected via getCurrentWebview:', event.payload);
        
        const files = event.payload.paths;
        if (files && files.length > 0) {
          // Try to detect which view should receive the files
          const viewId = getActiveViewId();
          console.log(`🎯 Tauri webview drop target: view ${viewId}`);
          
          files.forEach(async (filePath) => {
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
            const message = `📁 Dropped file: ${fileName}`;
            addTerminalEntry(message, viewId);
            
            // Try to read file content (function will handle text vs binary detection)
            await readTauriFileContent(filePath, viewId);
          });
        }
      } else if (event.payload.type === 'hover') {
        console.log('File drop hover detected via getCurrentWebview');
        // Add visual feedback to all views
        const viewPanels = document.querySelectorAll('.view-panel');
        viewPanels.forEach(panel => panel.classList.add('drag-over'));
      } else if (event.payload.type === 'cancelled') {
        console.log('File drop cancelled via getCurrentWebview');
        // Remove visual feedback from all views
        const viewPanels = document.querySelectorAll('.view-panel');
        viewPanels.forEach(panel => panel.classList.remove('drag-over'));
      }
    });
    
    // Store the unlisten function for cleanup if needed
    window.dragDropUnlisten = unlisten;
    
    console.log('Tauri getCurrentWebview file drop listener setup complete');
  } catch (error) {
    console.error('Failed to setup getCurrentWebview drag drop listener:', error);
    
    // Fallback to the previous method
    console.log('Falling back to event listener approach...');
    const { listen } = window.__TAURI__.event;
    
    // Listen for file drop events using onDragDropEvent
    listen('tauri://file-drop', onDragDropEvent);

    // Listen for file drop hover events (for visual feedback)
    listen('tauri://file-drop-hover', (event) => {
      console.log('File drop hover detected');
      // Add visual feedback to all views
      const viewPanels = document.querySelectorAll('.view-panel');
      viewPanels.forEach(panel => panel.classList.add('drag-over'));
    });
    
    // Listen for file drop cancelled events
    listen('tauri://file-drop-cancelled', (event) => {
      console.log('File drop cancelled');
      // Remove visual feedback from all views
      const viewPanels = document.querySelectorAll('.view-panel');
      viewPanels.forEach(panel => panel.classList.remove('drag-over'));
    });
    
    console.log('Fallback event listener setup complete');
  }
}

// Function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Language decoration presets for different file types
const languagePresets = {
  // Web Technologies
  '.js': { name: 'JavaScript', icon: '🟨', color: '#F7DF1E', bgColor: 'rgba(247, 223, 30, 0.1)', prismLang: 'javascript' },
  '.ts': { name: 'TypeScript', icon: '🔷', color: '#3178C6', bgColor: 'rgba(49, 120, 198, 0.1)', prismLang: 'typescript' },
  '.jsx': { name: 'React JSX', icon: '⚛️', color: '#61DAFB', bgColor: 'rgba(97, 218, 251, 0.1)', prismLang: 'jsx' },
  '.tsx': { name: 'React TSX', icon: '⚛️', color: '#61DAFB', bgColor: 'rgba(97, 218, 251, 0.1)', prismLang: 'tsx' },
  '.html': { name: 'HTML', icon: '🌐', color: '#E34F26', bgColor: 'rgba(227, 79, 38, 0.1)', prismLang: 'html' },
  '.css': { name: 'CSS', icon: '🎨', color: '#1572B6', bgColor: 'rgba(21, 114, 182, 0.1)', prismLang: 'css' },
  '.scss': { name: 'SCSS', icon: '🎨', color: '#CF649A', bgColor: 'rgba(207, 100, 154, 0.1)', prismLang: 'scss' },
  '.sass': { name: 'Sass', icon: '🎨', color: '#CF649A', bgColor: 'rgba(207, 100, 154, 0.1)', prismLang: 'sass' },
  '.vue': { name: 'Vue.js', icon: '💚', color: '#4FC08D', bgColor: 'rgba(79, 192, 141, 0.1)', prismLang: 'html' },
  
  // Systems Programming
  '.rs': { name: 'Rust', icon: '🦀', color: '#CE422B', bgColor: 'rgba(206, 66, 43, 0.1)', prismLang: 'rust' },
  '.c': { name: 'C', icon: '🔧', color: '#A8B9CC', bgColor: 'rgba(168, 185, 204, 0.1)', prismLang: 'c' },
  '.cpp': { name: 'C++', icon: '🔧', color: '#00599C', bgColor: 'rgba(0, 89, 156, 0.1)', prismLang: 'cpp' },
  '.cc': { name: 'C++', icon: '🔧', color: '#00599C', bgColor: 'rgba(0, 89, 156, 0.1)', prismLang: 'cpp' },
  '.h': { name: 'C Header', icon: '📄', color: '#A8B9CC', bgColor: 'rgba(168, 185, 204, 0.1)', prismLang: 'c' },
  '.hpp': { name: 'C++ Header', icon: '📄', color: '#00599C', bgColor: 'rgba(0, 89, 156, 0.1)', prismLang: 'cpp' },
  '.go': { name: 'Go', icon: '🐹', color: '#00ADD8', bgColor: 'rgba(0, 173, 216, 0.1)', prismLang: 'go' },
  '.zig': { name: 'Zig', icon: '⚡', color: '#F7A41D', bgColor: 'rgba(247, 164, 29, 0.1)', prismLang: 'clike' },
  
  // Scripting & Dynamic Languages
  '.py': { name: 'Python', icon: '🐍', color: '#3776AB', bgColor: 'rgba(55, 118, 171, 0.1)', prismLang: 'python' },
  '.rb': { name: 'Ruby', icon: '💎', color: '#CC342D', bgColor: 'rgba(204, 52, 45, 0.1)', prismLang: 'ruby' },
  '.php': { name: 'PHP', icon: '🐘', color: '#777BB4', bgColor: 'rgba(119, 123, 180, 0.1)', prismLang: 'php' },
  '.pl': { name: 'Perl', icon: '🐪', color: '#39457E', bgColor: 'rgba(57, 69, 126, 0.1)', prismLang: 'perl' },
  '.lua': { name: 'Lua', icon: '🌙', color: '#2C2D72', bgColor: 'rgba(44, 45, 114, 0.1)', prismLang: 'lua' },
  
  // JVM Languages
  '.java': { name: 'Java', icon: '☕', color: '#ED8B00', bgColor: 'rgba(237, 139, 0, 0.1)', prismLang: 'java' },
  '.kt': { name: 'Kotlin', icon: '🎯', color: '#7F52FF', bgColor: 'rgba(127, 82, 255, 0.1)', prismLang: 'kotlin' },
  '.scala': { name: 'Scala', icon: '🌶️', color: '#DC322F', bgColor: 'rgba(220, 50, 47, 0.1)', prismLang: 'scala' },
  '.clj': { name: 'Clojure', icon: '🌿', color: '#5881D8', bgColor: 'rgba(88, 129, 216, 0.1)', prismLang: 'clojure' },
  
  // Functional Languages
  '.hs': { name: 'Haskell', icon: '🎭', color: '#5D4F85', bgColor: 'rgba(93, 79, 133, 0.1)', prismLang: 'haskell' },
  '.elm': { name: 'Elm', icon: '🌳', color: '#60B5CC', bgColor: 'rgba(96, 181, 204, 0.1)', prismLang: 'elm' },
  '.ml': { name: 'OCaml', icon: '🐫', color: '#3BE133', bgColor: 'rgba(59, 225, 51, 0.1)', prismLang: 'ocaml' },
  '.fs': { name: 'F#', icon: '🔷', color: '#378BBA', bgColor: 'rgba(55, 139, 186, 0.1)', prismLang: 'fsharp' },
  
  // Shell & Scripts
  '.sh': { name: 'Shell Script', icon: '🐚', color: '#89E051', bgColor: 'rgba(137, 224, 81, 0.1)', prismLang: 'bash' },
  '.bash': { name: 'Bash', icon: '🐚', color: '#89E051', bgColor: 'rgba(137, 224, 81, 0.1)', prismLang: 'bash' },
  '.zsh': { name: 'Zsh', icon: '🐚', color: '#89E051', bgColor: 'rgba(137, 224, 81, 0.1)', prismLang: 'bash' },
  '.fish': { name: 'Fish', icon: '🐠', color: '#00D494', bgColor: 'rgba(0, 212, 148, 0.1)', prismLang: 'bash' },
  '.ps1': { name: 'PowerShell', icon: '💙', color: '#012456', bgColor: 'rgba(1, 36, 86, 0.1)', prismLang: 'powershell' },
  
  // Data & Config
  '.json': { name: 'JSON', icon: '📋', color: '#000000', bgColor: 'rgba(0, 0, 0, 0.05)', prismLang: 'json' },
  '.xml': { name: 'XML', icon: '📄', color: '#0060AC', bgColor: 'rgba(0, 96, 172, 0.1)', prismLang: 'xml' },
  '.yaml': { name: 'YAML', icon: '📝', color: '#CB171E', bgColor: 'rgba(203, 23, 30, 0.1)', prismLang: 'yaml' },
  '.yml': { name: 'YAML', icon: '📝', color: '#CB171E', bgColor: 'rgba(203, 23, 30, 0.1)', prismLang: 'yaml' },
  '.toml': { name: 'TOML', icon: '⚙️', color: '#9C4221', bgColor: 'rgba(156, 66, 33, 0.1)', prismLang: 'toml' },
  '.ini': { name: 'INI', icon: '⚙️', color: '#6D8086', bgColor: 'rgba(109, 128, 134, 0.1)', prismLang: 'ini' },
  '.conf': { name: 'Config', icon: '⚙️', color: '#6D8086', bgColor: 'rgba(109, 128, 134, 0.1)', prismLang: 'nginx' },
  '.env': { name: 'Environment', icon: '🌍', color: '#ECD53F', bgColor: 'rgba(236, 213, 63, 0.1)', prismLang: 'bash' },
  
  // Database
  '.sql': { name: 'SQL', icon: '🗃️', color: '#336791', bgColor: 'rgba(51, 103, 145, 0.1)', prismLang: 'sql' },
  '.sqlite': { name: 'SQLite', icon: '🗃️', color: '#003B57', bgColor: 'rgba(0, 59, 87, 0.1)', prismLang: 'sql' },
  
  // Documentation
  '.md': { name: 'Markdown', icon: '📖', color: '#083FA1', bgColor: 'rgba(8, 63, 161, 0.1)', prismLang: 'markdown' },
  '.rst': { name: 'reStructuredText', icon: '📖', color: '#141414', bgColor: 'rgba(20, 20, 20, 0.1)', prismLang: 'rest' },
  '.tex': { name: 'LaTeX', icon: '📜', color: '#008080', bgColor: 'rgba(0, 128, 128, 0.1)', prismLang: 'latex' },
  
  // Mobile
  '.swift': { name: 'Swift', icon: '🍎', color: '#FA7343', bgColor: 'rgba(250, 115, 67, 0.1)', prismLang: 'swift' },
  '.dart': { name: 'Dart', icon: '🎯', color: '#0175C2', bgColor: 'rgba(1, 117, 194, 0.1)', prismLang: 'dart' },
  
  // Other
  '.r': { name: 'R', icon: '📊', color: '#276DC3', bgColor: 'rgba(39, 109, 195, 0.1)', prismLang: 'r' },
  '.m': { name: 'MATLAB', icon: '🔢', color: '#0076A8', bgColor: 'rgba(0, 118, 168, 0.1)', prismLang: 'matlab' },
  '.jl': { name: 'Julia', icon: '🔴', color: '#9558B2', bgColor: 'rgba(149, 88, 178, 0.1)', prismLang: 'julia' },
  '.nim': { name: 'Nim', icon: '👑', color: '#FFE953', bgColor: 'rgba(255, 233, 83, 0.1)', prismLang: 'nim' },
  '.cr': { name: 'Crystal', icon: '💎', color: '#000000', bgColor: 'rgba(0, 0, 0, 0.05)', prismLang: 'crystal' },
  
  // Logs and plain text
  '.log': { name: 'Log File', icon: '📜', color: '#6C6C6C', bgColor: 'rgba(108, 108, 108, 0.1)', prismLang: 'log' },
  '.txt': { name: 'Text', icon: '📄', color: '#6C6C6C', bgColor: 'rgba(108, 108, 108, 0.05)', prismLang: 'text' },
  '.csv': { name: 'CSV', icon: '📊', color: '#1D6F42', bgColor: 'rgba(29, 111, 66, 0.1)', prismLang: 'csv' }
};

// Function to get language preset for a file
function getLanguagePreset(fileName) {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return languagePresets[ext] || { 
    name: 'Text File', 
    icon: '📄', 
    color: '#6C6C6C', 
    bgColor: 'rgba(108, 108, 108, 0.05)',
    prismLang: 'text'
  };
}

// Common binary file extensions that should never be treated as text
const binaryExtensions = new Set([
  '.exe', '.bin', '.dll', '.so', '.dylib', '.app',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.tiff', '.webp',
  '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.wav', '.flac', '.ogg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.jar', '.war', '.ear', '.deb', '.rpm', '.dmg', '.pkg', '.msi',
  '.o', '.obj', '.lib', '.a', '.class', '.pyc', '.pyo'
]);

// Function to check if file is likely text
function isTextFile(fileName) {
  // If no extension, treat as text (common for config files, scripts, etc.)
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return true;
  }
  
  const ext = fileName.toLowerCase().substring(lastDotIndex);
  
  // If it's a known binary extension, don't treat as text
  if (binaryExtensions.has(ext)) {
    return false;
  }
  
  // For all other extensions (known and unknown), treat as text
  // This includes files in languagePresets and any unknown text-like extensions
  return true;
}

// Search functionality for file content
let searchState = {}; // Global search state

// Function to clean up search state for a specific search instance
function cleanupSearchState(searchId) {
  if (searchState[searchId]) {
    console.log(`🧹 Cleaning up search state for: ${searchId}`);
    delete searchState[searchId];
  }
}

// Function to clean up all orphaned search states (for maintenance)
function cleanupOrphanedSearchStates() {
  const validSearchIds = [];
  document.querySelectorAll('.search-input').forEach(input => {
    if (input.id) validSearchIds.push(input.id);
  });
  
  Object.keys(searchState).forEach(searchId => {
    if (!validSearchIds.includes(searchId)) {
      console.log(`🧹 Removing orphaned search state: ${searchId}`);
      delete searchState[searchId];
    }
  });
}

function setupFileSearch(searchId, contentId) {
  const searchInput = document.getElementById(searchId);
  const contentElement = document.getElementById(contentId);
  
  if (!searchInput || !contentElement) return;
  
  // Pre-cache the original content to avoid issues with timing and DOM changes
  const codeElement = contentElement.querySelector('code');
  let originalContent = null;
  
  if (codeElement) {
    // Prioritize data-original-content attribute which is set before syntax highlighting
    originalContent = codeElement.dataset.originalContent || codeElement.textContent || '';
    console.log(`🔍 Setting up search for ${searchId}, content length: ${originalContent.length}`);
  } else {
    console.warn(`🔍 No code element found for ${searchId}`);
  }
  
  // Initialize search state with pre-cached content and backup
  searchState[searchId] = {
    currentMatch: 0,
    totalMatches: 0,
    originalContent: originalContent,
    backupContent: originalContent, // Additional backup
    contentElement: contentElement,
    searchTimeout: null,
    isLargeFile: originalContent ? originalContent.length > 50000 : false // Files larger than 50KB
  };
  
  if (searchState[searchId].isLargeFile) {
    console.log(`📊 Large file detected (${originalContent.length} chars), enabling optimizations`);
  }
  
  // Add search event listener with input debouncing for large files
  let inputTimeout;
  searchInput.addEventListener('input', (e) => {
    if (inputTimeout) clearTimeout(inputTimeout);
    
    // Use shorter delay for small files, longer for large files
    const delay = searchState[searchId].isLargeFile ? 200 : 50;
    
    inputTimeout = setTimeout(() => {
      performFileSearch(searchId, contentId, e.target.value);
    }, delay);
  });
  
  // Prevent the main input from stealing focus when search is active
  searchInput.addEventListener('focus', (e) => {
    e.stopPropagation();
    console.log('🔍 Search input focused');
  });
  
  searchInput.addEventListener('blur', (e) => {
    console.log('🔍 Search input blurred');
  });
  
  // Handle click events to ensure proper focus
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    searchInput.focus();
    console.log('🔍 Search input clicked and focused');
  });
  
  // Prevent parent elements from interfering
  searchInput.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  
  // Add keyboard shortcuts
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateSearch(searchId, contentId, e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearFileSearch(searchId, contentId);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      navigateSearch(searchId, contentId, e.shiftKey ? -1 : 1);
    }
  });
}

function performFileSearch(searchId, contentId, query) {
  const contentElement = document.getElementById(contentId);
  const resultsElement = document.getElementById(`${searchId}-results`);
  const codeElement = contentElement.querySelector('code');
  
  if (!contentElement || !codeElement) {
    console.warn(`🔍 Search elements not found - contentElement: ${!!contentElement}, codeElement: ${!!codeElement}`);
    return;
  }
  
  // Ensure search state exists
  if (!searchState[searchId]) {
    console.log(`🔍 Re-initializing search state for ${searchId}`);
    setupFileSearch(searchId, contentId);
    if (!searchState[searchId]) {
      console.error(`🔍 Failed to initialize search state for ${searchId}`);
      return;
    }
  }
  
  // Cancel any pending search operation
  if (searchState[searchId].searchTimeout) {
    clearTimeout(searchState[searchId].searchTimeout);
  }
  
  // Store original content if not already stored - prioritize data-original-content
  if (!searchState[searchId].originalContent) {
    // First try to get from data-original-content attribute (most reliable)
    const dataOriginalContent = codeElement.dataset.originalContent;
    if (dataOriginalContent) {
      searchState[searchId].originalContent = dataOriginalContent;
    } else {
      // Fallback to textContent but clean it of any existing highlights
      const textContent = codeElement.textContent || codeElement.innerText || '';
      searchState[searchId].originalContent = textContent;
    }
  }
  
  const originalContent = searchState[searchId].originalContent;
  
  // Ensure we have valid content to search
  if (!originalContent) {
    console.warn(`🔍 No original content found for search ${searchId}`);
    return;
  }
  
  console.log(`🔍 Searching "${query}" in ${originalContent.length} characters for ${searchId}`);
  
  if (!query.trim()) {
    // Clear search - restore original content with integrity check
    const contentToRestore = originalContent || searchState[searchId].backupContent;
    if (contentToRestore) {
      codeElement.innerHTML = escapeHtml(contentToRestore);
      console.log(`🧹 Restored content: ${contentToRestore.length} characters`);
    } else {
      console.error('🔍 No content to restore!');
    }
    
    resultsElement.textContent = '';
    searchState[searchId].currentMatch = 0;
    searchState[searchId].totalMatches = 0;
    
    // Re-apply syntax highlighting
    setTimeout(() => {
      if (window.Prism) {
        window.Prism.highlightElement(codeElement);
      }
    }, 10);
    return;
  }
  
  // For large files, use debounced search to prevent UI blocking
  const isLargeFile = searchState[searchId].isLargeFile;
  const searchDelay = isLargeFile ? 150 : 50; // Optimized delays
  
  if (isLargeFile) {
    // Show loading indicator for large files
    resultsElement.textContent = '🔍 Searching...';
    resultsElement.className = 'search-results searching';
  }
  
  // Debounced search execution
  searchState[searchId].searchTimeout = setTimeout(() => {
    performActualSearch(searchId, contentId, query, originalContent, codeElement, resultsElement);
  }, searchDelay);
  
}

// Separate function to perform the actual search (can be called asynchronously)
function performActualSearch(searchId, contentId, query, originalContent, codeElement, resultsElement) {
  const startTime = performance.now();
  const isLargeFile = searchState[searchId].isLargeFile;
  
  try {
    // Perform case-insensitive search
    const regex = new RegExp(escapeRegExp(query), 'gi');
    const matches = [...originalContent.matchAll(regex)];
    
    searchState[searchId].totalMatches = matches.length;
    searchState[searchId].currentMatch = matches.length > 0 ? 1 : 0;
    
    if (matches.length === 0) {
      resultsElement.textContent = 'No matches';
      resultsElement.className = 'search-results no-matches';
      // Restore original content safely
      const contentToRestore = originalContent || searchState[searchId].backupContent;
      if (contentToRestore) {
        codeElement.innerHTML = escapeHtml(contentToRestore);
        console.log(`🔍 No matches - restored ${contentToRestore.length} characters`);
      }
    } else {
      resultsElement.textContent = `${searchState[searchId].currentMatch}/${matches.length}`;
      resultsElement.className = 'search-results has-matches';
      
      // For large files with many matches, limit highlighting to prevent performance issues
      const maxHighlights = isLargeFile ? 500 : matches.length; // Reduced for better performance
      const matchesToHighlight = matches.slice(0, maxHighlights);
      
      if (matches.length > maxHighlights) {
        console.log(`⚡ Limiting highlights to ${maxHighlights} matches for performance`);
        resultsElement.textContent += ` (first ${maxHighlights} shown)`;
      }
      
      // Use requestAnimationFrame for better performance on large files
      if (isLargeFile) {
        requestAnimationFrame(() => {
          highlightMatches(matchesToHighlight, originalContent, codeElement);
          scrollToCurrentMatch(contentId);
        });
      } else {
        highlightMatches(matchesToHighlight, originalContent, codeElement);
        scrollToCurrentMatch(contentId);
      }
    }
    
    // Re-apply syntax highlighting while preserving search highlights
    setTimeout(() => {
      if (window.Prism && matches.length === 0) {
        window.Prism.highlightElement(codeElement);
      }
    }, 10);
    
    const endTime = performance.now();
    console.log(`🔍 Search completed in ${(endTime - startTime).toFixed(2)}ms for ${matches.length} matches`);
    
  } catch (error) {
    console.error('🔍 Search error:', error);
    resultsElement.textContent = 'Search error';
    resultsElement.className = 'search-results no-matches';
  }
}

// Optimized highlighting function
function highlightMatches(matches, originalContent, codeElement) {
  console.log(`🔍 Highlighting ${matches.length} matches in ${originalContent.length} characters`);
  
  // For better performance and to avoid content loss, process all matches at once
  // but use a more efficient algorithm
  try {
    let highlightedContent = originalContent;
    
    // Sort matches by index in descending order to process from end to beginning
    // This prevents index shifting issues
    const sortedMatches = [...matches].sort((a, b) => b.index - a.index);
    
    console.log(`🔍 Processing ${sortedMatches.length} sorted matches`);
    
    // Process all matches in a single pass to avoid content corruption
    sortedMatches.forEach((match, index) => {
      const start = match.index;
      const end = start + match[0].length;
      const originalIndex = matches.indexOf(match);
      const isCurrentMatch = originalIndex === 0;
      
      // Validate indices to prevent content corruption
      if (start < 0 || end > highlightedContent.length || start >= end) {
        console.warn(`🔍 Invalid match indices: start=${start}, end=${end}, content length=${highlightedContent.length}`);
        return;
      }
      
      const highlightClass = isCurrentMatch ? 'search-highlight current-match' : 'search-highlight';
      const matchText = highlightedContent.slice(start, end);
      const replacement = `<span class="${highlightClass}" data-match-index="${originalIndex}">${escapeHtml(matchText)}</span>`;
      
      // Safely replace the content
      const before = highlightedContent.slice(0, start);
      const after = highlightedContent.slice(end);
      highlightedContent = before + replacement + after;
      
      // Debug logging for first few matches
      if (index < 3) {
        console.log(`🔍 Match ${index}: "${matchText}" at ${start}-${end}, content length now: ${highlightedContent.length}`);
      }
    });
    
    console.log(`🔍 Final highlighted content length: ${highlightedContent.length}, original: ${originalContent.length}`);
    
    // Update DOM with the complete highlighted content
    codeElement.innerHTML = highlightedContent;
    
    // Verify content integrity
    const finalTextLength = codeElement.textContent.length;
    if (Math.abs(finalTextLength - originalContent.length) > 100) {
      console.warn(`🔍 Content length mismatch! Original: ${originalContent.length}, Final: ${finalTextLength}`);
      // Fallback: restore original content and try simple highlighting
      codeElement.innerHTML = escapeHtml(originalContent);
      console.log(`🔍 Restored original content due to length mismatch`);
    }
    
  } catch (error) {
    console.error('🔍 Error in highlighting:', error);
    // Fallback: restore original content
    codeElement.innerHTML = escapeHtml(originalContent);
  }
}

function navigateSearch(searchId, contentId, direction) {
  const state = searchState[searchId];
  if (!state || state.totalMatches === 0) return;
  
  // Update current match index
  state.currentMatch += direction;
  if (state.currentMatch > state.totalMatches) state.currentMatch = 1;
  if (state.currentMatch < 1) state.currentMatch = state.totalMatches;
  
  // Update results display
  const resultsElement = document.getElementById(`${searchId}-results`);
  if (resultsElement) {
    resultsElement.textContent = `${state.currentMatch}/${state.totalMatches}`;
  }
  
  // Update highlighting to show current match
  const contentElement = document.getElementById(contentId);
  const allHighlights = contentElement.querySelectorAll('.search-highlight');
  
  allHighlights.forEach((highlight, index) => {
    if (index === state.currentMatch - 1) {
      highlight.classList.add('current-match');
    } else {
      highlight.classList.remove('current-match');
    }
  });
  
  // Scroll to current match
  scrollToCurrentMatch(contentId);
}

function clearFileSearch(searchId, contentId) {
  const searchInput = document.getElementById(searchId);
  if (searchInput) {
    // Cancel any pending search operations
    if (searchState[searchId] && searchState[searchId].searchTimeout) {
      clearTimeout(searchState[searchId].searchTimeout);
    }
    
    searchInput.value = '';
    
    // For large files, show clearing indicator
    const resultsElement = document.getElementById(`${searchId}-results`);
    if (searchState[searchId] && searchState[searchId].isLargeFile && resultsElement) {
      resultsElement.textContent = '🧹 Clearing...';
      resultsElement.className = 'search-results searching';
    }
    
    // Use a small delay for large files to show the clearing indicator
    const delay = (searchState[searchId] && searchState[searchId].isLargeFile) ? 100 : 0;
    
    setTimeout(() => {
      performFileSearch(searchId, contentId, '');
      // Ensure focus stays on search input after clearing
      setTimeout(() => {
        searchInput.focus();
      }, 10);
    }, delay);
  }
}

function scrollToCurrentMatch(contentId) {
  const contentElement = document.getElementById(contentId);
  const currentMatch = contentElement.querySelector('.search-highlight.current-match');
  
  if (currentMatch) {
    currentMatch.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }
}

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to check if file is an image
function isImageFile(fileName) {
  const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.tiff', '.webp']);
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.has(ext);
}

// Function to get MIME type for image files
function getMimeType(fileName) {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Function to read and display file content
function readFileContent(file, viewId) {
  const fileSize = formatFileSize(file.size);
  
  // Check if it's an image file
  if (isImageFile(file.name)) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const imageData = e.target.result;
      
      // Create expandable content for the image
      const imageContent = {
        type: 'image',
        title: `Image: ${file.name}`,
        fileName: file.name,
        size: fileSize,
        imageData: imageData,
        width: null, // Will be set after image loads
        height: null
      };
      
      // Display image info with expandable content
      const imageInfo = `🖼️ ${file.name} (${fileSize}) - Image`;
      addTerminalEntry(imageInfo, viewId, false, imageContent);
    };
    
    reader.onerror = function() {
      addTerminalEntry(`❌ Error reading image file: ${file.name}`, viewId);
    };
    
    reader.readAsDataURL(file);
    return;
  }
  
  // Check if it's likely a text file
  if (!isTextFile(file.name)) {
    addTerminalEntry(`📄 ${file.name} (${fileSize}) - Binary file, content not displayed`, viewId);
    return;
  }
  
  // Function to try reading with different encodings
  function tryReadWithEncoding(file, encoding, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const content = e.target.result;
      
      // Check if content contains binary data or encoding issues
      if (content.includes('\0')) {
        callback(null, 'Binary content detected');
        return;
      }
      
      // Check for common Shift-JIS encoding issues (question marks, replacement characters)
      const hasEncodingIssues = content.includes('\uFFFD') || 
        (encoding === 'UTF-8' && /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF]/.test(content) === false && 
         file.name.match(/\.(txt|csv|tsv|log)$/i));
      
      if (hasEncodingIssues && encoding === 'UTF-8') {
        console.log(`🔄 UTF-8 encoding issues detected for ${file.name}, trying Shift-JIS`);
        callback(null, 'Encoding issues detected');
        return;
      }
      
      callback(content, null);
    };
    
    reader.onerror = function() {
      callback(null, `Error reading file with ${encoding} encoding`);
    };
    
    if (encoding === 'Shift-JIS') {
      reader.readAsText(file, 'shift_jis');
    } else {
      reader.readAsText(file, encoding);
    }
  }
  
  // Try UTF-8 first, then Shift-JIS if issues detected
  tryReadWithEncoding(file, 'UTF-8', (content, error) => {
    if (content && !error) {
      processFileContent(content, file, viewId, fileSize);
    } else {
      console.log(`📝 Trying Shift-JIS encoding for ${file.name}`);
      tryReadWithEncoding(file, 'Shift-JIS', (shiftJisContent, shiftJisError) => {
        if (shiftJisContent && !shiftJisError) {
          console.log(`✅ Successfully read ${file.name} with Shift-JIS encoding`);
          processFileContent(shiftJisContent, file, viewId, fileSize);
        } else {
          // Try one more time with default encoding
          const fallbackReader = new FileReader();
          fallbackReader.onload = function(e) {
            const fallbackContent = e.target.result;
            if (fallbackContent && !fallbackContent.includes('\0')) {
              console.log(`⚠️ Using fallback encoding for ${file.name}`);
              processFileContent(fallbackContent, file, viewId, fileSize);
            } else {
              addTerminalEntry(`❌ Could not read ${file.name} with any encoding`, viewId);
            }
          };
          fallbackReader.onerror = function() {
            addTerminalEntry(`❌ Error reading file: ${file.name}`, viewId);
          };
          fallbackReader.readAsText(file);
        }
      });
    }
  });
  
  // Helper function to process file content once successfully read
  function processFileContent(content, file, viewId, fileSize) {
    
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // Create expandable buffer content
    const bufferContent = {
      type: 'buffer',
      title: `File Content: ${file.name}`,
      fileName: file.name,
      lines: lineCount,
      size: fileSize,
      content: content
    };
    
    // Get language preset for enhanced file display
    const langPreset = getLanguagePreset(file.name);
    
    // Display file info in first row with expandable content and language decoration
    const fileInfo = langPreset ? 
      `${langPreset.icon} ${file.name} (${fileSize}, ${lineCount} lines) - ${langPreset.name}` :
      `📄 ${file.name} (${fileSize}, ${lineCount} lines)`;
    addTerminalEntry(fileInfo, viewId, false, bufferContent);
  }
}

// Function to set current folder
async function setCurrentFolder(dirPath) {
  if (!window.__TAURI__) {
    alert('Tauri not available');
    return;
  }
  
  try {
    const { invoke } = window.__TAURI__.core;
    
    // Call the Rust function to set the current directory
    const result = await invoke('handle_directory', { path: dirPath });
    
    console.log('Set current folder:', dirPath);
    console.log('Result:', result);
    
    // Update global variable
    window.currentFolder = dirPath;
    
    // Get the active view and update its folder display
    const viewId = getActiveViewId();
    updateViewFolderDisplay(viewId, dirPath);
    
    // Show success message
    addTerminalEntry(`✅ Current folder set to: ${dirPath}`, viewId);
    
  } catch (error) {
    console.error('Failed to set current folder:', error);
    const viewId = getActiveViewId();
    addTerminalEntry(`❌ Failed to set current folder: ${error}`, viewId);
  }
}

// Function to update the folder display in a view header
function updateViewFolderDisplay(viewId, folderPath) {
  const folderPathElement = document.getElementById(`folder-path-${viewId}`);
  const browseButton = document.getElementById(`browse-btn-${viewId}`);
  
  if (folderPathElement) {
    // Show just the folder name, full path in tooltip
    const folderName = folderPath.split('/').pop() || folderPath.split('\\').pop();
    folderPathElement.textContent = folderName;
    folderPathElement.title = `Current folder: ${folderPath}`;
    folderPathElement.style.color = '#4CAF50'; // Green color to indicate it's set
  }
  
  if (browseButton) {
    browseButton.disabled = false;
    browseButton.title = `Browse: ${folderPath}`;
  }
  
  // Store the folder path per view
  if (!window.viewFolders) {
    window.viewFolders = {};
  }
  window.viewFolders[viewId] = folderPath;
}

// Function to browse the current folder (placeholder for future implementation)
function browseCurrentFolder(viewId) {
  const folderPath = window.viewFolders ? window.viewFolders[viewId] : null;
  
  if (!folderPath) {
    addTerminalEntry('❌ No folder set for this view', viewId);
    return;
  }
  
  // Placeholder for future browse functionality
  console.log('Browse folder:', folderPath);
  addTerminalEntry(`📁 Browse functionality coming soon for: ${folderPath}`, viewId);
  
  // TODO: Implement folder browsing functionality
  // This could:
  // - Open system file manager
  // - Show folder contents in expandable view
  // - Navigate to folder in terminal
  // - etc.
}

// Function to handle directory paths
async function handleTauriDirectory(dirPath, viewId) {
  if (!window.__TAURI__) {
    addTerminalEntry(`❌ Cannot handle directory: Tauri not available`, viewId);
    return;
  }
  
  const dirName = dirPath.split('/').pop() || dirPath.split('\\').pop();
  
  // Create a simple button to set the current folder
  const setFolderButton = `<button class="set-folder-btn" onclick="setCurrentFolder('${escapeHtml(dirPath)}')" title="Set as current folder">📁 Set Current Folder</button>`;
  const dirInfo = `📁 ${dirName} - ${setFolderButton}`;
  
  // Add terminal entry without expandable content, allowing HTML for the button
  addTerminalEntry(dirInfo, viewId, false, null, true);
}

// Function to download image
function downloadImage(fileName, imageData) {
  const link = document.createElement('a');
  link.href = imageData;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to copy image to clipboard
async function copyImageToClipboard(imageId) {
  try {
    const imgElement = document.getElementById(imageId);
    if (!imgElement) {
      console.error('Image element not found');
      return;
    }
    
    // Create a canvas to convert image to blob
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    ctx.drawImage(imgElement, 0, 0);
    
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        console.log('Image copied to clipboard');
      } catch (err) {
        console.error('Failed to copy image to clipboard:', err);
      }
    });
  } catch (error) {
    console.error('Error copying image to clipboard:', error);
  }
}

// Function to read Tauri file content
async function readTauriFileContent(filePath, viewId) {
  if (!window.__TAURI__) {
    addTerminalEntry(`❌ Cannot read file: Tauri not available`, viewId);
    return;
  }
  
  // First, check if this is a directory
  try {
    const { invoke } = window.__TAURI__.core;
    const isDir = await invoke('is_directory', { path: filePath });
    
    if (isDir) {
      await handleTauriDirectory(filePath, viewId);
      return;
    }
  } catch (error) {
    console.warn('Could not check if path is directory:', error);
    // Continue processing as file
  }
  
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
  
  // Check if it's an image file
  if (isImageFile(fileName)) {
    try {
      console.log(`🖼️ Reading image file: ${fileName}`);
      
      // Check if readBinaryFile is available
      if (!window.__TAURI__.fs.readBinaryFile) {
        throw new Error('readBinaryFile not available in Tauri fs module');
      }
      
      // For images, we need to read them as binary and convert to base64
      const { readBinaryFile } = window.__TAURI__.fs;
      const binaryData = await readBinaryFile(filePath);
      
      console.log(`📄 Image binary data length: ${binaryData.length}`);
      console.log(`📄 Binary data type:`, typeof binaryData);
      console.log(`📄 Binary data constructor:`, binaryData.constructor.name);
      
      // Ensure we have a Uint8Array
      const uint8Array = binaryData instanceof Uint8Array ? binaryData : new Uint8Array(binaryData);
      
      // For large images, we might need to handle memory more carefully
      if (uint8Array.length > 10 * 1024 * 1024) { // 10MB limit
        throw new Error(`Image file too large (${formatFileSize(uint8Array.length)}). Maximum size is 10MB.`);
      }
      
      // Convert Uint8Array to base64 using reduce method (more efficient)
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
      const base64String = btoa(binaryString);
      
      const mimeType = getMimeType(fileName);
      const imageData = `data:${mimeType};base64,${base64String}`;
      
      console.log(`✅ Successfully converted image to base64, MIME type: ${mimeType}`);
      
      // Calculate file size
      const fileSize = formatFileSize(uint8Array.length);
      
      // Create expandable content for the image
      const imageContent = {
        type: 'image',
        title: `Image: ${fileName}`,
        fileName: fileName,
        size: fileSize,
        imageData: imageData
      };
      
      // Display image info with expandable content
      const imageInfo = `🖼️ ${fileName} (${fileSize}) - Image`;
      addTerminalEntry(imageInfo, viewId, false, imageContent);
      return;
    } catch (error) {
      console.error(`❌ Image read error for ${fileName}:`, error);
      addTerminalEntry(`❌ Error reading image file ${fileName}: ${error.message}`, viewId);
      return;
    }
  }
  
  // Check if it's likely a text file
  if (!isTextFile(fileName)) {
    addTerminalEntry(`📄 ${fileName} - Binary file, content not displayed`, viewId);
    return;
  }
  
  try {
    // Try our custom Shift-JIS aware function first
    const { invoke } = window.__TAURI__.core;
    
    try {
      const fileContent = await invoke('read_text_file_with_encoding', { path: filePath });
      
      const content = fileContent.content;
      const encoding = fileContent.encoding;
      const fileSize = fileContent.size;
      const formattedSize = formatFileSize(fileSize);
      
      console.log(`✅ Successfully read ${fileName} with ${encoding} encoding`);
      
      // Check if content contains binary data
      if (content.includes('\0')) {
        addTerminalEntry(`📄 ${fileName} (${formattedSize}) - Binary content detected, not displayed`, viewId);
        return;
      }
      
      const lines = content.split('\n');
      const lineCount = lines.length;
      
      // Create expandable buffer content
      const bufferContent = {
        type: 'buffer',
        title: `File Content: ${fileName} (${encoding})`,
        fileName: fileName,
        lines: lineCount,
        size: formattedSize,
        content: content
      };
      
      // Get language preset for enhanced file display
      const langPreset = getLanguagePreset(fileName);
      
      // Display file info with encoding information
      const encodingInfo = encoding !== 'UTF-8' ? ` [${encoding}]` : '';
      const fileInfo = langPreset ? 
        `${langPreset.icon} ${fileName} (${formattedSize}, ${lineCount} lines)${encodingInfo} - ${langPreset.name}` :
        `📄 ${fileName} (${formattedSize}, ${lineCount} lines)${encodingInfo}`;
      addTerminalEntry(fileInfo, viewId, false, bufferContent);
      
    } catch (encodingError) {
      console.warn(`⚠️ Custom encoding reader failed for ${fileName}, falling back to standard:`, encodingError);
      
      // Fallback to standard Tauri readTextFile
      const { readTextFile } = window.__TAURI__.fs;
      const content = await readTextFile(filePath);
      
      // Calculate file size in bytes (approximate)
      const fileSize = new Blob([content]).size;
      const formattedSize = formatFileSize(fileSize);
      
      // Check if content contains binary data
      if (content.includes('\0')) {
        addTerminalEntry(`📄 ${fileName} (${formattedSize}) - Binary content detected, not displayed`, viewId);
        return;
      }
      
      const lines = content.split('\n');
      const lineCount = lines.length;
      
      // Create expandable buffer content
      const bufferContent = {
        type: 'buffer',
        title: `File Content: ${fileName}`,
        fileName: fileName,
        lines: lineCount,
        size: formattedSize,
        content: content
      };
      
      // Get language preset for enhanced file display
      const langPreset = getLanguagePreset(fileName);
      
      // Display file info in first row with expandable content and language decoration
      const fileInfo = langPreset ? 
        `${langPreset.icon} ${fileName} (${formattedSize}, ${lineCount} lines) - ${langPreset.name}` :
        `📄 ${fileName} (${formattedSize}, ${lineCount} lines)`;
      addTerminalEntry(fileInfo, viewId, false, bufferContent);
    }
  } catch (error) {
    addTerminalEntry(`❌ Error reading file ${fileName}: ${error.message}`, viewId);
  }
}

// Function to automatically activate a view (for both hover and drag operations)
function autoActivateView(viewId, isDragOperation = false) {
  console.log(`🎯 Auto-activating view ${viewId} ${isDragOperation ? '(drag)' : '(hover)'}`);
  
  // Store the currently active view
  window.currentActiveView = viewId;
  if (isDragOperation) {
    window.activeDragTargetView = viewId;
  }
  
  const viewInfo = viewData[viewId];
  if (viewInfo && viewInfo.textInputEl) {
    // Removed automatic focus - let user manually focus when needed
    if (!isDragOperation) {
      console.log(`🎯 View ${viewId} activated (no auto-focus)`);
    } else {
      console.log(`🎯 View ${viewId} marked as active drag target`);
    }
    
    // Update visual state of all views
    document.querySelectorAll('.view-panel').forEach(panel => {
      const panelViewId = parseInt(panel.dataset.viewId);
      if (panelViewId === viewId) {
        panel.classList.add('active-target');
        if (isDragOperation) {
          panel.classList.add('drag-active');
        }
      } else {
        panel.classList.remove('active-target', 'drag-active');
      }
    });
  } else {
    console.warn(`⚠️ Could not activate view ${viewId} - view data not found`);
  }
}

// Function to clear active view state
function clearActiveDragTarget() {
  console.log('🧹 Clearing active drag target');
  window.activeDragTargetView = null;
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active-target', 'drag-active', 'drag-over');
  });
}

// Drag and drop handler functions
function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'copy';
  
  const viewPanel = event.currentTarget;
  const viewId = viewPanel.dataset.viewId;
  
  console.log(`👋 Drag over view ${viewId}`);
  
  // Add visual feedback
  if (!viewPanel.classList.contains('drag-over')) {
    viewPanel.classList.add('drag-over');
  }
}

function handleDragEnter(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const viewPanel = event.currentTarget;
  const viewId = parseInt(viewPanel.dataset.viewId);
  
  console.log(`📬 Drag enter view ${viewId}`);
  
  // Auto-activate the view being dragged over (drag operation)
  // This allows switching between views while dragging
  autoActivateView(viewId, true);
  
  // Don't focus input during drag - only on drop
  
  // Remove drag-over from all other views
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel !== viewPanel) {
      panel.classList.remove('drag-over', 'drag-active');
    }
  });
  
  // Add to current view
  viewPanel.classList.add('drag-over', 'drag-active');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const viewPanel = event.currentTarget;
  const viewId = viewPanel.dataset.viewId;
  
  console.log(`📫 Drag leave view ${viewId}`);
  
  // Only remove drag-over if we're leaving the view panel entirely
  const rect = viewPanel.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    viewPanel.classList.remove('drag-over', 'drag-active', 'active-target');
    console.log(`📫 Removed drag classes from view ${viewId}`);
    
    // If this was the active target, clear it
    if (window.activeDragTargetView === parseInt(viewId)) {
      window.activeDragTargetView = null;
    }
  }
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const viewPanel = event.currentTarget;
  const viewId = parseInt(viewPanel.dataset.viewId);
  const files = event.dataTransfer.files;
  
  console.log(`📦 Drop detected on view ${viewId}`);
  console.log(`📋 Files dropped: ${files.length}`);
  
  if (files.length > 0) {
    console.log(`🎯 Target view ID: ${viewId}`);
    
    Array.from(files).forEach((file, index) => {
      console.log(`📄 Processing file ${index + 1}/${files.length}: ${file.name} → view ${viewId}`);
      const message = `📁 Dropped file: ${file.name}`;
      addTerminalEntry(message, viewId);
      
      // Try to read file content (function will handle text vs binary detection)
      readFileContent(file, viewId);
    });
  }
  
  // Clear all drag-related styling and state
  clearActiveDragTarget();
  
  // Focus the input of the view that received the drop (commit the selection)
  const viewInfo = viewData[viewId];
  if (viewInfo && viewInfo.textInputEl) {
    setTimeout(() => {
      viewInfo.textInputEl.focus();
      console.log(`🎯 Drop committed - focused input for view ${viewId}`);
    }, 100);
  }
  
  console.log(`✅ Drop handling complete for view ${viewId}`);
}

// Function to setup global drag and drop monitoring
function setupGlobalDragDropMonitoring() {
  let dragCounter = 0;
  
  document.addEventListener('dragstart', (e) => {
    console.log('🚀 Global drag start detected');
    dragCounter++;
  });
  
  document.addEventListener('dragend', (e) => {
    console.log('🏁 Global drag end detected');
    // Clean up all drag-related state and styling
    clearActiveDragTarget();
  });
  
  document.addEventListener('dragover', (e) => {
    // Prevent default to allow drop
    e.preventDefault();
  });
  
  document.addEventListener('drop', (e) => {
    console.log('📦 Global drop detected');
    // Clean up all drag-related state and styling
    clearActiveDragTarget();
  });
  
  console.log('🌍 Global drag and drop event listeners added');
}

// Function to setup drag and drop event listeners for a view
function setupDragAndDropListeners(viewId) {
  const viewPanel = document.querySelector(`#view-${viewId}`);
  if (!viewPanel) {
    console.log(`Warning: Could not find view panel for view-${viewId}`);
    return;
  }
  
  console.log(`Setting up drag and drop for view-${viewId}`);
  
  // Remove any existing event listeners to prevent duplicates
  viewPanel.removeEventListener('dragover', handleDragOver);
  viewPanel.removeEventListener('dragenter', handleDragEnter);
  viewPanel.removeEventListener('dragleave', handleDragLeave);
  viewPanel.removeEventListener('drop', handleDrop);
  
  // Add drag and drop event listeners with improved handling
  viewPanel.addEventListener('dragover', handleDragOver, false);
  viewPanel.addEventListener('dragenter', handleDragEnter, false);
  viewPanel.addEventListener('dragleave', handleDragLeave, false);
  viewPanel.addEventListener('drop', handleDrop, false);
  
  // Add click activation listeners (changed from hover)
  viewPanel.addEventListener('click', (e) => {
    console.log(`🐭 Mouse click view ${viewId}`);
    autoActivateView(viewId, false);
  }, false);
  
  // Add mouse down listener to focus input
  viewPanel.addEventListener('mousedown', (e) => {
    console.log(`🐭 Mouse down view ${viewId}`);
    const viewInfo = viewData[viewId];
    if (viewInfo && viewInfo.textInputEl) {
      viewInfo.textInputEl.focus();
      console.log(`🎯 Mouse down - focused input for view ${viewId}`);
    }
  }, false);
  
  // Add hover listeners to switch views without focusing
  viewPanel.addEventListener('mouseenter', (e) => {
    console.log(`🐭 Mouse enter view ${viewId}`);
    // Switch to this view but don't focus input
    window.currentActiveView = viewId;
    
    // Update visual state of all views
    document.querySelectorAll('.view-panel').forEach(panel => {
      const panelViewId = parseInt(panel.dataset.viewId);
      if (panelViewId === viewId) {
        panel.classList.add('active-target');
      } else {
        panel.classList.remove('active-target');
      }
    });
    
    console.log(`🎯 Hover switched to view ${viewId} (no focus)`);
  }, false);
  
  viewPanel.addEventListener('mouseleave', (e) => {
    console.log(`🐭 Mouse leave view ${viewId}`);
    // Keep the view active for better UX - don't remove active state on mouse leave
  }, false);
  
  // Make the view panel accept drops
  viewPanel.style.position = 'relative';
  
  console.log(`✅ Drag and drop setup complete for view-${viewId}`);
  console.log(`📝 Event listeners added: dragover, dragenter, dragleave, drop`);
}

// Function to initialize a view with event listeners
function initializeView(viewId) {
  initializeViewData(viewId);
  
  const viewInfo = viewData[viewId];
  viewInfo.textInputEl = document.querySelector(`#text-input-${viewId}`);
  viewInfo.rowCountEl = document.querySelector(`#row-count-${viewId}`);
  
  // Setup popup event listeners
  setupPopupEventListeners(viewId);
  
  // Setup drag and drop event listeners
  setupDragAndDropListeners(viewId);
  
  // Add event listener for Enter key
  viewInfo.textInputEl.addEventListener('keydown', handleEnterKey);
  
  // Add event listener for focus to auto-scroll
  viewInfo.textInputEl.addEventListener('focus', () => {
    scrollToInput(viewId);
  });
  
  // Also ensure input stays visible when clicked
  viewInfo.textInputEl.addEventListener('click', () => {
    setTimeout(() => scrollToInput(viewId), 50);
  });
}

// Function to handle floating button click
async function handleFloatingButtonClick() {
  console.log('➡️ Floating button clicked!');
  try {
    await createNewView();
    console.log('✅ createNewView completed successfully');
  } catch (error) {
    console.error('❌ Error in createNewView:', error);
  }
}

// Initialize the app when DOM is loaded
window.addEventListener("DOMContentLoaded", async () => {
  console.log('🚀 App initializing...');
  
  // Load configuration first to get saved font size
  console.log('📋 Loading config...');
  await loadConfig();
  console.log('✅ Config loaded');
  
  // Load popup command data from JSON
  console.log('📊 Loading popup data...');
  await loadPopupData();
  console.log('✅ Popup data loaded');
  
  // Initialize first view
  console.log('🔧 Initializing first view...');
  initializeView(1);
  console.log('✅ First view initialized');
  
  // Set the first view as active (but don't auto-focus)
  console.log('🎯 Setting first view as active...');
  window.currentActiveView = 1;
  document.querySelector('#view-1').classList.add('active-target');
  console.log('✅ First view activated (no auto-focus)');
  
  // Apply font size to the initial view (using loaded config)
  console.log('🎨 Applying font size...');
  applyFontSizeToView(1);
  console.log('✅ Font size applied');
  
  // Setup Tauri file drop listener (non-blocking)
  console.log('📁 Setting up file drop listener...');
  setTimeout(() => {
    setupTauriFileDropListener();
    console.log('✅ File drop listener setup complete');
  }, 100);
  
  // Bind onDragDropEvent to window for additional access
  window.onDragDropEvent = onDragDropEvent;
  console.log('✅ onDragDropEvent bound to window');
  
  // Add event listener for floating button
  console.log('➕ Setting up floating button...');
  const floatingAddBtnEl = document.querySelector("#floating-add-btn");
  if (floatingAddBtnEl) {
    floatingAddBtnEl.addEventListener("click", handleFloatingButtonClick);
    console.log('✅ Floating button listener added');
  } else {
    console.error('❌ Floating button element not found!');
  }
  
  // Add global keyboard shortcuts for font size adjustment
  console.log('⌨️ Setting up keyboard shortcuts...');
  document.addEventListener('keydown', handleGlobalKeydown);
  console.log('✅ Keyboard shortcuts enabled');
  
  // Focus on first view's input when page loads
  console.log('🎯 Focusing on input...');
  if (viewData[1] && viewData[1].textInputEl) {
    viewData[1].textInputEl.focus();
    console.log('✅ Input focused');
  } else {
    console.error('❌ Failed to focus on input - viewData or textInputEl not found');
  }
  
  // Set initial layout
  console.log('🎛️ Setting initial layout...');
  updateViewLayout();
  console.log('✅ Layout set');
  
  // Setup scrollbar monitoring for auto-expansion (delayed)
  console.log('📏 Setting up scrollbar monitoring...');
  setTimeout(() => {
    setupScrollbarMonitoring();
    console.log('✅ Scrollbar monitoring active');
  }, 500);
  
  // Add global drag and drop monitoring for debugging
  console.log('🔍 Setting up global drag and drop monitoring...');
  setupGlobalDragDropMonitoring();
  console.log('✅ Global drag and drop monitoring active');
  
  // Set up periodic cleanup for search states (every 30 seconds)
  console.log('🧹 Setting up periodic search state cleanup...');
  setInterval(() => {
    cleanupOrphanedSearchStates();
  }, 30000);
  console.log('✅ Periodic search cleanup enabled');
  
  console.log('🎉 App initialization complete!');
  
  // Test responsiveness
  console.log('🧪 Testing basic responsiveness...');
  setTimeout(() => {
    console.log('⏰ Timer test: App is responsive after 1 second');
  }, 1000);
});

// Make functions global so they can be called from HTML
window.closeView = closeView;
window.toggleRowContent = toggleRowContent;
window.reloadPopupData = reloadPopupData;

// Function to get file modification time
async function getFileModTime(filePath) {
  if (!window.__TAURI__) {
    // For development mode, check if file exists using fetch
    try {
      const response = await fetch(filePath, { method: 'HEAD' });
      if (response.ok) {
        // File exists, return current time to force reload in dev mode
        return new Date().getTime();
      } else {
        // File doesn't exist
        return null;
      }
    } catch (error) {
      // File doesn't exist or can't be accessed
      return null;
    }
  }
  
  try {
    const { invoke } = window.__TAURI__.core;
    const metadata = await invoke('get_file_metadata', { path: filePath });
    return metadata.modified_time;
  } catch (error) {
    // File doesn't exist or can't be accessed
    console.warn(`Could not get modification time for ${filePath}:`, error.message);
    return null;
  }
}

// Function to check if any YAML files have changed
async function checkYamlFilesChanged() {
  const mainCommands = [
    'findall', 'install', 'get', 'run', 'zip', 'unzip', 'ci', 'create', 'register', 'update'
  ];
  
  let hasChanges = false;
  const changedFiles = [];
  const deletedFiles = [];
  const currentFiles = new Set();
  
  // Check each expected file
  for (const commandName of mainCommands) {
    let filePath;
    
    // Construct file path based on environment
    if (window.__TAURI__) {
      filePath = `data/command/${commandName}.yml`;
    } else {
      filePath = `./data/command/${commandName}.yml`;
    }
    
    const currentModTime = await getFileModTime(filePath);
    const lastKnownModTime = yamlFileTimestamps[filePath];
    
    if (currentModTime !== null) {
      // File exists
      currentFiles.add(filePath);
      
      if (!lastKnownModTime || currentModTime > lastKnownModTime) {
        hasChanges = true;
        changedFiles.push(commandName);
        yamlFileTimestamps[filePath] = currentModTime;
      }
    } else if (lastKnownModTime) {
      // File was known but now doesn't exist - it was deleted
      hasChanges = true;
      deletedFiles.push(commandName);
      delete yamlFileTimestamps[filePath]; // Remove from cache
    }
  }
  
  // Check for any files that were previously tracked but no longer exist
  const trackedFiles = Object.keys(yamlFileTimestamps);
  for (const trackedPath of trackedFiles) {
    if (!currentFiles.has(trackedPath)) {
      // This file was tracked before but is not in our current expected files
      const fileName = trackedPath.split('/').pop().replace('.yml', '');
      if (!deletedFiles.includes(fileName)) {
        hasChanges = true;
        deletedFiles.push(fileName);
        delete yamlFileTimestamps[trackedPath];
      }
    }
  }
  
  if (hasChanges) {
    const changeLog = [];
    if (changedFiles.length > 0) {
      changeLog.push(`modified: ${changedFiles.join(', ')}`);
    }
    if (deletedFiles.length > 0) {
      changeLog.push(`deleted: ${deletedFiles.join(', ')}`);
    }
    console.log(`📝 YAML file changes detected - ${changeLog.join(', ')}`);
  }
  
  return { hasChanges, changedFiles, deletedFiles };
}

// Function to update popup data (for hot-updating YAML files)
async function reloadPopupData() {
  console.log('🔄 Updating popup data...');
  try {
    await loadPopupData();
    console.log('✅ Popup data updated successfully');
    
    // Add confirmation to active view
    const viewId = getActiveViewId();
    addTerminalEntry('✅ YAML popup data updated successfully', viewId);
  } catch (error) {
    console.error('❌ Failed to update popup data:', error);
    const viewId = getActiveViewId();
    addTerminalEntry(`❌ Failed to update popup data: ${error.message}`, viewId);
  }
}

// Function to conditionally update popup data only if files changed
async function reloadPopupDataIfChanged() {
  console.log('🔍 Checking if YAML files have changed...');
  
  const { hasChanges, changedFiles, deletedFiles } = await checkYamlFilesChanged();
  
  if (hasChanges) {
    const changeTypes = [];
    if (changedFiles.length > 0) {
      changeTypes.push(`modified: ${changedFiles.join(', ')}`);
    }
    if (deletedFiles.length > 0) {
      changeTypes.push(`deleted: ${deletedFiles.join(', ')}`);
    }
    
    console.log(`🔄 Changes detected - ${changeTypes.join(', ')}, updating...`);
    await loadPopupData();
    console.log('✅ Popup data updated due to file changes');
    return true;
  } else {
    console.log('✅ No YAML file changes detected, skipping update');
    return false;
  }
}

// Helper function to add expandable entry with command output
function addExpandableCommandOutput(command, output, exitCode, viewId) {
  const outputContent = {
    type: 'output',
    title: `Command: ${command}`,
    exitCode: exitCode,
    content: output
  };
  
  const summary = `🗺️ ${command} ${exitCode === 0 ? '✅' : '❌'} (Exit: ${exitCode})`;
  return addTerminalEntry(summary, viewId, false, outputContent);
}

// Helper function to add expandable buffer content
function addExpandableBuffer(title, content, metadata, viewId) {
  const bufferContent = {
    type: 'buffer',
    title: title,
    lines: content.split('\n').length,
    size: new Blob([content]).size,
    content: content,
    ...metadata
  };
  
  const summary = `🗄 ${title} (${bufferContent.lines} lines)`;
  return addTerminalEntry(summary, viewId, false, bufferContent);
}
