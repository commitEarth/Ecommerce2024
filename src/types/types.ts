import {Response,Request,NextFunction}from "express";
import { TryCatch } from "../middlewares/error.js";

export  interface NewUserRequestBody{
    name:String;
    email:String;
    photo:String;
    gender:String;
    role:String;
    _id:String;
    dob:String;
}

export  interface NewProductRequestBody{
    name:string;
    category:string;
    price:number;
    stock:number;
    photo:any;
    
}


export type ControllerType=(
    (req: Request<any>,
     res: Response, 
     next: NextFunction,
    ) => Promise<void | Response<any, Record<string, any>>> 
)

export type SearchRequestQuery={
    search?:string;
    price?:string;
    category?:string;
    sort?:string;
    page?:string;
   

    
};

export interface BaseQuery{
    name?: {
        $regex: string;
        $options: string;
    };

    price?: {$lte:number};

    category?: string ;
};

export type InvalidateCacheProps={
    product?:boolean;
    order?:boolean;
    admin?:boolean;
    userId?:string;
    orderId?:string;
    productId?:string| string[];
}

export type OrderItemType={
    name:string,
    photo:string,
    price:number,
    quantity:number,
    productId:number,

}

export type ShippingInfoType={
    address:string,
    city:string,
    state:string,
    country:string,
    pincode:number,
   
}

export interface NewOrderRequestBody{
    shippingInfo:ShippingInfoType;
    user:string,
    subtotal:number,
    tax:number,
    shippingCharges:number,
    discount:number,
    total:number,
    orderItems:OrderItemType[],
}