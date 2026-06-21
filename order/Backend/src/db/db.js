import mongoose from "mongoose";
import  config  from "../configs/auth.config.js";



const connectToDb=async()=>{
    try{
        await mongoose.connect(config.MONGO_URI);
        console.log("connected to database")
    }catch(err){
        console.log("errors:",err)
    }
}

export default connectToDb;