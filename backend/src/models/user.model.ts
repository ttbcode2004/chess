import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;

  rating: number;
  gamesPlayed: number;
  gamesWon: number;

  comparePassword(candidatePassword: string): Promise<boolean>;
}
const UserSchema: Schema<IUser> = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default:"https://res.cloudinary.com/diloik8rc/image/upload/v1776929477/avatardefault_92824_e4b33a.webp" },
    rating: {type: Number, default: 1000},
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 }
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;