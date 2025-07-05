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
let popupData = [
  { command: 'ls', description: 'List directory contents', example: 'ls -la' },
  { command: 'cd', description: 'Change directory', example: 'cd /home/user' },
  { command: 'pwd', description: 'Print working directory', example: 'pwd' },
  { command: 'mkdir', description: 'Create directory', example: 'mkdir newfolder' },
  { command: 'rm', description: 'Remove files/directories', example: 'rm file.txt' },
  { command: 'cp', description: 'Copy files', example: 'cp file1.txt file2.txt' },
  { command: 'mv', description: 'Move/rename files', example: 'mv old.txt new.txt' },
  { command: 'cat', description: 'Display file contents', example: 'cat file.txt' },
  { command: 'grep', description: 'Search text patterns', example: 'grep "pattern" file.txt' },
  { command: 'chmod', description: 'Change file permissions', example: 'chmod 755 script.sh' }
];

// Initialize view data
function initializeViewData(viewId) {
  viewData[viewId] = {
    rowCounter: 0,
    textInputEl: null,
    rowCountEl: null
  };
}

// Function to add a new entry to the terminal-like output
function addTerminalEntry(text, viewId, isFileContent = false) {
  if (!text.trim() && !isFileContent) return; // Don't process empty text unless it's file content

  const viewInfo = viewData[viewId];
  if (!viewInfo) return;

  viewInfo.rowCounter++;
  const currentTime = new Date().toLocaleString();

  // Create new terminal row with column structure
  const terminalRow = document.createElement('div');
  terminalRow.className = isFileContent ? 'terminal-row file-content-row' : 'terminal-row';
  terminalRow.innerHTML = `
    <div class="row-time-column" style="font-size: ${Math.max(8, currentFontSize - 2)}px;">${currentTime}</div>
    <div class="row-content-column ${isFileContent ? 'file-content' : ''}" style="font-size: ${currentFontSize}px;">${escapeHtml(text)}</div>
  `;

  // Add terminal entry
  const terminalOutput = document.getElementById(`terminal-output-${viewId}`);
  terminalOutput.appendChild(terminalRow);

  // Update row count
  updateRowCount(viewId);

  // Clear input
  viewInfo.textInputEl.value = '';

  // Auto-scroll to keep input visible
  scrollToInput(viewId);

  // Add fade-in effect
  terminalRow.style.opacity = '0';
  setTimeout(() => {
    terminalRow.style.transition = 'opacity 0.1s ease-in';
    terminalRow.style.opacity = '1';
  }, 5);
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
      
      // Keep focus on the input
      viewInfo.textInputEl.focus();
    });
  }
}

// Function to handle Enter key press
function handleEnterKey(event) {
  console.log('🔑 Key pressed:', event.key, 'in view:', event.target.dataset.viewId);
  if (event.key === 'Enter') {
    const viewId = parseInt(event.target.dataset.viewId);
    const text = event.target.value.trim();
    console.log('✅ Enter pressed, text:', text, 'viewId:', viewId);
    if (text) {
      addTerminalEntry(text, viewId);
    }
  }
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
  
  if (ctrlOrCmd) {
    if (event.key === '=' || event.key === '+') {
      // Increase font size
      event.preventDefault();
      adjustFontSize(1);
    } else if (event.key === '-' || event.key === '_') {
      // Decrease font size
      event.preventDefault();
      adjustFontSize(-1);
    } else if (event.key === '0') {
      // Reset to default font size
      event.preventDefault();
      currentFontSize = 13;
      updateTerminalFontSize();
      saveConfig();
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
function createNewView() {
  console.log('🔨 Starting createNewView...');
  
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
        <h2>Terminal View ${newViewId}</h2>
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

// Function to show popup with filtered suggestions
function showPopup(viewId, filterText = '') {
  const popup = document.getElementById(`popup-overlay-${viewId}`);
  const tableBody = document.getElementById(`popup-table-body-${viewId}`);
  
  if (!popup || !tableBody) return;
  
  // Filter data based on input text
  const filteredData = popupData.filter(item => 
    item.command.toLowerCase().includes(filterText.toLowerCase()) ||
    item.description.toLowerCase().includes(filterText.toLowerCase())
  );
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add filtered rows
  filteredData.forEach((item, index) => {
    const row = document.createElement('tr');
    row.setAttribute('data-index', index);
    row.innerHTML = `
      <td>${item.command}</td>
      <td>${item.description}</td>
      <td>${item.example}</td>
    `;
    
    // Add click handler
    row.addEventListener('click', () => {
      selectPopupItem(viewId, item.command);
    });
    
    tableBody.appendChild(row);
  });
  
  // Show popup if there are results
  if (filteredData.length > 0) {
    popup.style.display = 'block';
    selectedPopupIndex = -1;
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
  
  const rows = tableBody.querySelectorAll('tr');
  if (rows.length === 0) return;
  
  // Remove current selection
  rows.forEach(row => row.classList.remove('selected'));
  
  // Update selected index
  if (direction === 'down') {
    selectedPopupIndex = (selectedPopupIndex + 1) % rows.length;
  } else if (direction === 'up') {
    selectedPopupIndex = selectedPopupIndex <= 0 ? rows.length - 1 : selectedPopupIndex - 1;
  }
  
  // Apply selection
  if (selectedPopupIndex >= 0 && selectedPopupIndex < rows.length) {
    rows[selectedPopupIndex].classList.add('selected');
  }
}

// Function to select current popup item with Enter
function selectCurrentPopupItem(viewId) {
  const popup = document.getElementById(`popup-overlay-${viewId}`);
  const tableBody = document.getElementById(`popup-table-body-${viewId}`);
  
  if (!popup || popup.style.display === 'none') return false;
  
  const rows = tableBody.querySelectorAll('tr');
  if (selectedPopupIndex >= 0 && selectedPopupIndex < rows.length) {
    const selectedRow = rows[selectedPopupIndex];
    const command = selectedRow.cells[0].textContent;
    selectPopupItem(viewId, command);
    return true;
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
    if (value.length > 0) {
      showPopup(viewId, value);
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
        if (selectCurrentPopupItem(viewId)) {
          // Item was selected, don't process as normal tab
        }
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

// Function to check if file is likely text
function isTextFile(fileName) {
  const textExtensions = ['.txt', '.md', '.js', '.ts', '.json', '.html', '.css', '.xml', '.yml', '.yaml', '.csv', '.log', '.sh', '.py', '.rb', '.php', '.java', '.cpp', '.c', '.h', '.rs', '.go', '.sql', '.conf', '.ini', '.toml'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return textExtensions.includes(ext);
}

// Function to read and display file content
function readFileContent(file, viewId) {
  const fileSize = formatFileSize(file.size);
  
  // Check if it's likely a text file
  if (!isTextFile(file.name)) {
    addTerminalEntry(`📄 ${file.name} (${fileSize}) - Binary file, content not displayed`, viewId);
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const content = e.target.result;
    
    // Check if content contains binary data
    if (content.includes('\0')) {
      addTerminalEntry(`📄 ${file.name} (${fileSize}) - Binary content detected, not displayed`, viewId);
      return;
    }
    
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // Display file info in first row
    const fileInfo = `📄 ${file.name} (${fileSize}, ${lineCount} lines)`;
    addTerminalEntry(fileInfo, viewId);
    
    // Add separator
    addTerminalEntry('--- START ---', viewId);
    
    // Display content with preserved newlines (limit to prevent overwhelming)
    const maxLines = 50;  // Show more lines since we're preserving formatting
    const displayLines = lines.slice(0, maxLines);
    
    displayLines.forEach(line => {
      addTerminalEntry(line || ' ', viewId, true); // Mark as file content and show empty lines as single space
    });
    
    if (lines.length > maxLines) {
      addTerminalEntry(`... (${lines.length - maxLines} more lines)`, viewId);
    }
    
    addTerminalEntry('--- END ---', viewId);
  };
  
  reader.onerror = function() {
    addTerminalEntry(`❌ Error reading file: ${file.name}`, viewId);
  };
  
  reader.readAsText(file);
}

// Function to read Tauri file content
async function readTauriFileContent(filePath, viewId) {
  if (!window.__TAURI__) {
    addTerminalEntry(`❌ Cannot read file: Tauri not available`, viewId);
    return;
  }
  
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
  
  // Check if it's likely a text file
  if (!isTextFile(fileName)) {
    addTerminalEntry(`📄 ${fileName} - Binary file, content not displayed`, viewId);
    return;
  }
  
  try {
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
    
    // Display file info in first row
    const fileInfo = `📄 ${fileName} (${formattedSize}, ${lineCount} lines)`;
    addTerminalEntry(fileInfo, viewId);
    
    // Add separator
    addTerminalEntry('--- START ---', viewId);
    
    // Display content with preserved newlines (limit to prevent overwhelming)
    const maxLines = 50;  // Show more lines since we're preserving formatting
    const displayLines = lines.slice(0, maxLines);
    
    displayLines.forEach(line => {
      addTerminalEntry(line || ' ', viewId, true); // Mark as file content and show empty lines as single space
    });
    
    if (lines.length > maxLines) {
      addTerminalEntry(`... (${lines.length - maxLines} more lines)`, viewId);
    }
    
    addTerminalEntry('--- END ---', viewId);
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
    // Focus the input immediately for hover, but not during drag operations
    if (!isDragOperation) {
      viewInfo.textInputEl.focus();
      console.log(`🎯 Immediately focused input for view ${viewId}`);
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
  autoActivateView(viewId, true);
  
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
  
  // Auto-focus the input of the view that received the drop
  const viewInfo = viewData[viewId];
  if (viewInfo && viewInfo.textInputEl) {
    setTimeout(() => {
      viewInfo.textInputEl.focus();
      console.log(`🎯 Auto-focused input for view ${viewId} after drop`);
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
  
  // Add immediate hover activation listeners
  viewPanel.addEventListener('mouseenter', (e) => {
    console.log(`🐭 Mouse enter view ${viewId}`);
    autoActivateView(viewId, false);
  }, false);
  
  viewPanel.addEventListener('mouseleave', (e) => {
    console.log(`🐭 Mouse leave view ${viewId}`);
    // Optional: could remove active state when mouse leaves
    // For now, keep the view active for better UX
  }, false);
  
  // Make the view panel accept drops
  viewPanel.style.position = 'relative';
  
  // Add test click handler for debugging
  viewPanel.addEventListener('click', (e) => {
    console.log(`View panel ${viewId} clicked - event listeners are working!`);
    // Ensure the view is activated on click as well
    autoActivateView(viewId, false);
  });
  
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
function handleFloatingButtonClick() {
  console.log('➕ Floating button clicked!');
  try {
    createNewView();
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
  
  // Initialize first view
  console.log('🔧 Initializing first view...');
  initializeView(1);
  console.log('✅ First view initialized');
  
  // Auto-activate the first view on startup
  console.log('🎯 Setting first view as active...');
  autoActivateView(1, false);
  console.log('✅ First view activated');
  
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
  
  console.log('🎉 App initialization complete!');
  
  // Test responsiveness
  console.log('🧪 Testing basic responsiveness...');
  setTimeout(() => {
    console.log('⏰ Timer test: App is responsive after 1 second');
  }, 1000);
});

// Make functions global so they can be called from HTML
window.closeView = closeView;
