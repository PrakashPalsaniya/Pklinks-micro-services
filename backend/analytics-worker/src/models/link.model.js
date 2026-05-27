import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
  code: String,
  clicks: Number,
});

export default mongoose.models.Url || mongoose.model('Url', linkSchema);
