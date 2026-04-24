import { Router } from "express";
import { getOnlineUsers, getUser, searchUser } from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";

export const userRouter = Router();
userRouter.get("/search", searchUser);
userRouter.get("/getUser/:id", getUser);
userRouter.get("/getOnlineUsers",protect, getOnlineUsers);