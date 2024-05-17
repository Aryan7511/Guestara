import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique:true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  taxApplicability: { type: Boolean, default: false, required: true },
  tax: {
    type: Number,
  },
  taxType: { type: String, enum: ['Percentage', 'Fixed'] },
  baseAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

const Item = mongoose.model('Item', itemSchema);

export default Item;
