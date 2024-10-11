import {Request,Response, NextFunction } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { error } from "console";
import { TryCatch } from "../middlewares/error.js";

export const newUser =TryCatch(async (
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    
        // return next(new ErrorHandler("mera custom eerro",500));
        // throw new Error("pohapohapoha")
        const {name,email,photo,gender,_id,dob}= req.body;
        console.log(name,email,photo,gender,_id,dob); 


        if(!_id || !name || !email || !photo || !gender|| !dob){
            return next(new ErrorHandler("Please Enter All Fields",400));  //------------->
        }

        let user = await User.findById(_id);
        if(user){
            return res.status(200).json({
                success:true,
                message:`Welcome ${user.name} to the panel`    //---------------------->
            })
        }
        

        user= await User.create({
            name,
            email,
            photo,
            gender,
            _id,
            dob:new Date(dob)
        })

       return  res.status(201).json({
            success:true,
            message:`Welcome  , ${user.name}`
        })
    
});


export const getAllUsers=TryCatch(async(req,res,next)=>{
    const user=await User.find({});
    return res.status(200).json({
        success:true,
        user
    })
})


export const getUser=TryCatch(async(req,res,next)=>{
    const id=req.params.id;
    const user=await User.findById(id);

    if(!user)   return next((new ErrorHandler("Invalid ID",400)));
    
    return res.status(200).json({
            success:true,
            user
     })  
})

export const deleteUser=TryCatch(async(req,res,next)=>{
    const id =req.params.id;
    const user=await User.findById(id);

    if(!user)   return next((new ErrorHandler("Invalid ID",400)));

    await user.deleteOne();
    return res.status(200).json({
        success:true,
        message:"User Deleted Successfully"
    })
})


