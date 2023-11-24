const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  CategoryName: String,
});

const category = mongoose.model("category", categorySchema);

module.exports = category;
