import React from "react";
import Task from "./task.component";
import { useState ,useEffect} from "react";
import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;



function ToDo() {

    const [InpuText,SetInputText] =useState("");
    const [Tasks,SetTasks] = useState([]);


    useEffect(() => {
      axios.get(`${apiUrl}/List/`)
        .then(response => {
          SetTasks(response.data); // Initialize state with fetched tasks
        })
        .catch(error => {
          console.error('Error fetching tasks:', error);
        });
    }, []); // Empty dependency array means this useEffect runs once when the component mounts
  
   
    const HandleButtonClick = (event)=>
    {
        SetInputText(event.target.value);
    }

    const PostText = ()=>
    {
        if(InpuText.trim())
        {
            axios.post('http://localhost:3000/List/',{list:InpuText}).then(response =>{
                SetTasks([...Tasks,response.data]);
                SetInputText("");
            }).catch(error=>{
                console.error('Error adding task:', error);
            });
        
        }
        else
        {
            console.log("trim error\n");
        }
    }

    const Complete = (id) => {
      console.log("Updating task with ID:", id);
    
      axios.get(`http://localhost:3000/List/${id}`)
        .then(response => {
          // Toggle the completion status
          const newCompletionStatus = !response.data.Completed;
    
          // Update the task with the new completion status
          return axios.put(`http://localhost:3000/List/${id}`, { Completed: newCompletionStatus });
        })
        .then(response => {
          // Update the local state with the updated task
          const updatedTasks = Tasks.map(thistask =>
            thistask._id === id ? response.data : thistask
          );
          SetTasks(updatedTasks);
        })
        .catch(error => {
          console.error('Error completing task:', error);
        });
    };
    
      
    const DeleteText=(id) =>
        {
          axios.delete(`http://localhost:3000/List/${id}`)
          .then(() =>{
               const updatedtasks = Tasks.filter(thistask => thistask._id !== id)
               SetTasks(updatedtasks);
            }
          ).catch(error => {
              console.error('Error deleting task:', error);
            }
          )
         
         
        }

  return (
    <div className="flex  justify-around items-center my-20 ">
      <div
        className="flex flex-col justify-around items-start max-w-72  rounded p-6
         bg-gradient-to-r from-cyan-500 to-blue-500 "
      >
        <div>
          <input
            className="p-1 rounded-l focus:outline-none "
            type="text"
            placeholder="enter your text"
            value={InpuText}
            onChange={HandleButtonClick}
          />
          <button className="bg-cyan-500 p-1 text-white 
          rounded-r hover:scale-105 active:scale-110 duration-75"
          onClick={PostText}
          >
          
            Add
          </button>
        </div>
        <div className="flex justify-start mt-5 flex-col">
          {Tasks.map(mytask=>
        (
            <Task 
            tasktext={mytask.list}
            key={mytask._id}
            isCompelete={mytask.Completed}
            OnDelete={()=> DeleteText(mytask._id)}
            OnComplete={()=>Complete(mytask._id)}
            />
            
        ))}
        </div>
      </div>
    </div>
  );
}

export default ToDo;
