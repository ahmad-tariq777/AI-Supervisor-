import mongoose from 'mongoose';

const { Schema } = mongoose;

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const teamSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true
    },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    members: {
      type: [memberSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: false, versionKey: false },
    toObject: { versionKey: false }
  }
);

teamSchema.index({ 'members.userId': 1 });

export const Team = mongoose.models.Team ?? mongoose.model('Team', teamSchema);
