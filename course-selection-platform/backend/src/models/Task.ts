import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  title: string;
  description: string;
  type: 'read' | 'action' | 'approval';
  sender: Types.ObjectId;
  receivers: Types.ObjectId[];
  deadline?: Date;
  status: 'pending' | 'read' | 'in_progress' | 'completed' | 'overdue' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedCourse?: Types.ObjectId;
  attachments: {
    filename: string;
    url: string;
    uploadedAt: Date;
  }[];
  responses: {
    userId: Types.ObjectId;
    status: 'read' | 'completed' | 'rejected';
    message?: string;
    attachments?: {
      filename: string;
      url: string;
    }[];
    respondedAt: Date;
  }[];
  reminders: {
    sentAt: Date;
    level: 'gentle' | 'normal' | 'urgent';
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['read', 'action', 'approval'],
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  deadline: Date,
  status: {
    type: String,
    enum: ['pending', 'read', 'in_progress', 'completed', 'overdue', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  relatedCourse: {
    type: Schema.Types.ObjectId,
    ref: 'Course'
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['read', 'completed', 'rejected'],
      required: true
    },
    message: String,
    attachments: [{
      filename: String,
      url: String
    }],
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reminders: [{
    sentAt: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['gentle', 'normal', 'urgent'],
      default: 'normal'
    }
  }],
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Check for overdue tasks
TaskSchema.pre('save', function(next) {
  if (this.deadline && this.status === 'pending' && new Date() > this.deadline) {
    this.status = 'overdue';
  }
  next();
});

// Create indexes
TaskSchema.index({ sender: 1, status: 1 });
TaskSchema.index({ receivers: 1, status: 1 });
TaskSchema.index({ deadline: 1 });
TaskSchema.index({ priority: 1, status: 1 });
TaskSchema.index({ createdAt: -1 });

export default mongoose.model<ITask>('Task', TaskSchema);