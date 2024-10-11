
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

///middleware to make sure that admini only aloowed 
export const adminOnly=TryCatch(async(req,res,next)=>{
        const {id}=req.query;
        if(!id)return next(new ErrorHandler("Please Login First",401)); //unauthorized

        const user = await User.findById(id);
        if(!user)return next(new ErrorHandler("This ID doesnot Exists",401));

        if(user.role!="admin") return next(new ErrorHandler("You have the Admin Previlege to continue " ,403));

        next(); // if admin then conitnue

    })
    

