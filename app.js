const ROWS = 3;
const COLS = 4;

const ATTENDEES = [
  {
    id: "ava",
    name: "Ava",
    type: "person",
    emoji: "🎟️",
    tags: ["person"],
    avoidTags: ["dog"],
    problem: "Ava is allergic to dogs.",
  },
  {
    id: "ben",
    name: "Ben",
    type: "person",
    emoji: "🍿",
    tags: ["person"],
    avoidTags: ["cat"],
    problem: "Ben sneezes around cats.",
  },
  {
    id: "chloe",
    name: "Chloe",
    type: "person",
    emoji: "🎬",
    tags: ["person"],
    avoidTags: ["bird"],
    problem: "Chloe is scared of birds.",
  },
  {
    id: "diego",
    name: "Diego",
    type: "person",
    emoji: "🥤",
    tags: ["person"],
    avoidTags: ["fox"],
    problem: "Diego refuses to sit next to foxes.",
  },
  {
    id: "ella",
    name: "Ella",
    type: "person",
    emoji: "🎧",
    tags: ["person"],
    avoidTags: ["rabbit"],
    problem: "Ella is allergic to rabbits.",
  },
  {
    id: "finn",
    name: "Finn",
    type: "person",
    emoji: "📽️",
    tags: ["person"],
    avoidTags: ["cat"],
    problem: "Finn can't sit near cats.",
  },
  {
    id: "rex",
    name: "Rex",
    type: "animal",
    emoji: "🐶",
    tags: ["animal", "dog"],
    avoidTags: ["cat"],
    problem: "Rex growls at cats.",
  },
  {
    id: "mochi",
    name: "Mochi",
    type: "animal",
    emoji: "🐱",
    tags: ["animal", "cat"],
    avoidTags: ["dog"],
    problem: "Mochi won't sit next to dogs.",
  },
  {
    id: "rio",
    name: "Rio",
    type: "animal",
    emoji: "🦜",
    tags: ["animal", "bird", "parrot"],
    avoidTags: ["owl"],
    problem: "Rio gets nervous next to owls.",
  },
  {
    id: "thumper",
    name: "Thumper",
    type: "animal",
    emoji: "🐰",
    tags: ["animal", "rabbit"],
    avoidTags: ["fox"],
    problem: "Thumper avoids foxes.",
  },
  {
    id: "nova",
    name: "Nova",
    type: "animal",
    emoji: "🦊",
    tags: ["animal", "fox"],
    avoidTags: ["rabbit"],
    problem: "Nova can't sit beside rabbits.",
  },
  {
    id: "luma",
    name: "Luma",
    type: "animal",
    emoji: "🦉",
    tags: ["animal", "bird", "owl"],
    avoidTags: ["parrot"],
    problem: "Luma dislikes loud parrots.",
  },
];

const seatGrid = document.getElementById("seat-grid");
const problemList = document.getElementById("problem-list");
const statusMessage = document.getElementById("status-message");
const conflictCount = document.getElementById("conflict-count");
const newGameButton = document.getElementById("new-game");
const checkButton = document.getElementById("check-seats");

const state = {
  seating: [],
  selectedSeat: null,
};

newGameButton.addEventListener("click", () => {
  buildNewGame();
  statusMessage.textContent = "New seating generated. Swap any two seats to begin.";
});

checkButton.addEventListener("click", () => {
  const conflicts = countConflicts(state.seating).total;
  if (conflicts === 0) {
    statusMessage.textContent = "Perfect! Everyone is happy with their neighbors.";
    statusMessage.style.color = "var(--success)";
  } else {
    statusMessage.textContent = `There are still ${conflicts} conflicts to fix.`;
    statusMessage.style.color = "var(--danger)";
  }
});

function buildNewGame() {
  const solution = generateValidSeating();
  const scrambled = scrambleSeating(solution);

  state.seating = scrambled;
  state.selectedSeat = null;
  renderProblems();
  renderSeating();
  updateConflicts();
  statusMessage.style.color = "";
}

function renderProblems() {
  problemList.innerHTML = "";
  ATTENDEES.forEach((attendee) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${attendee.name}:</strong> ${attendee.problem}`;
    problemList.appendChild(item);
  });
}

function renderSeating() {
  seatGrid.innerHTML = "";
  const conflicts = countConflicts(state.seating);

  state.seating.forEach((attendee, index) => {
    const seat = document.createElement("button");
    seat.type = "button";
    seat.className = "seat";
    seat.dataset.index = index;

    if (state.selectedSeat === index) {
      seat.classList.add("selected");
    }

    if (conflicts.seatsWithConflicts.has(index)) {
      seat.classList.add("violation");
    }

    seat.innerHTML = `
      <span class="seat-label">${seatLabel(index)}</span>
      <span class="seat-emoji">${attendee.emoji}</span>
      <span class="seat-name">${attendee.name}</span>
      <span class="seat-detail">${attendee.type}</span>
    `;

    seat.addEventListener("click", () => handleSeatClick(index));
    seatGrid.appendChild(seat);
  });
}

function handleSeatClick(index) {
  if (state.selectedSeat === null) {
    state.selectedSeat = index;
    statusMessage.textContent = `Selected ${state.seating[index].name}. Choose a seat to swap.`;
    renderSeating();
    return;
  }

  if (state.selectedSeat === index) {
    state.selectedSeat = null;
    statusMessage.textContent = "Selection cleared. Pick another seat.";
    renderSeating();
    return;
  }

  swapSeats(state.selectedSeat, index);
  const swappedNames = `${state.seating[index].name} ↔ ${state.seating[state.selectedSeat].name}`;
  state.selectedSeat = null;
  statusMessage.textContent = `Swapped seats: ${swappedNames}.`;
  renderSeating();
  updateConflicts();
}

function swapSeats(indexA, indexB) {
  const updated = [...state.seating];
  [updated[indexA], updated[indexB]] = [updated[indexB], updated[indexA]];
  state.seating = updated;
}

function seatLabel(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  return `Row ${String.fromCharCode(65 + row)} Seat ${col + 1}`;
}

function generateValidSeating() {
  const seats = Array(ROWS * COLS).fill(null);
  const attendees = shuffle([...ATTENDEES]);

  const success = backtrackPlace(attendees, seats, 0);
  if (!success) {
    throw new Error("Unable to generate a valid seating.");
  }

  return seats;
}

function backtrackPlace(attendees, seats, index) {
  if (index >= seats.length) {
    return true;
  }

  const available = shuffle([...attendees]);
  for (const attendee of available) {
    if (!isSeatValid(attendee, index, seats)) {
      continue;
    }

    seats[index] = attendee;
    const remaining = attendees.filter((item) => item.id !== attendee.id);
    if (backtrackPlace(remaining, seats, index + 1)) {
      return true;
    }
    seats[index] = null;
  }

  return false;
}

function isSeatValid(attendee, index, seats) {
  const neighbors = getNeighborIndices(index).map((neighborIndex) => seats[neighborIndex]);

  for (const neighbor of neighbors) {
    if (!neighbor) continue;
    if (hasConflict(attendee, neighbor)) return false;
    if (hasConflict(neighbor, attendee)) return false;
  }

  return true;
}

function hasConflict(attendee, neighbor) {
  return attendee.avoidTags.some((tag) => neighbor.tags.includes(tag));
}

function getNeighborIndices(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const neighbors = [];

  if (row > 0) neighbors.push(index - COLS);
  if (row < ROWS - 1) neighbors.push(index + COLS);
  if (col > 0) neighbors.push(index - 1);
  if (col < COLS - 1) neighbors.push(index + 1);

  return neighbors;
}

function countConflicts(seating) {
  const seatsWithConflicts = new Set();
  let total = 0;

  seating.forEach((attendee, index) => {
    const neighbors = getNeighborIndices(index).map((neighborIndex) => seating[neighborIndex]);
    neighbors.forEach((neighbor) => {
      if (hasConflict(attendee, neighbor)) {
        total += 1;
        seatsWithConflicts.add(index);
      }
    });
  });

  return { total, seatsWithConflicts };
}

function scrambleSeating(solution) {
  let scrambled = shuffle([...solution]);
  let attempts = 0;

  while (countConflicts(scrambled).total === 0 && attempts < 25) {
    scrambled = shuffle([...solution]);
    attempts += 1;
  }

  if (countConflicts(scrambled).total === 0) {
    const fallback = [...solution];
    [fallback[0], fallback[1]] = [fallback[1], fallback[0]];
    return fallback;
  }

  return scrambled;
}

function updateConflicts() {
  const conflicts = countConflicts(state.seating).total;
  conflictCount.textContent = `Conflicts: ${conflicts}`;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

buildNewGame();
