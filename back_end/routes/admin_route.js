let express=require('express');
let router=express.Router();
router.post("/addplants",(req,res)=>{
    res.send("add plants route");
});
router.get("/viewusers",(req,res)=>{
    res.send("view user route");
});
router.delete("/deleteuser/:id",async(req,res)=>{
    let result=await users.findByIdAndDelete(req.params.id)
    if (result){
        res.send("user delete successfully");
    }else{
    res.send("no user found");
    }
});
router.get("/viewquestion",(req,res)=>{
    res.send("view question route");
});

module.exports=router;