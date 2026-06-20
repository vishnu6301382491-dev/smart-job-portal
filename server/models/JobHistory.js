import mongoose from "mongoose";

const jobHistorySchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    changes: {
      type: [
        {
          field: { type: String, required: true },
          before: { type: mongoose.Schema.Types.Mixed },
          after: { type: mongoose.Schema.Types.Mixed },
        },
      ],
      default: [],
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const JobHistory = mongoose.model("JobHistory", jobHistorySchema);

export default JobHistory;
