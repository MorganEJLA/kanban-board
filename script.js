const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");
// Item Lists
// Item Lists
const listColumns = document.querySelectorAll(".drag-item-list");
const backlogListEl = document.getElementById("backlog-list");
const progressListEl = document.getElementById("progress-list");
const completeListEl = document.getElementById("complete-list");
const onHoldListEl = document.getElementById("on-hold-list");

// Items
let updatedOnLoad = false;

// Initialize Arrays
let backlogListArray = [];
let progressListArray = [];
let completeListArray = [];
let onHoldListArray = [];
let listArrays = [];

// --- VERSIONING ---
const STORAGE_VERSION = "v2"; // bump this whenever you change defaults

// Default values for new version
const DEFAULT_BACKLOG = [
  "Design layout for Passport page (grid of saved desserts)",
  "Define data structure for saved passport items (image, name, origin)",
];
const DEFAULT_PROGRESS = [
  "Build dessert search bar component",
  "Implement category filtering (cakes, pies, street food)",
  "Style navigation menu with responsive layout",
  "Test dessert detail card display",
];
const DEFAULT_COMPLETE = [
  "Set up React project with Vite",
  "Configure Firebase authentication",
  "Deploy landing page to Netlify",
];
const DEFAULT_ONHOLD = ["Add unique 'stamp' icons for each dessert."];

// --- STORAGE HELPERS ---

function seedDefaults() {
  backlogListArray = [...DEFAULT_BACKLOG];
  progressListArray = [...DEFAULT_PROGRESS];
  completeListArray = [...DEFAULT_COMPLETE];
  onHoldListArray = [...DEFAULT_ONHOLD];
  updateSavedColumns();
  localStorage.setItem("sugartrackVersion", STORAGE_VERSION);
}

// Get Arrays from localStorage if available, or seed defaults
function getSavedColumns() {
  const savedVersion = localStorage.getItem("sugartrackVersion");

  // If first load or version mismatch, reseed defaults
  if (savedVersion !== STORAGE_VERSION) {
    seedDefaults();
    return;
  }

  try {
    backlogListArray = JSON.parse(localStorage.getItem("backlogItems")) || [];
    progressListArray = JSON.parse(localStorage.getItem("progressItems")) || [];
    completeListArray = JSON.parse(localStorage.getItem("completeItems")) || [];
    onHoldListArray = JSON.parse(localStorage.getItem("onHoldItems")) || [];
  } catch (err) {
    console.error("Corrupt localStorage, reseeding defaults:", err);
    seedDefaults();
  }
}

// Save Arrays to localStorage
function updateSavedColumns() {
  listArrays = [
    backlogListArray,
    progressListArray,
    completeListArray,
    onHoldListArray,
  ];
  const arrayNames = ["backlog", "progress", "complete", "onHold"];
  arrayNames.forEach((name, i) => {
    localStorage.setItem(`${name}Items`, JSON.stringify(listArrays[i]));
  });
  localStorage.setItem("sugartrackVersion", STORAGE_VERSION);
}

// Filter Array to remove empty values
function filterArray(array) {
  return array.filter((item) => item !== null && item.trim() !== "");
}

// Create DOM Elements for each list item
function createItemEl(columnEl, column, item, index) {
  const listEl = document.createElement("li");
  listEl.textContent = item;
  listEl.id = index;
  listEl.classList.add("drag-item");
  listEl.draggable = true;
  listEl.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
  listEl.setAttribute("ondragstart", "drag(event)");
  listEl.contentEditable = true;
  columnEl.appendChild(listEl);
}

// Update Columns in DOM - Reset HTML, Filter Array, Update localStorage
function updateDOM() {
  if (!updatedOnLoad) {
    getSavedColumns();
  }

  // Backlog Column
  backlogListEl.textContent = "";
  backlogListArray.forEach((item, index) =>
    createItemEl(backlogListEl, 0, item, index)
  );
  backlogListArray = filterArray(backlogListArray);

  // Progress Column
  progressListEl.textContent = "";
  progressListArray.forEach((item, index) =>
    createItemEl(progressListEl, 1, item, index)
  );
  progressListArray = filterArray(progressListArray);

  // Complete Column
  completeListEl.textContent = "";
  completeListArray.forEach((item, index) =>
    createItemEl(completeListEl, 2, item, index)
  );
  completeListArray = filterArray(completeListArray);

  // On Hold Column
  onHoldListEl.textContent = "";
  onHoldListArray.forEach((item, index) =>
    createItemEl(onHoldListEl, 3, item, index)
  );
  onHoldListArray = filterArray(onHoldListArray);

  updatedOnLoad = true;
  updateSavedColumns();
}

// Update Item - Delete if necessary, or update Array value
function updateItem(id, column) {
  const selectedArray = listArrays[column];
  const selectedColumn = listColumns[column].children;
  if (!dragging) {
    if (!selectedColumn[id].textContent) {
      selectedArray.splice(id, 1);
    } else {
      selectedArray[id] = selectedColumn[id].textContent.trim();
    }
    updateDOM();
  }
}

// Add to Column List, Reset Textbox
function addToColumn(column) {
  const itemText = addItems[column].textContent.trim();
  if (itemText) {
    const selectedArray = listArrays[column];
    selectedArray.push(itemText);
    addItems[column].textContent = "";
    updateDOM();
  }
}

// Drag + Drop logic stays the same...

// Show Add Item Input Box
function showInputBox(column) {
  addBtns[column].style.visibility = "hidden";
  saveItemBtns[column].style.display = "flex";
  addItemContainers[column].style.display = "flex";
}

// Hide Item Input Box
function hideInputBox(column) {
  addBtns[column].style.visibility = "visible";
  saveItemBtns[column].style.display = "none";
  addItemContainers[column].style.display = "none";
  addToColumn(column);
}

// Allows arrays to reflect Drag and Drop items
function rebuildArrays() {
  backlogListArray = Array.from(backlogListEl.children).map((i) =>
    i.textContent.trim()
  );
  progressListArray = Array.from(progressListEl.children).map((i) =>
    i.textContent.trim()
  );
  completeListArray = Array.from(completeListEl.children).map((i) =>
    i.textContent.trim()
  );
  onHoldListArray = Array.from(onHoldListEl.children).map((i) =>
    i.textContent.trim()
  );

  updateDOM();
}

// When Item Enters Column Area
function dragEnter(column) {
  listColumns[column].classList.add("over");
  currentColumn = column;
}

// When Item Starts Dragging
function drag(e) {
  draggedItem = e.target;
  dragging = true;
}

// Column Allows for Item to Drop
function allowDrop(e) {
  e.preventDefault();
}

// Dropping Item in Column
function drop(e) {
  e.preventDefault();
  const parent = listColumns[currentColumn];
  // Remove Background Color/Padding
  listColumns.forEach((column) => {
    column.classList.remove("over");
  });
  // Add item to Column
  if (draggedItem && parent) {
    parent.appendChild(draggedItem);
    dragging = false;
    rebuildArrays();
  }
}

// Reset Demo button
document.getElementById("resetDemo").addEventListener("click", () => {
  // Clear SugarTrack keys
  [
    "backlogItems",
    "progressItems",
    "completeItems",
    "onHoldItems",
    "sugartrackVersion",
  ].forEach((k) => localStorage.removeItem(k));

  // Reseed with defaults and redraw
  seedDefaults();
  updateDOM();
});
