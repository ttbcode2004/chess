import { Request, Response } from "express";
import User from "../models/user.model";
import { clients } from "../libs/socket.lib";

// GET /api/users/search?q=username
export const searchUser = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    const users = await User.find({
      username: { $regex: q, $options: "i" }, // không phân biệt hoa thường
    })
      .select("username email avatarUrl") // không trả password
      .limit(10) // tránh spam
      .lean();

    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id)
      .select("username email avatarUrl createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/users/online
export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    
    const me = req.userId;

    const onlineIds = Array.from(clients.keys())
      .filter(id => id !== me); // ❗ loại chính mình

    if (onlineIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $in: onlineIds },
    })
      .select("username avatar rating")
      .lean();

    return res.json({
      success: true,
      data: users.map(u => ({
        id: u._id,
        username: u.username,
        avatar: u.avatar,
        rating: u.rating,
      })),
    });

  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};