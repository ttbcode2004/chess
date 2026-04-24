import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", protect, me);