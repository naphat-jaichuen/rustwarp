let textInputEl;
let tableBodyEl;
let rowCountEl;
let rowCounter = 0;

// Function to add a new row to the table
function addTableRow(text) {
  if (!text.trim()) return; // Don't add empty rows
  
  rowCounter++;
  const currentTime = new Date().toLocaleString();
  
  // Create new row element
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${rowCounter}</td>
    <td class="text-cell">${escapeHtml(text)}</td>
    <td class="time-cell">${currentTime}</td>
    <td class="actions-cell">
      <button class="delete-btn" onclick="deleteRow(this)">Delete</button>
    </td>
  `;
  
  // Add row to table
  tableBodyEl.appendChild(row);
  
  // Update row count
  updateRowCount();
  
  // Clear input
  textInputEl.value = '';
  
  // Add fade-in animation
  row.style.opacity = '0';
  setTimeout(() => {
    row.style.transition = 'opacity 0.3s ease-in';
    row.style.opacity = '1';
  }, 10);
}

// Function to delete a row
function deleteRow(button) {
  const row = button.closest('tr');
  row.style.transition = 'opacity 0.3s ease-out';
  row.style.opacity = '0';
  
  setTimeout(() => {
    row.remove();
    updateRowCount();
  }, 300);
}

// Function to update row count
function updateRowCount() {
  const currentRows = tableBodyEl.children.length;
  rowCountEl.textContent = currentRows;
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
    const text = textInputEl.value.trim();
    if (text) {
      addTableRow(text);
    }
  }
}

// Initialize the app when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  textInputEl = document.querySelector("#text-input");
  tableBodyEl = document.querySelector("#table-body");
  rowCountEl = document.querySelector("#row-count");
  
  // Add event listener for Enter key
  textInputEl.addEventListener("keydown", handleEnterKey);
  
  // Focus on input when page loads
  textInputEl.focus();
});

// Make deleteRow function global so it can be called from HTML
window.deleteRow = deleteRow;
