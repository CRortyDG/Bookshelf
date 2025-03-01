import React from "react";
import { AVAILABLE_BOOKSHELVES } from "../../App";


// Edit UI Component
const EditUI = ({ selectedBookshelf, onSelectBookshelf, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Bookshelf</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {AVAILABLE_BOOKSHELVES.map((bookshelf) => (
            <div
              key={bookshelf.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedBookshelf.id === bookshelf.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => onSelectBookshelf(bookshelf)}
            >
              <h3 className="font-medium">{bookshelf.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditUI;
