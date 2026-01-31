import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, onConfirm, message ,placeholder}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(inputValue); // Pass the input value to the parent component
    setInputValue(''); // Clear the input value
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <p className="text-lg mb-4">{message}</p>
        <input 
          type="text" 
          placeholder={placeholder} 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="flex justify-end gap-4 mt-4">
          <button 
            onClick={handleConfirm}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Yes
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            No
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

