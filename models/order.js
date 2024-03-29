const Mongoose = require("mongoose");

const orderSchema = new Mongoose.Schema({
  user_Id: { type: Mongoose.Schema.Types.ObjectId, ref: "user" },
  paymentMethod: { type: String },
  coupondiscountedPrice: { type: Number, default: 0 },
  couponPercent: { type: Number, default: 0 },
  couponName: { type: String },
  PaidAmount: { type: Number },
  reFund: { type: Number, default: 0 },

  product: [
    {
      pro_id: { type: Mongoose.Schema.Types.ObjectId, ref: "product" },
      price: { type: Number },
      quantity: { type: Number, default: 1 },
      subtotal: { type: Number, default: 0 },
      status: { type: String, default: "Ordered" },
      orderCancelled: { type: Boolean, default: false },
      productName: { type: String },
    },
  ],
  deliveryDetails: {
    name: String,
    number: String,
    email: String,
    house: String,
    localplace: String,
    town: String,
    district: String,
    state: String,
    pincode: Number,
  },
  Total: { type: Number, default: 0 },
  ShippingCharge: { type: Number },
  grandTotal: { type: Number, default: 0 },
  ordered_on: { type: Date },
  payment_status: { type: String },
});
const order = Mongoose.model("order", orderSchema);

module.exports = order;
