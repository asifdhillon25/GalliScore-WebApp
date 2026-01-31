const mongoose=require('mongoose')

const listSchema = mongoose.Schema(
    {
      list: {
        type: String, // The type of the 'list' field is String
        required: [true, "Please enter a task name"], // The field is required and has a custom error message
      },
      Completed: {
        type: Boolean, // The type of the 'Completed' field is Boolean
        default: false // The default value for the 'Completed' field is false
      }
    }
  );
  

const list = mongoose.model("list",listSchema);

module.exports=list;

