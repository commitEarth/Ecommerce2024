import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrder, newOrder, processOrder } from "../controllers/order.js";

const app = express.Router();

app.get("/",(req,res)=>{res.send("Order PAGE")} );

// route-----> /api/v1/order/new post request 
app.post("/new",newOrder );

// route-----> /api/v1/order/my get request 
app.get("/my",myOrder);

//rout---> api/v1/order/all get 
app.get("/all",adminOnly,allOrders);

app.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder);




export default app;

 