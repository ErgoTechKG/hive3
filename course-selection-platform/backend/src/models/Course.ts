import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICourse extends Document {
  courseId: string;
  nameCn: string;
  nameEn: string;
  descriptionCn: string;
  descriptionEn: string;
  professor: Types.ObjectId;
  credits: number;
  capacity: number;
  enrolled: number;
  semester: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
  }[];
  prerequisites: string[];
  tags: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  syllabusCn?: string;
  syllabusEn?: string;
  materials: {
    title: string;
    type: 'book' | 'paper' | 'video' | 'other';
    url?: string;
    required: boolean;
  }[];
  assessments: {
    type: 'exam' | 'project' | 'assignment' | 'participation';
    weight: number;
    description: string;
  }[];
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  courseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nameCn: {
    type: String,
    required: true
  },
  nameEn: {
    type: String,
    required: true
  },
  descriptionCn: {
    type: String,
    required: true
  },
  descriptionEn: {
    type: String,
    required: true
  },
  professor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  credits: {
    type: Number,
    required: true,
    min: 0.5,
    max: 6
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  enrolled: {
    type: Number,
    default: 0
  },
  semester: {
    type: String,
    required: true
  },
  schedule: [{
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    }
  }],
  prerequisites: [String],
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  syllabusCn: String,
  syllabusEn: String,
  materials: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['book', 'paper', 'video', 'other'],
      required: true
    },
    url: String,
    required: {
      type: Boolean,
      default: false
    }
  }],
  assessments: [{
    type: {
      type: String,
      enum: ['exam', 'project', 'assignment', 'participation'],
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      required: true
    }
  }],
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  publishedAt: Date
}, {
  timestamps: true
});

// Validate assessments weights sum to 100
CourseSchema.pre('save', function(next) {
  if (this.assessments && this.assessments.length > 0) {
    const totalWeight = this.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
    if (totalWeight !== 100) {
      return next(new Error('Assessment weights must sum to 100'));
    }
  }
  next();
});

// Create indexes
CourseSchema.index({ professor: 1 });
CourseSchema.index({ status: 1, semester: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ nameCn: 'text', nameEn: 'text', descriptionCn: 'text', descriptionEn: 'text' });

export default mongoose.model<ICourse>('Course', CourseSchema);