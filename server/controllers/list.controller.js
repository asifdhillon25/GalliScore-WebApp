const list = require("../models/list.model.js")


const getlist = async (req,res) =>{
    try {
            const List = await list.find({});
            res.status(200).json(List);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getlistbyid = async (req, res) => {
    try {
      const { id } = req.params;
      const List = await list.findById(id); // Correct method call
      if (!List) {
        return res.status(404).json({ message: 'List not found' });
      }
      res.status(200).json(List);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

const setlist = async (req,res) =>
{
    try {
        const List = await list.create(req.body);
        res.status(200).json(List);
} catch (error) {
    res.status(500).json({ message: error.message });
}

}

const updatelist = async (req,res) =>
    {
        try {
            const { id } = req.params;
            const List = await list.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }); // Correct method call
            if (!List) {
              return res.status(404).json({ message: 'List not found' });
            }
            res.status(200).json(List);
          } catch (error) {
            res.status(500).json({ message: error.message });
          }
    }



    const deletelist = async (req,res) =>
        {
            try {
                const { id } = req.params;
                const List = await list.findByIdAndDelete(id); // Correct method call
                if (!List) {
                  return res.status(404).json({ message: 'List not found' });
                }
                res.status(200).json({message: "list deleted successfully"});
              } catch (error) {
                res.status(500).json({ message: error.message });
              }
        }
    

module.exports={getlist,setlist,getlistbyid,updatelist,deletelist};