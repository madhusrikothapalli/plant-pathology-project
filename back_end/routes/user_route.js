let express=require('express');
let router=express.Router();
router.post("/adduser",(req,res)=>{
    res.send("Add user route");
});
router.post("/login",async(req,res)=>{
    let result=await users.findOne({email:req.body.email})
   
    if(result){
        let matchpass=await bcrypt.compare(req.body.password,result.password);
        if(matchpass){
            res.send("login successfully");
        }else{
            res.send("login failed");
        }
    }else{
        res.send("user not found");
    }
   
});
router.patch("/updateprofile/:id",async(req,res)=>{
    let data=req.body;
    if(data.password){
        data.password=await bcrypt.hash(data.password,10);
        }
        let result=await users.findByIdAndUpdate(req.params.id,data,{new:true});
        res.send(result);
});
router.post("/addquestion",(req,res)=>{
    res.send("Add question route");
});
router.get("/viewquestion",(req,res)=>{
    res.send("view question route");
});
router.put("/update",(req,res)=>{
    res.send("Update response route");
});
router.get("/viewplants",(req,res)=>{
    res.send("view plants route");
});

module.exports=router;