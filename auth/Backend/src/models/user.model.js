import mongoose from "mongoose";
import { isDeepStrictEqual } from "node:util";


const userSchema= new mongoose.Schema({
    fullName:{
firstName:{
    type:String,
    required:true,

},
lastName:{
    type:String,

}
    },
    userName:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobNo:{
        country:{
            type:String,
            enum:["india","usa"],
            default:"india"
        },
        number:String
    },
    password:{
        type:String,
        select:false,
    }, 
    role:{
        type:String,
        enum:["user","seller"],
        default:"user"
    }

},{timestamps:true})

const userModel=mongoose.model("user",userSchema);

export default userModel;