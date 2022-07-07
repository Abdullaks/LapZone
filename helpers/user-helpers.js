const db = require('../config/connections')

const userData = require('../models/user')
const productData = require('../models/product')
const cartData = require('../models/cart')
const wishListData = require('../models/wishlist')
const orderData = require('../models/order')
const couponData = require('../models/coupon')


const nodeMailer = require('nodemailer')

const bcrypt = require('bcrypt')

const { Promise, default: mongoose, Mongoose } = require("mongoose");
const async = require('hbs/lib/async')
const req = require('express/lib/request')
const { reject, promise } = require('bcrypt/promises')
const product = require('../models/product')
// const { count, count } = require('../models/user')
const user = require('../models/user')
const { response } = require('express')

const Razorpay = require('razorpay');
const { resolve } = require('path')
const { log } = require('console')
require('dotenv').config()

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_KEY ,
});




module.exports = {


    doSignup: (userDataa) => {
        // console.log(userData);
        return new Promise(async (resolve, reject) => {
            const user = await userData.findOne({ email: userDataa.email })
            if (user) {
                reject({ status: false, msg: 'email already taken' })
            }
            else {
                if (userDataa.password == userDataa.repassword) {
                    userDataa.password = await bcrypt.hash(userDataa.password, 10)

                    const otpGenerator = await Math.floor(1000 + Math.random() * 9000)
                    const newUser = await ({
                        name: userDataa.name,
                        email: userDataa.email,
                        password: userDataa.password,
                        otp: otpGenerator

                    })
                    console.log(newUser);
                    if (newUser) {
                        try {
                            const mailTransporter = nodeMailer.createTransport({
                                host: 'smtp.gmail.com',
                                service: "gmail",
                                port: 465,
                                secure: true,
                                auth: {
                                    user: process.env.NODEMAILER_USER,
                                    pass: process.env.NODEMAILER_PASS
                                },
                                tls: {
                                    rejectUnauthorized: false
                                }

                            });
                            const mailDetails = {
                                from: "ksabdulla000@gmail.com",
                                to: userDataa.email,
                                subject: "just testing nodemailer",
                                text: "just random texts ",
                                html: '<p> Hi ' + userDataa.name + ' your OTP is ' + otpGenerator + ''
                            }
                            mailTransporter.sendMail(mailDetails, (err, Info) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("email has been sent ", Info.response);
                                }
                            })
                        } catch (error) {
                            console.log(error.message);
                        }

                    }

                    resolve(newUser)
                }
                else {
                    console.log('different passwords');
                }


            }

        })
    },
    doLogin: (userDataa) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await userData.findOne({ email: userDataa.email })
            if (user) {
                bcrypt.compare(userDataa.password, user.password).then((result) => {
                    if (result) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        response.status = false
                        resolve(response)
                    }
                })


            } else {
                console.log('login failed no user');
                resolve({ status: false })

            }
        })
    },
    findUser: (id) => {
        return new Promise(async (resolve, reject) => {
            const user = await userData.findOne({ _id: id }).lean()
            resolve(user)
        })
    },
    doEmailVerify: (userDataa) => {
        return new Promise(async (resolve, reject) => {
            const user = await userData.findOne({ email: userDataa.email })

            if (user) {

                const otpGenerator = await Math.floor(1000 + Math.random() * 9000)
                const newUser = await ({
                    email: user.email,
                    _id: user._id,
                    otp: otpGenerator

                })
                try {
                    const mailTransporter = nodeMailer.createTransport({
                        host: 'smtp.gmail.com',
                        service: "gmail",
                        port: 465,
                        secure: true,
                        auth: {
                            user: "ksabdulla000@gmail.com",
                            pass: "jehxqgprcfqnhlal"
                        },
                        tls: {
                            rejectUnauthorized: false
                        }

                    });
                    const mailDetails = {
                        from: "ksabdulla000@gmail.com",
                        to: userDataa.email,
                        subject: "just testing nodemailer",
                        text: "just random texts ",
                        html: '<p> Hi ' + userDataa.name + ' your OTP is' + otpGenerator + ''

                    }
                    mailTransporter.sendMail(mailDetails, (err, Info) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("email has been sent ", Info.response);
                        }
                    })
                } catch (error) {
                    console.log(error.message);
                }
                console.log(newUser);
                resolve(newUser)
            } else {
                reject({ status: false, msg: "Email is not Registered,Please sign up!" })
            }
        })
    },
    resetPassword: (newpassword, userId1) => {
        return new Promise(async (resolve, reject) => {

            let response = {}
            newpassword.newPassword = await bcrypt.hash(newpassword.newPassword, 10)

            let userId = userId1

            let resetUser = await userData.findByIdAndUpdate(
                { _id: userId },
                { $set: { password: newpassword.newPassword } }

            )

            resolve(resetUser)
        })
    },
    getPopularItems: () => {
        return new Promise(async (resolve, reject) => {
            const popularProduct = await productData.find({}).limit(6).lean()
            resolve({ popularProduct })
        })

    },
    getProductDetails: (productId) => {
        const id = mongoose.Types.ObjectId(productId);
        return new Promise(async (resolve, reject) => {
            const productDetails = await productData.findOne({ _id: id }).lean().then((productDetails) => {
                resolve(productDetails)
            })

        })
    },
    addToCart: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            const product = await productData.findOne({ _id: productId })
            const userCart = await cartData.findOne({ user: userId })

            if (userCart) {
                const proExist = userCart.products.findIndex((products) => products.pro_id == productId)
                if (proExist != -1) {
                    cartData.updateOne({ user: userId, 'products.pro_id': productId },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve({ ProductAlredyInCart: true })
                    })
                } else {
                    await cartData.findOneAndUpdate(
                        { user: userId },
                        {
                            $push:
                            {
                                products: { pro_id: productId, price: product.Price }
                            }
                        }

                    ).then(() => {
                        resolve({ added: true })
                    })
                }


            } else {
                const cartObj = new cartData({ user: userId, products: { pro_id: productId, price: product.Price } })
                console.log(cartObj);
                await cartObj.save((err, result) => {
                    if (err) {
                        resolve({ error: 'cart not created' })
                    } else {
                        resolve({ newCart: true })
                    }
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const cartItems = await cartData.findOne({ user: userId }).populate('products.pro_id').lean()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            const cart = await cartData.findOne({ user: userId })
            if (cart) {
                count = cart.products.length
            }

            resolve(count)
        })
    },
    changeProductQuantity: (Data, user) => {
        cartId = Data.cart
        proId = Data.product
        quantity = parseInt(Data.quantity)
        count = parseInt(Data.count);

        return new Promise(async (resolve, reject) => {

            if (Data.count == -1 && Data.quantity == 1) {

                await cartData.findOneAndUpdate({ user: user._id },
                    {
                        $pull: { products: { _id: cartId } }

                    }).then((response) => {

                        resolve({ removeProduct: true })
                    })
            } else {
                await cartData.findOneAndUpdate({ user: user._id, 'products.pro_id': Data.product },
                    {
                        $inc: { "products.$.quantity": count }

                    }).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },
    removeProductFromCart: (Data, user) => {
        return new Promise(async (resolve, reject) => {
            await cartData.findOneAndUpdate({ user: user._id },
                {
                    $pull: { products: { _id: Data.cart } }
                }).then((response) => {
                    resolve(true)
                })
        })
    },
    getSubTotal: (user) => {
        const id = mongoose.Types.ObjectId(user);
        return new Promise(async (resolve, reject) => {
            const amount = await cartData.aggregate([
                {
                    $match: { user: id },
                },
                {
                    $unwind: '$products',
                },
                {
                    $project: {
                        id: "$products.pro_id",
                        total: { $multiply: ['$products.price', '$products.quantity'] },
                    },
                },
            ])

            let cartUser = await cartData.findOne({ user: id })
            if (cartUser) {
                amount.forEach(async (data) => {
                    await cartData.updateMany(
                        { "products.pro_id": data.id },
                        { $set: { "products.$.subtotal": data.total } }
                    )
                })
                resolve(amount)
            }

        })


    },
    getTotalAmount: (user) => {
        const id = mongoose.Types.ObjectId(user);

        return new Promise(async (resolve, reject) => {
            const grossTotal = await cartData.aggregate([
                {
                    $match: { user: id },
                },
                {
                    $unwind: '$products',
                },
                {
                    $project: {
                        quantity: '$products.quantity',
                        price: '$products.price',
                    },
                },
                {
                    $project: {
                        productname: 1,
                        quantity: 1,
                        price: 1
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$price'] } }
                    },
                },
            ])

            if (grossTotal.length == 0) {
                resolve({ status: true })
            } else {
                let netTotal = grossTotal.pop()
                resolve(netTotal.total)

            }

        })


    },
    getDeliveryCharge: (amount) => {
        return new Promise((resolve, reject) => {
            if (amount < 1000) {
                resolve(40)
            } else {
                resolve(0)
            }
        })
    },
    getGrandTotal: (netTotal, deliveryCharge) => {
        return new Promise((resolve, reject) => {
            const grandTotal = netTotal + deliveryCharge
            resolve(grandTotal)

        })
    },
    addToWishList: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            const userWishList = await wishListData.findOne({ user_id: userId })
            if (userWishList) {
                const proExist = userWishList.products.findIndex(
                    (products) => products.pro_Id == productId
                );
                if (proExist != -1) {
                    resolve({ productAlreadyInWishList: true })


                } else {
                    await wishListData.findOneAndUpdate(
                        { user_id: userId },

                        { $push: { products: { pro_Id: productId } } }
                    )
                    resolve({ added: true })
                }
            } else {
                const wishListNew = new wishListData({
                    user_id: userId,
                    products: { pro_Id: productId },
                });

                await wishListNew.save((err, result) => {
                    if (err) {
                        resolve({ msg: "Not added to wishlist" });
                    } else {
                        resolve({ msg: "wishlist created" });
                    }
                });
            }
        })
    },
    getWishListCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            const wishlist = await wishListData.findOne({ user: userId })
            if (wishlist) {
                count = wishlist.products.length
            }

            resolve(count)
        })
    },
    getWishListProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const wishListItems = await wishListData.findOne({ user_id: userId }).populate("products.pro_Id").lean()
            resolve(wishListItems)
        })

    },
    removeProductFromWishList: (Data, user) => {
        return new Promise(async (resolve, reject) => {
            await wishListData.findOneAndUpdate({ user_id: user },
                {
                    $pull: { products: { _id: Data.wishList } }
                }

            ).then((response) => {
                resolve(true);
            })
        });
    },
    validateCoupon: (data, userId) => {

        return new Promise(async (resolve, reject) => {
            obj = {};

            const coupon = await couponData.findOne({ couponCode: data.coupon });
            if (coupon) {
                if (coupon.limit > 0) {
                    checkUserUsed = await couponData.findOne({
                        couponCode: data.coupon,
                        usedUsers: { $in: [userId] },
                    });
                    if (checkUserUsed) {
                        obj.couponUsed = true;
                        obj.msg = " You Already Used A Coupon";
                        console.log(" You Already Used A Coupon");
                        resolve(obj);
                    } else {
                        let nowDate = new Date();
                        date = new Date(nowDate);
                        //   console.log(date)
                        if (date <= coupon.expirationTime) {
                            await couponData.updateOne(
                                { couponCode: data.coupon },
                                { $push: { usedUsers: userId } }
                            );

                            await couponData.findOneAndUpdate(
                                { couponCode: data.coupon },
                                { $inc: { limit: -1 } }
                            );
                            let total = parseInt(data.total);
                            let percentage = parseInt(coupon.discount);
                            let discoAmount = ((total * percentage) / 100).toFixed()

                            obj.discoAmountpercentage = percentage;
                            obj.total = total - discoAmount;
                            obj.success = true;
                            resolve(obj);
                        } else {
                            obj.couponExpired = true;
                            console.log("This Coupon Is Expired");
                            resolve(obj)
                        }
                    }
                } else {
                    obj.couponMaxLimit = true;
                    console.log("Used Maximum Limit");
                    resolve(obj)
                }
            } else {
                obj.invalidCoupon = true;
                console.log("This Coupon Is Invalid");
                resolve(obj)
            }
        });
    },
    placeOrder: (order, products, grandTotal, deliveryCharge) => {
        return new Promise(async (resolve, reject) => {
            // console.log(order, products, grandTotal);
            let status = order.paymentMethod === 'cod' ? 'placed' : 'pending'
            const orderObj = await orderData({
                user_Id: order.userId,
                Total: order.total,
                ShippingCharge: deliveryCharge,
                grandTotal: order.mainTotal,
                coupondiscountedPrice: order.discountedPrice,
                couponPercent: order.discoAmountpercentage,
                couponName: order.couponName,
                payment_status: status,
                paymentMethod: order.paymentMethod,
                ordered_on: new Date(),
                product: products.products,
                deliveryDetails: {
                    name: order.fname,
                    number: order.number,
                    email: order.email,
                    house: order.house,
                    localplace: order.localplace,
                    town: order.town,
                    district: order.district,
                    state: order.state,
                    pincode: order.pincode
                }

            })
            await orderObj.save(async (err, result) => {
                await cartData.remove({ user: order.userId })
                resolve(orderObj)
            })

        })
    },
    generateRazorpay: (orderId, totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log("new" + order);
                resolve(order)
            });

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            let crypto = require("crypto");
            let hmac = crypto.createHmac('sha256', 'ivnukJKaOB5nrm2M3MiLmIGU')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }

        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise(async (resolve, reject) => {
            const changeStatus = await orderData.findOneAndUpdate({ _id: orderId },
                {
                    $set: { payment_status: 'placed' }
                }
            ).then((changeStatus) => {
                resolve(changeStatus)
            })
        })
    },
    getorderProductSuccess: (orderId) => {

        return new Promise(async (resolve, reject) => {
            const orderdetails = await orderData.findOne({ _id: orderId }).populate("product.pro_id").lean()
            resolve(orderdetails)
        })
    },
    getAllOrders: (user) => {
        // console.log(user);
        return new Promise(async (resolve, reject) => {
            const AllOrders = await orderData.find({ user_Id: user }).populate("product.pro_id").lean()
            resolve(AllOrders)
        })
    },
    getSingleOrderdetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            const orderDetails = await orderData.findOne({ _id: orderId }).populate("product.pro_id").lean()
            // console.log(orderDetails);
            resolve(orderDetails)
        })
    },
    cancelOrder: (Data) => {

        orderId = mongoose.Types.ObjectId(Data.orderId);

        let quantity = parseInt(Data.quantity)
        console.log(parseInt(Data.couponPercent))

        discountPrice = parseInt(Data.subtotal) - ((parseInt(Data.couponPercent) * parseInt(Data.subtotal)) / 100).toFixed(0);
        console.log(discountPrice)


        const status = "cancelled"
        return new Promise(async (resolve, reject) => {

            const cancelOrder = await orderData.findOneAndUpdate({ _id: orderId, 'product.pro_id': Data.productId },
                {
                    $set:
                    {
                        "product.$.status": status,
                        "products.$.orderCancelled": true,
                    },
                    $inc: {
                        grandTotal: -discountPrice,
                        "products.$.subtotal": -(parseInt(Data.subtotal)),
                        reFund: discountPrice,

                    }
                }

            )
            await productData.findOneAndUpdate({ _id: Data.productId },
                {
                    $inc: { Stock: quantity }
                })

            // resolve(cancelOrder)
            let products = await orderData.aggregate([
                {
                    $match: { _id: orderId },
                },

                {
                    $project: {
                        _id: 0,
                        product: 1,
                    },
                },
                {
                    $unwind: "$product",

                },
                {
                    $match: { "products.orderCancelled": false },
                },
            ])
            console.log(products);
            if (products.length == 0) {
               
                await orderData.updateMany(
                    { _id: orderId },
                    {
                        $inc: { reFund: Data.ShippingCharge, grandTotal: -Data.ShippingCharge },
                    }
                )
                resolve({ status: true });
            } else {
                resolve({ status: true });
            }



        })
    },
    addAddress: (userId, Data) => {
        return new Promise(async (resolve, reject) => {
            const user = await userData.findOneAndUpdate({ _id: userId },
                {
                    $push: {
                        address: {
                            fname: Data.fname,
                            lname: Data.lname,
                            house: Data.house,
                            towncity: Data.towncity,
                            district: Data.district,
                            state: Data.state,
                            pincode: Data.pincode,
                            email: Data.email,
                            mobile: Data.mobile
                        }
                    }
                })
            resolve()
        })
    },
    deleteAddress: (addressId, userId) => {
        return new Promise(async (resolve, reject) => {
            const removeaddress = await userData.updateOne({ _id: userId },
                {
                    $pull:
                        { address: { _id: addressId } }
                })
            resolve()
        })

    },
    getAllAddress: (user) => {
        return new Promise(async (resolve, reject) => {
            const allAddress = await userData.findOne({ _id: user }).lean()
            resolve(allAddress)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            const products = await productData.find({}).lean()
            resolve(products)
        })
    },
    filterBrands: (brandFilter) => {
        let brandId = mongoose.Types.ObjectId(brandFilter);
        return new Promise(async (resolve, reject) => {
            result = await productData.aggregate([
                {
                    $match: { Brand: brandId }
                },
            ])
            resolve(result)

        })

    },
    searchFilter: (brandFilter, categoryFilter, price) => {
        return new Promise(async (resolve, reject) => {
            let result

            if (brandFilter && categoryFilter) {

                let brandId = mongoose.Types.ObjectId(brandFilter);
                let categoryId = mongoose.Types.ObjectId(categoryFilter)
                console.log(brandId);
                console.log(categoryId);
                result = await productData.aggregate([
                    {
                        $match: { Brand: brandId }

                    },

                    {
                        $match: { Category: categoryId }

                    },
                    {
                        $match: { Price: { $lt: price } }
                    }
                ])
                // console.log("1");
            }

            else if (brandFilter) {

                let brandId = mongoose.Types.ObjectId(brandFilter);
                console.log(brandId);
                result = await productData.aggregate([
                    {
                        $match: { Brand: brandId }

                    },
                    {
                        $match: { Price: { $lt: price } }
                    }
                ])
                // console.log("2");
                // console.log(result);

            }
            else if (categoryFilter) {

                let categoryId = mongoose.Types.ObjectId(categoryFilter)
                result = await productData.aggregate([


                    {
                        $match: { Category: categoryId }

                    },
                    {
                        $match: { Price: { $lt: price } }
                    }
                ])
                // console.log("3");
            }

            else {

                result = await productData.aggregate([

                    {
                        $match: { Price: { $lt: price } }
                    }
                ])
                // console.log("4");
            }
            resolve(result)
        })
    },

    getSearchProducts: (key) => {

        return new Promise(async (resolve, reject) => {
            const products = await productData.find({
                $or: [
                    { ProductName: { $regex: new RegExp("^" + key + ".*", "i") } },
                    // { Brand: { $regex: new RegExp("^" + key + ".*", "i") } },
                    // { Category: { $regex: new RegExp("^" + key + ".*", "i") } },
                ],
            }).lean()
            //   console.log("====================");
            //   console.log(products);
            resolve(products)
        })
    }




}







