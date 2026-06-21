import mongoose from "mongoose";

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


const orderSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    items:[
        {
            product:{
                
            }
        }
    ]
})