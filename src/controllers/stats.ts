import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/feature.js";

export const getDashboardStats=TryCatch(async(req,res,next)=>{

    let stats={};
    const key ="admin-stats";
    if(myCache.has(key)) stats=JSON.parse(myCache.get(key) as string)
    else{

            const today =new Date();
            const sixMonthsAgo=new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() -6);



            const thisMonth={
                start:new Date(today.getFullYear(),today.getMonth(),1),
                end:today

            }
            const lastMonth={
                start:new Date(today.getFullYear(),today.getMonth()-1,1),
                end:new Date(today.getFullYear(),today.getMonth(),0)


            }

           
            const thisMonthProductsPromise = Product.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end,
                }
            })
            const lastMonthProductsPromise = Product.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end,
                }
            })

            const thisMonthUserPromise = User.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end,
                }
            })
            const lastMonthUserPromise = User.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end,
                }
            })
            const thisMonthOrdersPromise = Order.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end,
                }
            })
            const lastMonthOrdersPromise = Order.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end,
                }
            })
            const lastSixMonthOrdersPromise = Order.find({
                createdAt:{
                    $gte:sixMonthsAgo,
                    $lte:today
                }
            })

            const latestTransactionPromise=Order.find({}).select(["orderItems","discount","total","status"]).limit(4)


            const [thisMonthProducts,
                thisMonthUsers,
                thisMonthOrders,
                lastMonthProducts,
                lastMonthUsers,
                lastMonthOrders,
                productsCount,
                userCount,
                allOrders,
                lastSixMonthOrders,
                categories,
                femaleUserCount,
                latestTransaction,
                ]=await Promise.all([
                thisMonthProductsPromise
                ,thisMonthUserPromise
                ,thisMonthOrdersPromise
                ,lastMonthProductsPromise
                ,lastMonthUserPromise
                ,lastMonthOrdersPromise
                ,Product.countDocuments()
                ,User.countDocuments()
                ,Order.find({}).select("total")
                ,lastSixMonthOrdersPromise
                ,Product.distinct("category")
                ,User.countDocuments({gender:"female"})
                ,latestTransactionPromise
            ])

                let thisMonthRevenue=0,lastMonthRevenue=0;
                thisMonthOrders.forEach((i)=>{thisMonthRevenue+=(i.total || 0)})
                lastMonthOrders.forEach((i)=>{lastMonthRevenue+=(i.total || 0)});

                const changePercent ={
                    revenue:calculatePercentage(thisMonthRevenue,lastMonthRevenue),
                    user:calculatePercentage(thisMonthUsers.length,lastMonthUsers.length),
                    product:calculatePercentage(thisMonthProducts.length,lastMonthProducts.length),
                    order:calculatePercentage(thisMonthOrders.length,lastMonthOrders.length)
                }
               
                let revenue =0;
                allOrders.forEach((i)=>{revenue+=(i.total || 0)})
                

                const count={
                    revenue,
                    product:productsCount,
                    user:userCount,
                    order:allOrders.length,

                }

                const orderMonthCount=getChartData({length:6,today,docArr:lastSixMonthOrders})
                const orderMonthRevenue=getChartData({length:6,today,docArr:lastSixMonthOrders ,property:"total"})

                

    
                const categoryCount:Record<string,number>[]=await getInventories({categories,productsCount});
                // let categoryCount: Map<string, number> = new Map(); ----------> FUTURE BUG SOLVING TO USE MAP RATER THAN RECORD
                



                const userRatio={
                    male:userCount-femaleUserCount,
                    female:femaleUserCount

                }

                const modifiesLatesttransaction=latestTransaction.map((i)=>({
                        _id:i._id,
                        discount:i.discount,
                        amount:i.total,
                        quantity:i.orderItems.length,
                        status:i.status

                }))


                stats={
                    
                    categoryCount,
                    changePercent, 
                    count,
                    chart:{
                        order:orderMonthCount,
                        revenue:orderMonthRevenue
                    },
                    userRatio,
                    latestTransaction:modifiesLatesttransaction
                };  

            myCache.set(key,JSON.stringify(stats))  
        }   

        return res.status(200).json({   
            success:true,
            stats 
        })


});

export const getPieCharts =TryCatch(async(req,res,next)=>{

    let charts;
    const key="admin-pie-charts";
    if(myCache.has(key)){charts=JSON.parse( myCache.get(key)  as string);}
    else{

        const [
            processingOrder,
            shippedOrder,
            deliveredObject,
            categories,
            productsCount,
            outOfStock,
            allOrders,
            allUsers,
            adminUsers,
            customerUsers
        ]=await Promise.all([
            Order.countDocuments({status:"Processing"}),
            Order.countDocuments({status:"Shipped"}),
            Order.countDocuments({status:"Delivered"}),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({stock:0}),
            Order.find({}).select(["total","discount","subtotal","tax","shippingCharges"]),
            User.find({}).select(["dob"]), //age k liy dob chaiye
            User.countDocuments({role:"admin"}),
            User.countDocuments({role:"user"})
        ])

        const orderFullfillment={
            processing:processingOrder,
            shipped:shippedOrder,
            delivered:deliveredObject
        }
        const productCategories:Record<string,number>[]=await getInventories({categories,productsCount});

        const stockAvalablity={
            inStock:productsCount-outOfStock,
            outOfStock:outOfStock
        }
        
        const grossIncome=allOrders.reduce(
            (prev,order)=>prev+(order.total||0),0
        );
        const discount=allOrders.reduce(
            (prev,order)=>prev+(order.discount||0),0
        );
        const productionCost=allOrders.reduce(
            (prev,order)=>prev+(order.shippingCharges||0),0
        );
        const burnt=allOrders.reduce(
            (prev,order)=>prev+(order.tax||0),0
        );
        const marketingCost =Math.round(grossIncome*(10/100)); 

        const netMargin=grossIncome-discount-productionCost-burnt-marketingCost ;

        const revenueDistribution={
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        }

        const userAgeGroup={
             teen:allUsers.filter((i)=>Number(i.age)<20).length,
             adult:allUsers.filter((i)=>Number(i.age)>=20 && Number(i.age)<50).length,
             old:allUsers.filter((i)=>Number(i.age)>=50 ).length,
        }

        const adminCustomer={
            admin:adminUsers,
            customer:customerUsers
        }

         charts={
            orderFullfillment,
            productCategories,
            stockAvalablity,
            revenueDistribution,
            userAgeGroup,
            adminCustomer
        }  

         myCache.set(key,JSON.stringify(charts));
    }

    return res.status(200).json({
        success:true,
        charts
    }) 


});


export const getBarCharts=TryCatch(async(req,res,next)=>{
    let charts;


    const key ="admin-bar-charts";

    if(myCache.has(key))charts=JSON.parse(myCache.get(key)as string);
    else{
        const today=new Date();

        const sixMonthsAgo=new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() -6);
        
        const twelveMonthsAgo=new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() -12);


        const lastSixMonthProductsPromise = Product.find({
            createdAt:{
                $gte:sixMonthsAgo,
                $lte:today
            }
        }).select("createdAt");


        const lastSixMonthUsersPromise = User.find({
            createdAt:{
                $gte:sixMonthsAgo,
                $lte:today
            }
        }).select("createdAt");
         
     

        const lastTwelveMonthOrdersPromise = Order.find({
            createdAt:{
                $gte:twelveMonthsAgo,
                $lte:today
            }
        }).select("createdAt");

        const[products,users,orders]=await Promise.all([
            lastSixMonthProductsPromise,
            lastSixMonthUsersPromise,
            lastTwelveMonthOrdersPromise,
             
        ])

        const productCount=getChartData({length:6,today,docArr:products})
        const usersCount=getChartData({length:6,today,docArr:users})
        const OrdersCount=getChartData({length:12,today,docArr:orders})

        charts={
             users:usersCount,
             products:productCount,
             orders:OrdersCount
        }


        myCache.set(key,JSON.stringify(charts));
    }
    return res.status(200).json({
        success:true,
        charts
    }) 
});


export const getLineCharts=TryCatch(async(req,res,next)=>{

    let charts;


    const key ="admin-line-charts";

    if(myCache.has(key))charts=JSON.parse(myCache.get(key)as string);
    else{
        const today=new Date();


        
        
        const twelveMonthsAgo=new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() -12);

        const baseQuery={
            createdAt:{
                $gte:twelveMonthsAgo,
                $lte:today
            }
        } 

        const[products,users,orders]=await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt","discount","total"]),
             
        ])

        const productCount=getChartData({length:12,today,docArr:products})
        const usersCount=getChartData({length:12,today,docArr:users})
        const discount=getChartData({length:12,today,docArr:orders,property:"discount"})

        const revenue=getChartData({length:12,today,docArr:orders,property:"total"})
        


        charts={
             users:usersCount,
             products:productCount,
             discount,
             revenue,
        }


        myCache.set(key,JSON.stringify(charts));
    }
    return res.status(200).json({
        success:true,
        charts
    }) 

});
