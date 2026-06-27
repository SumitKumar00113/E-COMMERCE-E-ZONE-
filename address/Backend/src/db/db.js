import mongoose from "mongoose"
import config from "../configs/auth.config.js";


const connectToDB=async()=>{
try{
    await mongoose.connect(config.MONGO_URI);
    console.log("connected to Database")
}catch(err){
console.log("error during connect to Database in address",err)
}
}

export default connectToDB;