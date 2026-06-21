import mongoose from "mongoose";
import { isDeepStrictEqual } from "node:util";

const addressSchema=new mongoose.Schema({
    addresses:{
          houseNumber: String,
  street: String,
  area: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
  mobileNo: String,
  isDefault:{
    type:Boolean,
    default:false,
  }

    }
})

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
    address:[
        addressSchema,
    ],
    role:{
        type:String,
        enum:["user","seller"],
        default:"user"
    }

},{timestamps:true})

const userModel=mongoose.model("user",userSchema);

export default userModel;