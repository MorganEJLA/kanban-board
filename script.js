const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");

const STORAGE_VERSION = "v3";
const LS_KEYS = [
  "backlogItems",
  "progressItems",
  "completeItems",
  "onHoldItems",
  "sugartrackVersion",
];
const FORCE_RESEED = false;

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

function logLS(where) {
  try {
    console.log(
      `[SugarTrack:${where}] version=`,
      localStorage.getItem("sugartrackVersion"),
      "backlog:",
      JSON.parse(localStorage.getItem("backlogItems") || "[]").length,
      "progress:",
      JSON.parse(localStorage.getItem("progressItems") || "[]").length,
      "complete:",
      JSON.parse(localStorage.getItem("completeItems") || "[]").length,
      "onHold:",
      JSON.parse(localStorage.getItem("onHoldItems") || "[]").length
    );
  } catch {}
}

function seedDefaults() {
  backlogListArray = [...DEFAULT_BACKLOG];
  progressListArray = [...DEFAULT_PROGRESS];
  completeListArray = [...DEFAULT_COMPLETE];
  onHoldListArray = [...DEFAULT_ONHOLD];
  updateSavedColumns(); // writes arrays + version
  localStorage.setItem("sugartrackVersion", STORAGE_VERSION);
  logLS("seeded");
}

function getSavedColumns() {
  if (FORCE_RESEED) {
    LS_KEYS.forEach((k) => localStorage.removeItem(k));
  }
  const savedVersion = localStorage.getItem("sugartrackVersion");

  if (savedVersion !== STORAGE_VERSION) {
    console.log(
      "[SugarTrack] Version mismatch (have:",
      savedVersion,
      "need:",
      STORAGE_VERSION,
      ") → seeding defaults"
    );
    seedDefaults();
    return;
  }

  try {
    backlogListArray = JSON.parse(localStorage.getItem("backlogItems")) || [];
    progressListArray = JSON.parse(localStorage.getItem("progressItems")) || [];
    completeListArray = JSON.parse(localStorage.getItem("completeItems")) || [];
    onHoldListArray = JSON.parse(localStorage.getItem("onHoldItems")) || [];
    logLS("loaded");
  } catch (e) {
    console.warn("[SugarTrack] Bad localStorage, reseeding:", e);
    LS_KEYS.forEach((k) => localStorage.removeItem(k));
    seedDefaults();
  }
}

function updateSavedColumns() {
  listArrays = [
    backlogListArray,
    progressListArray,
    completeListArray,
    onHoldListArray,
  ];
  const names = ["backlog", "progress", "complete", "onHold"];
  names.forEach((name, i) => {
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

// Update Columns, Update localStorage
function updateDOM() {
  if (!updatedOnLoad) {
    getSavedColumns();
  }

  backlogListEl.textContent = "";
  backlogListArray.forEach((item, index) =>
    createItemEl(backlogListEl, 0, item, index)
  );
  backlogListArray = filterArray(backlogListArray);

  progressListEl.textContent = "";
  progressListArray.forEach((item, index) =>
    createItemEl(progressListEl, 1, item, index)
  );
  progressListArray = filterArray(progressListArray);

  completeListEl.textContent = "";
  completeListArray.forEach((item, index) =>
    createItemEl(completeListEl, 2, item, index)
  );
  completeListArray = filterArray(completeListArray);

  onHoldListEl.textContent = "";
  onHoldListArray.forEach((item, index) =>
    createItemEl(onHoldListEl, 3, item, index)
  );
  onHoldListArray = filterArray(onHoldListArray);

  updatedOnLoad = true;
  updateSavedColumns();
}

// Update Item
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

// Reset Textbox
function addToColumn(column) {
  const itemText = addItems[column].textContent.trim();
  if (itemText) {
    const selectedArray = listArrays[column];
    selectedArray.push(itemText);
    addItems[column].textContent = "";
    updateDOM();
  }
}

function showInputBox(column) {
  addBtns[column].style.visibility = "hidden";
  saveItemBtns[column].style.display = "flex";
  addItemContainers[column].style.display = "flex";
}

function hideInputBox(column) {
  addBtns[column].style.visibility = "visible";
  saveItemBtns[column].style.display = "none";
  addItemContainers[column].style.display = "none";
  addToColumn(column);
}

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

function dragEnter(column) {
  listColumns[column].classList.add("over");
  currentColumn = column;
}

// Drag
function drag(e) {
  draggedItem = e.target;
  dragging = true;
}

// Drop Item
function allowDrop(e) {
  e.preventDefault();
}

// Dropping Item
function drop(e) {
  e.preventDefault();
  const parent = listColumns[currentColumn];
  // Remove Background Color/Padding
  listColumns.forEach((column) => {
    column.classList.remove("over");
  });
  // Add item
  if (draggedItem && parent) {
    parent.appendChild(draggedItem);
    dragging = false;
    rebuildArrays();
  }
}

// Reset Demo button
document.getElementById("resetDemo").addEventListener("click", () => {
  // Clear
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
