const SHELF_CONFIG = {
  shelfHeight: 1.678, // Adjusted lower to start books at a reasonable height
  shelfSpacing: 0.61,
  bookSpacing: 0.06,
  maxBooksPerShelf: 22,
  startX: -.59, // Moved starting position left to center books on shelf
  bookDepth: -4.75, // Adjusted to place books against back wall
  baseRotation: [0, 0, 3.15], // Updated rotation to face forward
  
  shelfCount: 4,
  shelfWidth: 2,
  shelfStartY: 0.4,

  
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateBookId(title, author) {
  const titleSlug = generateSlug(title);
  const authorSlug = generateSlug(author);
  return `${titleSlug}-by-${authorSlug}`;
}

function calculateBookPosition(bookIndex) {
  const shelfIndex = Math.floor(bookIndex / SHELF_CONFIG.maxBooksPerShelf);
  const bookIndexOnShelf = bookIndex % SHELF_CONFIG.maxBooksPerShelf;

  // Calculate positions
  const x = SHELF_CONFIG.startX + bookIndexOnShelf * SHELF_CONFIG.bookSpacing;
  const y = SHELF_CONFIG.shelfHeight + shelfIndex * SHELF_CONFIG.shelfSpacing;
  const z = SHELF_CONFIG.bookDepth;

  return {
    position: [x, y, z],
    rotation: SHELF_CONFIG.baseRotation,
    shelfIndex,
  };
}

export { generateSlug, generateBookId, calculateBookPosition, SHELF_CONFIG };
