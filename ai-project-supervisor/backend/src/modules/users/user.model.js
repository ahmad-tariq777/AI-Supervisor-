import mongoose from 'mongoose';
import { ROLE_VALUES, DEFAULT_ROLE } from '../../shared/constants/roles.js';

const MAX_SKILLS = 50;
const MAX_SKILL_LENGTH = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const profileSchema = new mongoose.Schema(
  {
    skills: {
      type: [{ type: String, trim: true, maxlength: MAX_SKILL_LENGTH }],
      default: [],
      validate: {
        validator: (skills) => skills.length <= MAX_SKILLS,
        message: `A profile can hold at most ${MAX_SKILLS} skills`
      }
    }
  },
  { _id: false }
);

const refreshSessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [EMAIL_PATTERN, 'Email address is not valid']
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: DEFAULT_ROLE,
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
    },
    profile: {
      type: profileSchema,
      default: () => ({})
    },
    refreshSessions: {
      type: [refreshSessionSchema],
      default: [],
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.refreshSessions;
        return ret;
      }
    },
    toObject: {
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.refreshSessions;
        return ret;
      }
    }
  }
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);