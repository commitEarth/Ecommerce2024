
import mongoose from "mongoose";



const schema = new mongoose.Schema(
{
    
   shippingInfo:{
        address:{
            type:String,
            required:[true,"Enter address"],
        },
        city:{
            type:String,
            required:[true,"Enter city"]
        },
        state:{
            type:String,
            required:[true,"Enter state"]
        },
        pincode:{
            type:Number,
            required:[true,"Enter pincode"]

        },
   },

   user:{
    type:String,
    ref:"User",
    required:true,
   },
   subtotal:{
    type:Number,
    required:[true,"Enter subtotal"]
   },
   tax:{
    type:Number,
    required:[true,"Enter tax"]
   },
   shippingCharges:{
    type:Number,
    required:[true,"Enter subtotal"]
   },
   discount:{
    type:Number,
    default:0,
    required:[true,"Enter subtotal"]
   },
   total:{
    type:Number,
    required:[true,"Enter subtotal"]
   },
   status:{
    type:String,
    enum:["Processing","Shipped","Delivered"],
    default:"Processing",
   },
   orderItems:[
        {
            name:String,
            photo:String,
            price:Number,
            quantity:Number,
            productId:{
                type:mongoose.Types.ObjectId,
                ref:"Products",
            },
        },
   ],
},
{
    timestamps:true
})
 


export const Order = mongoose.model("Order",schema);



