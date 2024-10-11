import express from "express";
import { getAllUsers, getUser, newUser,deleteUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// route-----> /api/v1/user/new  post request 
app.post("/new",newUser);


// route-----> /api/v1/user/all  
app.get("/all",adminOnly,getAllUsers);

// route-----> /api/v1/user/dyanamicID
app.route("/:id").get(getUser).delete(adminOnly,deleteUser);

export default app;

 