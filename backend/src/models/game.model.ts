import mongoose, { Schema, Document } from "mongoose";

export interface IGame extends Document {
  fen: string;
  pgn?: string;
  status: "PLAYING" | "COMPLETED";
  result?: string;
  resultReason?: string;
  timeControl?: string;
  whiteId: mongoose.Types.ObjectId;
  blackId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    fen: { type: String, required: true },
    pgn: String,
    status: { type: String, enum: ["PLAYING", "COMPLETED"], required: true },
    result: String,
    resultReason: String,
    timeControl: String,
    whiteId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blackId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IGame>("Game", GameSchema);