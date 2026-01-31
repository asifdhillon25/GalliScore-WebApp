// Checkbox.js
import React from 'react';

const Checkbox = ({ id, label, checked, onChange }) => {
  return (
    <label
      htmlFor={id}
      className="flex items-center text-white font-bold text-lg"
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="mr-2 scale-150 accent-blue-400" // Increase size by 1.5x
      />
      {label}
    </label>
  );
};

export default Checkbox;
