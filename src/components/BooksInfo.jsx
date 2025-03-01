import React, { useRef, useEffect } from "react";
import { cmsData } from "./booksData";

const BookInfo = ({ hoveredBook, selectedBook, onClose }) => {
  const displayBook = selectedBook || hoveredBook;
  const listRef = useRef(null);
  const bookItemRefs = useRef({});

  useEffect(() => {
    if (displayBook && bookItemRefs.current[displayBook.id]) {
      const bookElement = bookItemRefs.current[displayBook.id];
      bookElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [displayBook]);

  return (
    <div
      className="fixed right-0 top-0 w-64 h-screen bg-white/90 shadow-lg overflow-hidden flex flex-col pointer-events-auto"
      style={{
        zIndex: 1000,

      }}
    >
      {selectedBook && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 bg-transparent border-none text-xl cursor-pointer text-black hover:text-gray-600"
        >
          ×
        </button>
      )}

      <h2 className="text-xl font-bold m-4 text-gray-800">Library Books</h2>
      {displayBook && (
        <div className="m-4 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800">Current Selection</h3>
          <p className="text-sm text-gray-600">
            Shelf: {displayBook.shelfIndex + 1}
            <br />
            Position: {displayBook.bookIndex + 1}
            <br />
            ID: {displayBook.id}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookInfo;
