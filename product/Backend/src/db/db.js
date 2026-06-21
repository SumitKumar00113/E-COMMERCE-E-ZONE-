import mongoose from "mongoose";
import config from "../configs/auth.config.js"


const connectToDb=async()=>{
    try{
        await mongoose.connect(config.MONGO_URI);
    console.log("Database connected")
    }catch(err){
        console.log("Database connection error",err)
    }
}

export default connectToDb;