const { response } = require('express');
const express = require('express');
const router = express.Router();
const adminHelper = require("../helpers/admin-helpers");
const admin = require('../models/admin');
const storage = require("../middleware/multer");
const { route } = require('.');


const verifyAdminLogin = async (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    req.session.adminLoggedIn = false;
    res.redirect('/admin')
  }

}


/* GET admin listing. */
router.get('/', function (req, res, next) {
  const admin = req.session.admin
  const adminLoginErr = req.session.adminLoginErr
  res.render('admin/admin_login', { admin: true,layout: false, adminLoginErr, admin });

});

router.get('/dashBoard',verifyAdminLogin, (req, res) => {
  res.render('admin/dashBoard', { admin: true, layout: false })
}) 
 
router.post('/adminLogin', (req, res) => {
  adminHelper.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin/dashBoard')
    }else {
      req.session.adminLoggedInErr = true
      req.session.adminLoginErr = 'Invalid Mail or Password'
      res.redirect('/admin')
    }
  })

})
router.get('/logout', (req, res) => {
  console.log("logout");
  req.session.destroy()
  res.redirect('/admin')
})

router.get('/viewUsers',verifyAdminLogin, (req, res) => {
  adminHelper.getAllUsers().then((users) => { 
    // const alert = req.flash('msg')

    res.render('admin/users', { layout: false, users })
  })
 
})
router.get('/BlockUser/:id', (req, res) => {
  const userId = req.params.id 
  adminHelper.blockUser(userId).then((response) => {
    req.flash({ msg: "you blocked The user" })
    res.redirect('/admin/viewUsers')
  })
})
router.get('/UnBlockUser/:id', (req, res) => {
  const userId = req.params.id
  adminHelper.unBlockUser(userId).then((response) => {
    res.redirect('/admin/viewUsers')
  })
})


router.get('/brand',verifyAdminLogin, (req, res) => {
  adminHelper.getAllBrands().then((brands) => {
    res.render('admin/brand', { admin: true, layout: false, brands })
  })

})
router.get('/addBrand',verifyAdminLogin,(req,res)=>{
  res.render('admin/add_brand',{admin: true, layout: false})
})

router.post('/addBrand',storage.single('image_1'),
 function(req, res, next) {
  const image_1=req.file.filename
  adminHelper.addABrand(req.body,image_1).then((response)=>{
    res.redirect('/admin/brand')  
  })
  .catch((error)=>{
    console.log('fahhhhh');
    res.redirect('/admin/addBrand')   
  })
})
router.get('/DeleteBrand/:id', (req, res) => {
  // const brandId = req.params.id;
  adminHelper.deleteBrand(req.params.id).then((response) => {
    res.redirect('/admin/brand')
  })
})
router.get('/categories',verifyAdminLogin, (req, res) => {
  adminHelper.getAllCategory().then((category) => {
    res.render('admin/categories', { admin: true, layout: false, category })
  })

})
router.post('/addCategory', (req, res) => {
  adminHelper.addACategory(req.body).then((response) => {

    res.redirect('/admin/categories')
  }).catch((error) => {
    console.log(error);
    res.redirect('/admin/categories')
  })
})
router.get('/DeleteCategory/:id', (req, res) => {
  // const brandId = req.params.id;
  adminHelper.deleteCategory(req.params.id).then((response) => {
    res.redirect('/admin/categories')
  })
})
router.get('/viewProducts',verifyAdminLogin, (req, res) => {
  adminHelper.getAllProducts().then((products) => {
    res.render('admin/products', { admin: true, layout: false, products })
  })
 
})
router.get('/addProduct',verifyAdminLogin, async (req, res) => {

  const brands = await adminHelper.getAllBrands();
  const category = await adminHelper.getAllCategory()
  res.render('admin/add_product', { admin: true, layout: false, brands, category })
})
router.post('/addProduct', storage.fields([
  { name: "image_1", maxCount: 1 },
  { name: "image_2", maxCount: 1 },
  { name: "image_3", maxCount: 1 },
  { name: "image_4", maxCount: 1 },
]),
  (req, res) => {
    const image_1 = req.files.image_1[0].filename;
    const image_2 = req.files.image_2[0].filename;
    const image_3 = req.files.image_3[0].filename;
    const image_4 = req.files.image_4[0].filename;
    adminHelper.addAProduct(req.body, image_1, image_2, image_3, image_4).then((response) => {
      console.log(response);
      // req.flash("msg", "Product added successfully")
      res.redirect('/admin/viewProducts')
    })
  })
router.get('/DeleteProduct/:id', (req, res) => {
  adminHelper.deleteProduct(req.params.id).then((response) => {
    res.redirect('/admin/viewProducts')
  })
})
router.get('/EditProduct/:id', async (req, res) => {
  const product = await adminHelper.getProductDetails(req.params.id);
  console.log(product);
  const brands = await adminHelper.getAllBrands();
  console.log(brands)
  const category = await adminHelper.getAllCategory();
  console.log(category)

  res.render('admin/edit_product', { admin: true, layout: false, brands, category, product })
})
router.post('/EditProduct/:id', storage.fields([
  { name: "image_1", maxCount: 1 },
  { name: "image_2", maxCount: 1 },
  { name: "image_3", maxCount: 1 },
  { name: "image_4", maxCount: 1 },
]),
  (req, res) => {
    const productId = req.params.id
    const image_1 = req.files.image_1
      ? req.files.image_1[0].filename
      : req.body.image_1;
    const image_2 = req.files.image_2
      ? req.files.image_2[0].filename
      : req.body.image_2;
    const image_3 = req.files.image_3
      ? req.files.image_3[0].filename
      : req.body.image_3;
    const image_4 = req.files.image_4
      ? req.files.image_4[0].filename
      : req.body.image_4;  
    adminHelper.updateProduct(req.body, productId, image_1, image_2, image_3, image_4).then((response) => {
      res.redirect('/admin/viewProducts')
    })
  })
  router.get('/viewOrders',verifyAdminLogin,(req,res)=>{ 
    adminHelper.getEveryOrders({}).then((response)=>{
      const EveryOrders=response 
      res.render('admin/orders',{admin: true,layout:false, EveryOrders})
    })
    
  })  
  router.get('/viewOrderDetails/:id',verifyAdminLogin,(req,res)=>{
    adminHelper.getOrderDetails(req.params.id).then((response)=>{
      const orderDetails=response
      res.render('admin/order-details',{admin:true,orderDetails})

    })
    
  })
  router.post('/changeOrderStatus',(req,res)=>{
    adminHelper.changeOrderStatus(req.body).then((response)=>{
      res.redirect('/admin/viewOrders')
    })
  })
  router.get('/viewCoupons',verifyAdminLogin,(req,res)=>{
    adminHelper.getAllCoupons().then((response)=>{
      const AllCoupons=response
      res.render('admin/coupons',{admin:true,layout:false,AllCoupons})
    })
  })
  router.get('/addCoupon',verifyAdminLogin,(req,res)=>{
    res.render('admin/add_coupon',{admin:true,layout:false})
  })
  router.post('/addCoupon',(req,res)=>{
    adminHelper.addCoupon(req.body).then(()=>{
      res.redirect('/admin/viewCoupons')
    })
  })
  router.get('/DeleteCoupon/:id', (req, res) => {
    adminHelper.deleteCoupon(req.params.id).then((response) => {
      res.redirect('/admin/viewCoupons')
    })
  })

  // check

  // router.post('/getData', async (req, res) => {
    
  //   const date = new Date(Date.now());
  //   const month = date.toLocaleString("default", { month: "long" });   
  //   adminHelper.salesReport(req.body).then((data) => { 
  
  //     let pendingAmount = data.pendingAmount
  //     let salesReport = data.salesReport
  //     let brandReport = data.brandReport
  //     let orderCount = data.orderCount
  //     let totalAmountPaid = data.totalAmountPaid
  //     // let totalAmountRefund = data.totalAmountRefund
  
  //     let dateArray = [];
  //     let totalArray = [];
  //     // console.log(salesReport);
  //     salesReport.forEach((s) => {
  //       dateArray.push(`${month}-${s._id} `);
  //       totalArray.push(s.total);
  //     })
  //     let brandArray = [];
  //     let sumArray = [];
  //     brandReport.forEach((s) => {
  //       brandArray.push(s._id);
  //       sumArray.push(s.totalAmount);   
  //     });
  //     console.log("", brandArray);
  //     // console.log("", sumArray);
  //     // console.log("", dateArray);
  //     console.log("", totalArray);
  //     res.json({ dateArray, totalArray,brandArray, sumArray, orderCount, totalAmountPaid, pendingAmount })
  //   })
  // })
                                 










  
module.exports = router;
