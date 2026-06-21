import mongoose from "mongoose";


const productSchema =new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    price:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            enum:["INR","USD"],
            default:"INR"
        }
    },
    images:[
        {
            url:String,
            alt:String,
            thumbnail:String,
            id:String,

        }
    ],
    category:{
        type:String,
        enum:["Electronics","Clothing","Books","Home & Kitchen","Sports & Outdoors","Beauty & Personal Care","Toys & Games","Automotive","Health & Wellness","Jewelry & Accessories"],
        default:"Electronics"
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    }
})
productSchema.index({ title: "text", description: "text", category: "text" }, { weights: { title: 10, description: 1, category: 5 } });
const productModel =mongoose.model("product",productSchema);

export default productModel;