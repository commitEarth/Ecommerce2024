import express, {Request,Response, NextFunction } from "express"
import { connectDB } from "./utils/feature.js";
import { error } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors"

import userRoutes from "./routes/user.js"
import productRoute from "./routes/products.js"
import orderRoute from "./routes/order.js"
import paymentRoute from  "./routes/payment.js"
import dashboardRoute from "./routes/stats.js"

 
 
config({
    path:"./.env",
}) 
console.log(process.env.PORT);


const port = process.env.PORT||4000; 
const mongoURI = process.env.MONGO_URI||""; 
const stripeKey = process.env.STRIPE_KEY||""; 

 
connectDB(mongoURI);

export const stripe=new Stripe(stripeKey);

export const myCache=new NodeCache(); 



const app =express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/",(req,res)=>{
    res.send("API working ");
})

//defining routes
app.use("/api/v1/user" ,userRoutes);
app.use("/api/v1/product" ,productRoute);
app.use("/api/v1/order" ,orderRoute);
app.use("/api/v1/payment" ,paymentRoute);
app.use("/api/v1/dashboard" ,dashboardRoute);


app.use("/uploads",express.static("uploads"));
app.use(error);

app.listen(port,()=>{
    console.log(`Server working on port ${port}`);
})