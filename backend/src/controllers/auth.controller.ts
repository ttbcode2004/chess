import { Request, Response } from "express";
import User from "../models/user.model";
import { signToken } from "../libs/jwt.lib";

export const register = async (req: Request, res: Response) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    email = email.toLowerCase().trim();

    if (username.length < 3 || username.length > 20)
      return res.status(400).json({ error: "Username must be 3-20 characters" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const user = new User({ username, email, password });
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  const user = req.user!;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  res.json({
    success: true,
    data: user,
  });
};