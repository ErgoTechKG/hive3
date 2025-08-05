import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  semester: string;
  preferences: {
    courseId: Types.ObjectId;
    rank: number;
    reason?: string;
  }[];
  status: 'pending' | 'selected' | 'confirmed' | 'rejected' | 'waitlisted' | 'dropped';
  selectedAt?: Date;
  confirmedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
  professorApproval?: {
    approved: boolean;
    approvedBy: Types.ObjectId;
    approvedAt: Date;
    comment?: string;
  };
  finalGrade?: number;
  attendance?: {
    total: number;
    attended: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  preferences: [{
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    rank: {
      type: Number,
      required: true,
      min: 1
    },
    reason: String
  }],
  status: {
    type: String,
    enum: ['pending', 'selected', 'confirmed', 'rejected', 'waitlisted', 'dropped'],
    default: 'pending'
  },
  selectedAt: Date,
  confirmedAt: Date,
  rejectedAt: Date,
  rejectedReason: String,
  professorApproval: {
    approved: Boolean,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comment: String
  },
  finalGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  attendance: {
    total: {
      type: Number,
      default: 0
    },
    attended: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate enrollments
EnrollmentSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

// Other indexes
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ semester: 1 });
EnrollmentSchema.index({ 'preferences.rank': 1 });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);