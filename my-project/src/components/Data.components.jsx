import React from 'react'
function TeamInput({children,placeholder,value,onChange}) {
  return (
    <div>
      <div className='flex justify-center items-center gap-5'>
                <h1>{children}</h1>
                <input className='rounded-lg p-2 text-black' onChange={onChange} value={value} type="text" placeholder={placeholder} />
            </div>
    </div>
  )
}

function Playercard({children ,onClick})
{
    return(
        <div className="flex   justify-start items-center">
            <div>{children}</div>
            <button className="ml-5 w-6 hover:bg-red-600 h-6 p-2 flex items-center justify-center rounded-full bg-red-700"
            onClick={onClick}
            >
              X
            </button>
          </div>
    )
}

export {TeamInput,Playercard}
