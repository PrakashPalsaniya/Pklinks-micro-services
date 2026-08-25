import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    code: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
      index:    true,
    },
    originalUrl: {
      type:     String,
      required: true,
      trim:     true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    title: {
      type:    String,
      trim:    true,
      default: '',
    },
    expiresAt: {
      type:    Date,
      default: null,
    },
    clicks: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true, collection: 'urls' }
);

urlSchema.index({ userId: 1, createdAt: -1 });

export const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);
export default Url;
