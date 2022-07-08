const { response } = require('express');
const express = require('express');
const router = express.Router();
const userHelper = require("../helpers/user-helpers");
const adminHelper = require("../helpers/admin-helpers");

const user = require('../models/user')
const product = require('../models/product')
// const admin=require('../models/admin')

let filterResult
 
const verifyUserLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    let id = req.session.user._id
    userHelper.findUser(id).then((user) => {
      if(user){
        if (user.block != true) {
          next();
        } else {
          res.redirect('/login')
        }
      }else{

        res.redirect('/signup')
      }
      
    }) 
  } else {
    req.session.loggedIn = false
    let brands = await adminHelper.getAllBrands()
    userHelper.getPopularItems().then((response) => {
      const popularProduct = response.popularProduct
      res.render('index', { popularProduct, brands })
    })
  }

}

/* GET home page. */
router.get('/', verifyUserLogin, async function (req, res, next) {
  const user = req.session.user

  let cartCount = ''
  let wishListCount = ''
  if(user){
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishListCount = await userHelper.getWishListCount(req.session.user._id)

  }
  
  let brands = await adminHelper.getAllBrands()
  userHelper.getPopularItems().then((response) => {


    const popularProduct = response.popularProduct
    console.log(popularProduct);
    // console.log(popularProduct._id);
    res.render('index', { user, popularProduct, cartCount, wishListCount, brands });




  })
});

router.get('/login', (req, res) => {
  const alert = req.flash('msg')
  if (req.session.loggedIn) {
    res.redirect('/')
  }
  else {
    const loginErr = req.session.loginErr
   
    
    res.render('user/login', { loginErr, alert })
    req.session.loginErr = false
    req.session.noUserloginErr=false
  }
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((User) => {
    req.session.otp = User.otp
    req.session.userDetails = User
    res.redirect('/otpSignup')
  })
})
router.get('/otpSignup', (req, res) => {
  res.render('user/otp-signup')
})
router.post('/otpSignup', async (req, res) => {
  if (req.body.otp == req.session.otp) {
    const userData = req.session.userDetails
    const adduser = await new user({
      name: userData.name,
      email: userData.email,
      password: userData.password
    })
    await adduser.save()
    res.redirect('/login')
  }
  else {
    res.redirect('/otpSignup')
  }
})
router.post('/login', (req, res) => {

  userHelper.doLogin(req.body).then((response) => {
    if(response.user){
      if (response.user.block) {
        req.flash('msg', 'You are blocked by Admin!')
        res.redirect('/login')
      } else {
        if (response.status) {
          req.session.loggedIn = true
          req.session.user = response.user
          res.redirect('/')
        } else {
          req.session.loggedInErr = true
          req.session.loginErr = 'Invalid Mail or Password'
          res.redirect('/login')
          
        }
      }
    }else{
      res.redirect('/login')
      
    }
    

  })

})

router.get('/emailVerify', (req, res) => {
  const loginErrForget = req.session.loginErrForget

  res.render('user/email-verify', { loginErrForget })
  req.session.loginErrForget = false
})
router.get('/otpForget', (req, res) => {
  const forgetOtpErr = req.session.forgetOtpErr
  res.render('user/otp-forget', { forgetOtpErr })
  req.session.forgetOtpErr = false
})
router.post('/emailVerify', (req, res) => {
  userHelper.doEmailVerify(req.body).then((response) => {
    req.session.userOtp = response.otp
    req.session.userId = response._id
    req.session.userDetails = response

    res.redirect('/otpForget')
  }).catch((err) => {
    req.session.loginErrForget = 'Email is not Registered,Please sign up!'
    res.redirect('/emailVerify')
  })
})

router.post('/otpForget', (req, res) => {

  if (req.body.otp == req.session.userOtp) {
    res.redirect('/resetPassword')
  } else {
    req.session.forgetOtpErr = 'Invalid OTP'
    res.redirect('/otpForget')
  }
})
router.get('/resetPassword', (req, res) => {
  const resetPasswordConfirmErr = req.session.resetPasswordConfirmErr
  res.render('user/reset-password', { resetPasswordConfirmErr })
  req.session.resetPasswordConfirmErr = false
})
router.post('/resetPassword', (req, res) => {

  if (req.body.newPassword == req.body.confirmNewPassword) {
    userHelper.resetPassword(req.body, req.session.userId).then((response) => {
      res.redirect('/login')
      console.log('password changed');
    })
  } else {
    req.session.resetPasswordConfirmErr = 'Both Password Should be Same'
    res.redirect('/resetPassword')
  }
})
router.get('/userProfile', verifyUserLogin, (req, res) => {
  const user = req.session.user
  res.render('user/user-profile', { user })
})
router.get('/manageAddress', verifyUserLogin, (req, res) => {
  const user = req.session.user
  userHelper.getAllAddress(req.session.user).then((response) => {
    const AllAddress = response
    res.render('user/Address', { user, AllAddress })
  })
})
router.get('/addAddress', verifyUserLogin, (req, res) => {
  const user = req.session.user
  res.render('user/addAddress', { user })
})
router.post('/addAddress/:id', (req, res) => {
  userHelper.addAddress(req.params.id, req.body).then((response) => {
    res.redirect('/manageAddress')
  })
})
router.get("/deleteAddress/:id", verifyUserLogin, (req, res) => {
  userHelper.deleteAddress(req.params.id, req.session.user._id).then((response) => {
    res.redirect('/manageAddress');
  })
})
router.get('/productDetails/:id', (req, res) => {
  const user = req.session.user
  userHelper.getProductDetails(req.params.id).then((response) => {
    const productDetails = response
    res.render('user/single-product-details', { user, productDetails })
  })
})


router.get('/cart', verifyUserLogin, async (req, res) => {
  const user = req.session.user


  let cartCount = await userHelper.getCartCount(req.session.user._id)
  if (cartCount > 0) {
    const cartItems = await userHelper.getCartProducts(req.session.user._id)
    // const subTotal = await userHelper.getSubTotal(req.session.user._id)
 
    const netTotal = await userHelper.getTotalAmount(req.session.user._id)
    const deliveryCharge = await userHelper.getDeliveryCharge(netTotal)
    const grandTotal = await userHelper.getGrandTotal(netTotal, deliveryCharge)
    res.render('user/cart', { cartItems, user, cartCount, netTotal, deliveryCharge, grandTotal })
  } else {
    const cartItems = await userHelper.getCartProducts(req.session.user._id)

    let cartItem = cartItems ? product : []
    cartCount = 0
    netTotal = 0
    deliveryCharge = 0
    grandTotal = 0
    res.render('user/cart', { cartItems, user, cartCount, netTotal, deliveryCharge, grandTotal })
  }


})
router.get('/addToCart/:id', (req, res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then((response) => {
    if(response){
      if (response.ProductAlredyInCart) {
        res.json({ ProductAlredyInCart: true })
      } else if (response.added) {
        res.json({ added: true })
      } else if(response.newCart) {
        res.json({ newCart: true })
      }
    }else{
      req.json()
    }

  })
})
router.post('/changeProductQuantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body, req.session.user).then(async (response) => {

    response.netTotal = await userHelper.getTotalAmount(req.session.user._id)

    res.json(response)
  })

})
router.post('/removeProductFromCart', (req, res) => {
  userHelper.removeProductFromCart(req.body, req.session.user).then((response) => {
    res.json({ status: true })
  })
})

router.get('/wishList', verifyUserLogin, async (req, res) => {
  const user = req.session.user
  let wishListCount = await userHelper.getWishListCount(req.session.user._id)

  const wishListItems = await userHelper.getWishListProducts(req.session.user._id)

  res.render('user/wish-list', { user, wishListCount, wishListItems })
})

router.get('/addToWishList/:id', (req, res, next) => {
  userHelper.addToWishList(req.params.id, req.session.user._id).then((response) => {
    // console.log(response);
    if (response.added) {
      res.json({ added: true })
    } else {
      res.json({ productAlreadyInWishList: true })
    }
  })

})
router.post('/removeProductFromWishList', (req, res) => {
  userHelper.removeProductFromWishList(req.body, req.session.user).then((response) => {
    res.json({ status: true })
  })
})
router.get('/checkOut', verifyUserLogin, async (req, res) => {
  const user = req.session.user  
  
    const [AllAddress, cartItems, netTotal, AllCoupons]
    = await Promise.all([
      userHelper.getAllAddress(req.session.user),
      userHelper.getCartProducts(req.session.user._id),
      userHelper.getTotalAmount(req.session.user._id),
      adminHelper.getAllCoupons()
    ])
  const deliveryCharge = await userHelper.getDeliveryCharge(netTotal)
  const grandTotal = await userHelper.getGrandTotal(netTotal, deliveryCharge)
  res.render('user/checkOut', { user, AllAddress, cartItems, netTotal, deliveryCharge, grandTotal, AllCoupons })  
})
router.post('/placeOrder', async (req, res) => {
  const [cartItems, netTotal] = await Promise.all([
    userHelper.getCartProducts(req.session.user._id),
    userHelper.getTotalAmount(req.session.user._id)
  ])
  console.log(cartItems);
  const deliveryCharge = await userHelper.getDeliveryCharge(netTotal)
  const grandTotal = await userHelper.getGrandTotal(netTotal, deliveryCharge)
// console.log(cartItems.length);
  userHelper.placeOrder(req.body, cartItems, grandTotal, deliveryCharge).then((response) => {
    req.session.orderId = response._id;
  
    if (req.body["paymentMethod"] == "cod") {
      res.json({ codSuccess: true })
    } else {
      userHelper.generateRazorpay(response._id, req.body.mainTotal).then((response) => {
        res.json(response)
      })
    }
  })
})
router.post('/verifyPayment', (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then((response) => {
    userHelper.changePaymentStatus(req.body["order[receipt]"]).then((response) => {
      console.log('payment success');
      console.log(response);
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})

router.post("/couponApply", async (req, res) => {

  // let todayDate = new Date().toISOString().slice(0, 10);

  let userId = req.session.user._id
  userHelper.validateCoupon(req.body, userId).then((response) => {
    // console.log(response);
    req.session.couponTotal = response.total;

    if (response.success) {
      res.json({ couponSuccess: true, total: response.total, discountpers: response.discoAmountpercentage });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else if (response.couponMaxLimit) {
      res.json({ couponMaxLimit: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  });
});
router.get('/orderSuccess', (req, res) => {
  const user = req.session.user
  userHelper.getorderProductSuccess(req.session.orderId).then((response) => {
    const orderDetails = response;
    res.render('user/order-successPage', { user, orderDetails })
  }).catch((err) => {
    console.log(err);
  })
})

// router.get('/ordersuccess',(req,res)=>{
//   res.render('user/order-placerd-success')
// })
router.get('/myOrders', verifyUserLogin, (req, res) => {
  const user = req.session.user
  userHelper.getAllOrders(req.session.user._id).then((response) => {
    const AllOrders = response
    // console.log(AllOrders);
    res.render('user/my-orders', { user, AllOrders })

  }).catch((err) => {
    console.log(err);
  })
})
router.get('/viewSingleOrderDetails/:id', verifyUserLogin, (req, res) => {
  userHelper.getSingleOrderdetails(req.params.id).then((response) => {
    const orderDetails = response;
    res.render('user/single-order-details', { layout: false, orderDetails })
  }).catch((err) => {
    console.log(err);
  })
})
router.post('/cancelOrder', (req, res) => {
  console.log('cancel  order post works');
  userHelper.cancelOrder(req.body).then((response) => {
    res.json({ status: true })
  }).catch((err) => {
    console.log(err);
  })
})


router.get('/filterPage', async (req, res) => {
  let cartCount = ''
  let wishListCount=''
  const user = req.session.user
  if (user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishListCount = await userHelper.getWishListCount(req.session.user._id)
  }
  let category = await adminHelper.getAllCategory()
  let brands = await adminHelper.getAllBrands()
  res.render('user/Shop', { cartCount, user, category, brands, filterResult })
})
router.get('/filterbrands/:id', (req, res) => {
  const brandFilter = req.params.id
  userHelper.filterBrands(brandFilter).then((result) => {
    filterResult = result
    res.redirect("/filterPage")
  })
})

router.get('/shop', (req, res) => {
  userHelper.getAllProducts().then(async (products) => {
    filterResult = products
    res.redirect('/filterPage')
  })
})



router.post('/search-filter', (req, res) => {
  let filter = req.body
  let price = parseInt(filter.Prize)
  let brandFilter = filter.Brand
  let categoryFilter = filter.Category


  userHelper.searchFilter(brandFilter, categoryFilter, price).then((result) => {

    filterResult = result
    res.json({ status: true })
  })
})

router.post("/search", async (req, res) => {
  let key = req.body.key;
  userHelper.getSearchProducts(key).then((response) => {
    filterResult = response
    res.redirect("/filterPage")
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
module.exports = router;






