const bcrypt = require("bcrypt");
const { promise, reject } = require("bcrypt/promises");
const async = require("hbs/lib/async");
const adminData = require("../models/admin");
const userData = require("../models/user");
const brandData = require("../models/brand");
const categoryData = require("../models/category");
const productData = require("../models/product");
const orderData = require("../models/order");
const couponData = require("../models/coupon");
const { Promise, default: mongoose } = require("mongoose");

module.exports = {
  doAdminLogin: (adminDataa) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await adminData.findOne({ email: adminDataa.email });
      if (admin) {
        bcrypt.compare(adminDataa.password, admin.password).then((result) => {
          if (result) {
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            response.status = false;
            resolve(response);
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      const users = await userData.find().lean();
      resolve(users);
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userData.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: true } },
        { upsert: true }
      );
      resolve(user);
    });
  },
  unBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userData.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: false } },
        { upsert: true }
      );
      resolve(user);
    });
  },
  addABrand: (Data, image_1) => {
    return new Promise(async (resolve, reject) => {
      const brandnames = Data.brand;
      const brand = await brandData.findOne({ BrandName: brandnames });
      if (brand) {
        reject({ status: false, msg: "this brand is already added" });
      } else {
        const addBrand = await new brandData({
          BrandName: brandnames,
          Image: image_1,
        });
        await addBrand.save(async (err, result) => {
          if (err) {
            reject({ msg: "brand not added" });
          } else {
            resolve({ result, msg: "brand added" });
          }
        });
      }
    });
  },
  getAllBrands: () => {
    return new Promise(async (resolve, reject) => {
      const brands = await brandData.find().lean();
      resolve(brands);
    });
  },
  deleteBrand: (brandId) => {
    return new Promise(async (resolve, reject) => {
      const deletebrand = await brandData.findOneAndDelete({ _id: brandId });
      resolve(deletebrand);
    });
  },
  addACategory: (Data) => {
    return new Promise(async (resolve, reject) => {
      const category = await categoryData.findOne({
        CategoryName: Data.category,
      });
      if (category) {
        reject({ status: false, msg: "this category is already added" });
      } else {
        const addCategory = await new categoryData({
          CategoryName: Data.category,
        });
        await addCategory.save(async (err, result) => {
          if (err) {
            reject({ msg: "category not added" });
          } else {
            resolve({ result, msg: "category added" });
          }
        });
      }
    });
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      const category = await categoryData.find({}).lean();
      resolve(category);
    });
  },
  deleteCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      const deletecategory = await categoryData.findOneAndDelete({
        _id: categoryId,
      });
      resolve(deletecategory);
    });
  },
  addAProduct: (Data, image_1, image_2, image_3, image_4) => {
    MRP = parseInt(Data.MRP);
    discount = parseInt(Data.discount);
    Data.price = MRP - (MRP * discount * 0.01).toFixed(0);
    return new Promise(async (resolve, reject) => {
      const product = await productData.findOne({
        ProductName: Data.productname,
      });
      const category = await categoryData.findOne({
        CategoryName: Data.category,
      });
      const brand = await brandData.findOne({ BrandName: Data.brand });

      if (product) {
        reject({ status: false, msg: "this product  is already added" });
      } else {
        const newProduct = await new productData({
          ProductName: Data.productname,
          Brand: brand._id,
          Processor: Data.processorType,
          ProcessorName: Data.processorName,
          Category: category._id,
          ScreenSize: Data.screenSize,
          StorageType: Data.storageType,
          StorageCapacity: Data.storageCapacity,
          Ram: Data.ram,
          MRP: Data.MRP,
          Discount: Data.discount,
          Price: Data.price,
          OperatingSystem: Data.operatingSystem,
          OperatingSystemName: Data.operatingSystemName,
          Warranty: Data.warranty,
          Stock: Data.stock,
          ItemsInPackage: Data.inBox,
          Color: Data.color,
          SuitableFor: Data.suitable,
          FingerPrint: Data.fingerPrintSesnsor,
          Battery: Data.battery,
          Weight: Data.weight,
          ShortDescription: Data.description1,
          Description: Data.description2,
          AdditionalFeatures: Data.additionalFeatures,
          Image: { image_1, image_2, image_3, image_4 },
        });
        await newProduct.save(async (err, result) => {
          if (err) {
            reject({ msg: "product not added" });
          } else {
            resolve({ result, msg: "Product added" });
          }
        });
      }
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      const products = await productData.find({}).lean();
      resolve(products);
    });
  },
  deleteProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      const deleteproduct = await productData.findOneAndDelete({
        _id: productId,
      });
      resolve(deleteproduct);
    });
  },
  getProductDetails: (productId) => {
    return new Promise(async (resolve, reject) => {
      const productdetails = await productData
        .findOne({ _id: productId })
        .lean()
        .then((productdetails) => {
          resolve(productdetails);
        });
    });
  },
  updateProduct: (Data, productId, image_1, image_2, image_3, image_4) => {
    const id = mongoose.Types.ObjectId(productId);
    return new Promise(async (resolve, reject) => {
      const category = await categoryData.findOne({
        CategoryName: Data.category,
      });
      const brand = await brandData.findOne({ BrandName: Data.brand });
      const updateproduct = await productData.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            ProductName: Data.productname,
            Brand: brand._id,
            Processor: Data.processorType,
            ProcessorName: Data.processorName,
            Category: category._id,
            ScreenSize: Data.screenSize,
            StorageType: Data.storageType,
            StorageCapacity: Data.storageCapacity,
            Ram: Data.ram,
            MRP: Data.MRP,
            Price: Data.price,
            Discount: Data.discount,
            OperatingSystem: Data.operatingSystem,
            OperatingSystemName: Data.operatingSystemName,
            Warranty: Data.warranty,
            Stock: Data.stock,
            ItemsInPackage: Data.inBox,
            Color: Data.color,
            SuitableFor: Data.suitable,
            FingerPrint: Data.fingerPrintSesnsor,
            Battery: Data.battery,
            Weight: Data.weight,
            ShortDescription: Data.description1,
            Description: Data.description2,
            AdditionalFeatures: Data.additionalFeatures,
            Image: { image_1, image_2, image_3, image_4 },
          },
        }
      );
      resolve(updateproduct);
    });
  },
  getEveryOrders: () => {
    return new Promise(async (resolve, reject) => {
      const EveryOrders = await orderData
        .find()
        .populate("product.pro_id")
        .lean();
      resolve(EveryOrders);
    });
  },
  getOrderDetails: (orderId) => {
    const id = mongoose.Types.ObjectId(orderId);
    return new Promise(async (resolve, reject) => {
      const orderDetails = await orderData
        .findOne({ _id: id })
        .populate("product.pro_id")
        .lean();
      resolve(orderDetails);
    });
  },
  changeOrderStatus: (Data) => {
    return new Promise(async (resolve, reject) => {
      const changeStatus = await orderData.findOneAndUpdate(
        { _id: Data.orderId, "product._id": Data.productId },
        {
          $set: { "product.$.status": Data.orderStatus },
        }
      );
      resolve();
    });
  },
  addCoupon: (Data) => {
    return new Promise(async (resolve, reject) => {
      const newCoupon = new couponData({
        couponName: Data.couponName,
        couponCode: Data.CoupoCode,
        limit: Data.Limit,
        expirationTime: Data.ExpireDate,
        discount: Data.discount,
      });
      await newCoupon.save();
      resolve();
    });
  },
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      const AllCoupons = await couponData.find({}).lean();
      resolve(AllCoupons);
    });
  },
  deleteCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      const deleteCoupon = await couponData.findOneAndDelete({ _id: couponId });
      resolve(deleteCoupon);
    });
  },
  // salesReport: (data) => {
  //   let response = {}
  //   let { startDate, endDate } = data

  //   let d1, d2, text;
  //   if (!startDate || !endDate) {
  //     d1 = new Date();
  //     d1.setDate(d1.getDate() - 7);
  //     d2 = new Date();
  //     text = "For the Last 7 days";
  //   } else {
  //     d1 = new Date(startDate);
  //     d2 = new Date(endDate);
  //     text = `Between ${startDate} and ${endDate}`;
  //   }

  //   // Date wise sales report
  //   const date = new Date(Date.now());
  //   const month = date.toLocaleString("default", { month: "long" });

  //   return new Promise(async (resolve, reject) => {

  //     let salesReport = await orderData.aggregate([

  //       {
  //         $match: {
  //           ordered_on: {
  //             $lt: d2,
  //             $gte: d1,
  //           },
  //         },
  //       },
  //       {
  //         $match: { payment_status: 'placed' }
  //       },
  //       {
  //         $group: {
  //           _id: { $dayOfMonth: "$ordered_on" },
  //           total: { $sum: "$grandTotal" },
  //         },
  //       },
  //     ])
  //     let brandReport = await orderData.aggregate([
  //       {
  //         $match: { payment_status: 'placed' }
  //       },
  //       {
  //         $unwind: "$product",
  //       },
  //       {
  //         $project: {
  //           brand: "$product.ProductName",
  //           quantity: "$product.quantity"
  //         }
  //       },

  //       {
  //         $group: {
  //           _id: '$brand',
  //           totalAmount: { $sum: "$quantity" },

  //         }
  //       },
  //       { $sort: { quantity: -1 } },
  //       { $limit: 5 },

  //     ])

  //     let orderCount = await orderData.find({ date: { $gt: d1, $lt: d2 } }).count()
  //     let totalAmounts = await orderData.aggregate([
  //       {
  //         $match: { status: 'placed' }
  //       },
  //       {
  //         $group:
  //         {
  //           _id: null,
  //           totalAmount: { $sum: "$reFund" }

  //         }
  //       }
  //     ])

  //     response.salesReport = salesReport
  //     response.brandReport = brandReport
  //     response.orderCount = orderCount
  //     response.totalAmountPaid = totalAmounts.totalAmount
  //     // response.totalAmountRefund=totalAmountRefund.totalAmount

  //     resolve(response)
  //   })

  // }
};
