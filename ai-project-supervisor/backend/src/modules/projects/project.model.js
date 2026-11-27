import mongoose from 'mongoose';
import {
  METHODOLOGY_VALUES,
  PROJECT_MODE_VALUES,
  PROJECT_STAGE,
  PROJECT_STAGE_VALUES
} from '../../shared/constants/statuses.js';

const { Schema } = mongoose;

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mode: {
      type: String,
      enum: PROJECT_MODE_VALUES,
      required: true
    },
    stage: {
      type: String,
      enum: PROJECT_STAGE_VALUES,
      default: PROJECT_STAGE.IDEA_DISCOVERY,
      required: true,
      index: true
    },
    methodology: {
      type: String,
      enum: [...METHODOLOGY_VALUES, null],
      default: null
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    selectedIdeaId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    baselineRequirementsId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    approvedTimelineId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    deadline: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: false, versionKey: false },
    toObject: { versionKey: false }
  }
);

projectSchema.index({ creatorId: 1, createdAt: -1 });

export const Project = mongoose.models.Project ?? mongoose.model('Project', projectSchema);
