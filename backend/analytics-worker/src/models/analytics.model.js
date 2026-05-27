import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    code: {
      type:     String,
      required: true,
    },
    date: {
      type:     Date,
      required: true,
    },
    totalClicks: {
      type:    Number,
      default: 0,
    },
    byBrowser: {
      type:    Map,
      of:      Number,
      default: {},
    },
    byOs: {
      type:    Map,
      of:      Number,
      default: {},
    },
    byDevice: {
      type:    Map,
      of:      Number,
      default: {},
    },
    byReferer: {
      type:    Map,
      of:      Number,
      default: {},
    },
    byCountry: {
      type:    Map,
      of:      Number,
      default: {},
    },
  }
);

analyticsSchema.index({ code: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
