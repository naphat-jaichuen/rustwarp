// Global state
let viewCounter = 1;
let viewData = {}; // Store data for each view
let maxViews = 2;

// Initialize view data
function initializeViewData(viewId) {
  viewData[viewId] = {
    rowCounter: 0,
    textInputEl: null,
    tableBodyEl: null,
    rowCountEl: null
  };
}

// Function to add a new row to a specific view's table
function addTableRow(text, viewId) {
  if (!text.trim()) return; // Don't add empty rows
  
  const viewInfo = viewData[viewId];
  if (!viewInfo) return;
  
  viewInfo.rowCounter++;
  const currentTime = new Date().toLocaleString();
  
  // Create new row element
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${viewInfo.rowCounter}</td>
    <td class="text-cell">${escapeHtml(text)}</td>
    <td class="time-cell">${currentTime}</td>
    <td class="actions-cell">
      <button class="delete-btn" onclick="deleteRow(this, ${viewId})">Delete</button>
    </td>
  `;
  
  // Add row to table
  viewInfo.tableBodyEl.appendChild(row);
  
  // Update row count
  updateRowCount(viewId);
  
  // Clear input
  viewInfo.textInputEl.value = '';
  
  // Add fade-in animation
  row.style.opacity = '0';
  setTimeout(() => {
    row.style.transition = 'opacity 0.3s ease-in';
    row.style.opacity = '1';
  }, 10);
}

// Function to delete a row
function deleteRow(button, viewId) {
  const row = button.closest('tr');
  row.style.transition = 'opacity 0.3s ease-out';
  row.style.opacity = '0';
  
  setTimeout(() => {
    row.remove();
    updateRowCount(viewId);
  }, 300);
}

// Function to update row count for a specific view
function updateRowCount(viewId) {
  const viewInfo = viewData[viewId];
  if (!viewInfo) return;
  
  const currentRows = viewInfo.tableBodyEl.children.length;
  viewInfo.rowCountEl.textContent = currentRows;
}

// Function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to handle Enter key press
function handleEnterKey(event) {
  if (event.key === 'Enter') {
    const viewId = parseInt(event.target.dataset.viewId);
    const text = event.target.value.trim();
    if (text) {
      addTableRow(text, viewId);
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
  const viewContainer = document.querySelector('#view-container');
  const currentViews = viewContainer.children.length;
  
  // Limit to max 2 views
  if (currentViews >= maxViews) {
    alert(`Maximum of ${maxViews} views allowed. Please close a view first.`);
    return;
  }
  
  viewCounter++;
  const newViewId = viewCounter;
  
  // Create new view HTML
  const newViewHtml = `
    <div class="view-panel" id="view-${newViewId}" data-view-id="${newViewId}">
      <div class="view-header">
        <h2>Table View ${newViewId}</h2>
        <button class="close-view-btn" onclick="closeView(${newViewId})" title="Close view">×</button>
      </div>
      
      <div class="view-content">
        <p>Type text and press Enter to add rows to the table</p>
        
        <div class="input-section">
          <input 
            id="text-input-${newViewId}" 
            class="text-input"
            type="text" 
            placeholder="Enter text and press Enter..." 
            autocomplete="off"
            data-view-id="${newViewId}"
          />
        </div>

        <div class="table-section">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Text</th>
                <th>Added At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="table-body-${newViewId}" class="table-body">
              <!-- Rows will be added here dynamically -->
            </tbody>
          </table>
        </div>

        <div class="stats">
          <p>Total rows: <span id="row-count-${newViewId}" class="row-count">0</span></p>
        </div>
      </div>
    </div>
  `;
  
  // Add new view to container
  viewContainer.insertAdjacentHTML('beforeend', newViewHtml);
  
  // Initialize view data and event listeners
  initializeView(newViewId);
  
  // Focus on new view's input
  viewData[newViewId].textInputEl.focus();
  
  // Resize window for new view count
  const newViewCount = viewContainer.children.length;
  resizeWindowForViews(newViewCount);
}

// Function to close a view
function closeView(viewId) {
  const viewContainer = document.querySelector('#view-container');
  const currentViews = viewContainer.children.length;
  
  // Don't allow closing if it's the only view
  if (currentViews <= 1) {
    alert('Cannot close the last remaining view.');
    return;
  }
  
  const viewElement = document.querySelector(`#view-${viewId}`);
  if (viewElement) {
    // Remove from DOM
    viewElement.remove();
    
    // Clean up view data
    delete viewData[viewId];
    
    // Update layout classes if needed
    updateViewLayout();
    
    // Resize window for new view count
    const newViewCount = viewContainer.children.length;
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

// Function to initialize a view with event listeners
function initializeView(viewId) {
  initializeViewData(viewId);
  
  const viewInfo = viewData[viewId];
  viewInfo.textInputEl = document.querySelector(`#text-input-${viewId}`);
  viewInfo.tableBodyEl = document.querySelector(`#table-body-${viewId}`);
  viewInfo.rowCountEl = document.querySelector(`#row-count-${viewId}`);
  
  // Add event listener for Enter key
  viewInfo.textInputEl.addEventListener('keydown', handleEnterKey);
}

// Function to handle floating button click
function handleFloatingButtonClick() {
  createNewView();
}

// Initialize the app when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  // Initialize first view
  initializeView(1);
  
  // Add event listener for floating button
  const floatingAddBtnEl = document.querySelector("#floating-add-btn");
  floatingAddBtnEl.addEventListener("click", handleFloatingButtonClick);
  
  // Focus on first view's input when page loads
  viewData[1].textInputEl.focus();
  
  // Set initial layout
  updateViewLayout();
  
  // Setup scrollbar monitoring for auto-expansion
  setupScrollbarMonitoring();
});

// Make functions global so they can be called from HTML
window.deleteRow = deleteRow;
window.closeView = closeView;
