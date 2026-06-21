import mongoose from "mongoose";



const cartSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    items:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                required:true,
            },
            quantity:{
                type:Number,
                default:1,
            },
            size:{
                type:String,
               enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
               default:"L"
            },
           color: {
  type: String,
  enum: [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Purple",
    "Pink",
    "Brown",
    "Gray",
    "Navy",
    "Beige"
  ],

}
        }
    ]
},{timestamps:true})



const cartModel=mongoose.model("cart",cartSchema);


export default cartModel;