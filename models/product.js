const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const productSchema = new Schema({
    ProductName: String,
    Brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'brand',
        require: true
    },
    Processor: String,
    ProcessorName: String, 
    Category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        require: true
    }, 
    ScreenSize:String,
    StorageType: String,
    StorageCapacity:String,     
    Ram:String, 
    MRP: Number,
    Discount: Number,
    Price: Number, 
    OperatingSystem: String,
    OperatingSystemName: String,
    Warranty: String,
    Stock: Number,
    ItemsInPackage: String,
    Color: String,
    SuitableFor: String,   
    FingerPrint: String,
    Battery: String,
    Weight: String,
    ShortDescription: String,
    Description: String, 
    AdditionalFeatures: String,
    Image: {
        type: Array
    }
    
    
    

})

 
const product = mongoose.model('product', productSchema)

module.exports = product 