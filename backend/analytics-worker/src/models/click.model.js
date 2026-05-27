import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    code: {
      type:     String,
      required: true,
      index:    true,
    },
    originalUrl: {
      type:     String,
      required: true,
    },
    ip: {
      type:    String,
      default: '',
    },
    browser: {
      type:    String,
      default: 'Unknown',
    },
    os: {
      type:    String,
      default: 'Unknown',
    },
    device: {
      type:    String,
      default: 'desktop',
    },
    referer: {
      type:    String,
      default: '',
    },
    country: {
      type:    String,
      default: '',
    },
    clickedAt: {
      type:    Date,
      default: Date.now,
    },
  }
);

clickSchema.index({ code: 1, clickedAt: -1 });

const Click = mongoose.model('Click', clickSchema);

export default Click;
