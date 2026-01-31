import React from "react";
import Button from "./Button.component";
function Task({ tasktext, OnDelete, OnComplete,isCompelete}) {
  return (
    <div className="  flex items-center justify-between gap-1 my-2 text-yellow-50">
      <div className="max-w-36 break-words hover:overflow-visible text-wrap" style={{textDecoration: isCompelete? "line-through" : "none"}}>{tasktext}</div>
      <div className='flex items-center justify-between gap-2 text-yellow-50'>
        <Button className="bg-cyan-500 p-1 text-white rounded hover:scale-105 active:scale-110 duration-75"
         onClick={OnComplete}
         >
          {isCompelete? "unmark":"mark"}
        </Button>
        <Button variant="danger" 
        onClick={OnDelete}
        >
         x
        </Button>
      </div>
    </div>
  );
}

export default Task;
