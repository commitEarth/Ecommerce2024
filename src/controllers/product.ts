import { TryCatch } from "../middlewares/error.js";
import { Request } from "express";
import { BaseQuery,  NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";

import {faker} from "@faker-js/faker"
import { myCache } from "../app.js";
import { json } from "stream/consumers";
import { invalidateCache } from "../utils/feature.js";


// Third <{},{},NewProductRequestBody>  iss a ReqBody *
export const newProduct=TryCatch(async(req:Request<{},{},NewProductRequestBody> ,res,next)=> {

        const {name,price,stock,category}=req.body;
        const photo=req.file;
        if(!photo)return next(new ErrorHandler("Please Add Photo",400));//bad request

        if(!name || !price || !stock|| !category){
            rm(photo.path,()=>{
                console.log("Deleted file"+photo.path);
            })

            return next(new ErrorHandler("Please Enter All Fields ",400));//bad requset 

        }


        const product =await Product.create({
            name,price,stock,
            category:category.toLowerCase(),
            photo:photo?.path,
        })
         
            
         invalidateCache({product:true,admin:true});

        return res.status(201).json({
            success:true,
            message:"Product Created Successfully"
        })

});

export const getLatestProducts=TryCatch(async(req:Request<{},{},NewProductRequestBody> ,res,next)=> {

    let products;

    if(myCache.has("latest-product")){ 
        products=JSON.parse(myCache.get("latest-product") as string);
    }
    else{
        products=await Product.find({}).sort({"createdAt":-1}).limit(5);
        myCache.set("latest-product",JSON.stringify(products));
    }


    return res.status(201).json({
        success:true,
        products
    })

});

export const getAllCategories=TryCatch(async(req:Request<{},{},NewProductRequestBody> ,res,next)=> {

    let categories;
    if(myCache.has("categories")){
        categories=JSON.parse(myCache.get("categories")as string);
    }
    else{
        categories=await Product.distinct("category");
        myCache.set("categories",JSON.stringify(categories))
    }

     

    return res.status(201).json({
        success:true,
        categories
    })

});

export const getAdminProducts=TryCatch(async(req:Request<{},{},NewProductRequestBody> ,res,next)=> {

    let products;
    if(myCache.has("all-products")){
        products=JSON.parse(myCache.get("all-products") as string);
    }
    else{
        products=await Product.find({});
        myCache.set("all-products",JSON.stringify(products))
    }

    

    return res.status(201).json({
        success:true,
        products
    })

});

export const getSingleProduct=TryCatch(async(req:Request<{id:String},{},NewProductRequestBody> ,res,next)=> {

    //by ID Search
    const id =req.params.id;
    let products;

    if(myCache.has(`product-${id}`)){
       products= JSON.parse( myCache.get(`product-${id}`)as string);

    }

    else{
         products=await Product.findById(id);
        if(!products)return next(new ErrorHandler("Product Not Found",404)) // 404 Not Found 
        myCache.set(`product-${id}`,JSON.stringify(products));

    }

    
    return res.status(201).json({
        success:true,
        products
    })

});

export const updateProduct =TryCatch(async(req:Request,res,next)=> {


    const id = req.params.id;
    const {name,price,stock,category}=req.body;
    const photo=req.file;   

    const product = await Product.findById(id);

    if(!product)return next(new ErrorHandler("Product Not Found ",404)) // 404 Not Found 
    
    

    if(photo){
        rm(product.photo!,()=>{     // "!" if null happens (VS CODE KE CHOCHLE)
            console.log("Deleted old Photo");
        })
        product.photo=photo.path;

       

    }
    if(name)product.name=name;
    if(price)product.price=price;
    if(stock)product.stock=stock;
    if(category)product.category=category;

    await product.save();
     invalidateCache({product:true,admin:true,productId:String(product._id)});

    return res.status(200).json({
        success:true,
        message:"Product Updated Successfully"
    })

});

export const deleteProduct=TryCatch(async(req:Request<{id:String},{},NewProductRequestBody> ,res,next)=> {

    const product=await Product.findById(req.params.id);
    if(!product)return next(new ErrorHandler("Product Not Found ",404)) // 404 Not Found 


    rm(product!.photo,()=>{
        console.log("Product Photo Deleted on DeleteById request");
    })
   
    await product.deleteOne()
     invalidateCache({product:true,admin:true,productId:String(product._id)});

    return res.status(201).json({
        success:true,
        message:"Product Deleted Successfully"
    })

});


export const getAllProducts=TryCatch(async(req:Request<{},{},{},SearchRequestQuery> ,res,next)=> {

    const{search, sort, category, price}=req.query;
    const page=Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE)||8;
    const skip =limit*(page-1);

    const baseQuery:BaseQuery= {};

    if(search){
        baseQuery.name={
            $regex:search,
            $options:"i"
        };
    }
    if(price){
        baseQuery.price={
            $lte:Number(price),
        }
    }
    if(category){
        baseQuery.category=category;
    }
 

    const productPromise= Product.find(baseQuery)
        .sort(sort && {price: sort=== "asc" ? 1: -1})
        .limit(limit)
        .skip(skip)

    // Products means filtered, limited and sorted products
    const [products,filteredOnlyProducts]=await Promise.all([
        productPromise
        ,
        Product.find(baseQuery)


    ]);


    const totalPage=Math.ceil(filteredOnlyProducts.length/limit);


    return res.status(200).json({
        success:true,
        products,
        totalPage,
        
    })

}); 

// const generateRandomProducts=async(count:number=10)=>{
//     const products=[];
//     for(let i =0;i<count;i++){
//         const product={
//             name:  faker.commerce.productName(),
//             photo: `uploads/91606c07-9af8-4da2-847b-b76072917366.jpg`,
//             price: faker.commerce.price({min:1500,max:80000,dec:0}),
//             stock: faker.commerce.price({min:0,max:100,dec:0}),
//             category:faker.commerce.department(),
//             createdAt:new Date(faker.date.past()),
//             updatedAt:new Date(faker.date.recent()),
//             __v:0,
    
//         }
//         products.push(product);
//     };
//     await Product.create(products);
// console.log("add random SUCCESSFUL");
// }
// // generateRandomProducts();
// 
// const deleteRandomProducts=async(counr:number=10)=>{
//     const products=await Product.find({}).skip(2);
//     for(let i =0;i<products.length;i++){
//         const product=products[i];
//         await product.deleteOne();
//     }
//     console.log("DELETE SUCCESSFUL");
    
// }
// //deleteRandomProducts();
