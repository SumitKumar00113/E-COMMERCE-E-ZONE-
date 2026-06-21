import mongoose from "mongoose";
import config from "../configs/auth.config.js";


const connectToDb=async()=>{
try{
await mongoose.connect(config.MONGO_URI);
console.log("connected to database")
}catch(err){
    console.log("error during connect to database")
}
}


export default connectToDb