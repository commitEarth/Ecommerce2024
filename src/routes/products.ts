import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// /api/v1/products/new
app.post("/new",singleUpload,newProduct);

//to get all product with filters
app.get("/all",getAllProducts);


//
app.get("/latest",getLatestProducts);
//
app.get("/categories",getAllCategories);
//
app.get("/admin-products",adminOnly,getAdminProducts);
//

app.route("/:id")
    .get(getSingleProduct)
    .put(adminOnly,singleUpload,updateProduct)
    .delete(adminOnly,deleteProduct);


export default app;

 