import { Request, Response } from "express";
import Game from "../models/game.model";
import User from "../models/user.model";

// GET /api/games
export const getMyGames = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const games = await Game.find({
      $and: [
        { $or: [{ whiteId: userId }, { blackId: userId }] },
        { status: "COMPLETED" },
      ],
    })
      .populate("whiteId", "username rating avatar")
      .populate("blackId", "username rating avatar")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    const formatted = games.map((g) => ({
      id: g._id,
      fen: g.fen,
      pgn: g.pgn,
      status: g.status,
      result: g.result,
      resultReason: g.resultReason,
      timeControl: g.timeControl,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      white: g.whiteId,
      black: g.blackId,
    }));

    return res.json({ games: formatted });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/games/:id
export const getGameById = async (req: Request, res: Response) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("whiteId", "username rating avatar")
      .populate("blackId", "username rating avatar")
      .lean();

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const formatted = {
      id: game._id,
      fen: game.fen,
      pgn: game.pgn,
      status: game.status,
      result: game.result,
      resultReason: game.resultReason,
      timeControl: game.timeControl,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      white: game.whiteId,
      black: game.blackId,
    };

    return res.json({ game: formatted });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
};

export const getTopUsers = async (req: Request, res: Response) => {
  // const limit = Number(req.query.limit) || 10;

  const users = await User.find()
    .sort({ gamesWon: -1 })
    // .limit(limit)
    .select("username avatar rating gamesPlayed gamesWon")
    .lean();

  const ranked = users.map((u, i) => {
    const winRate =
      u.gamesPlayed > 0
        ? Math.round((u.gamesWon / u.gamesPlayed) * 100)
        : 0;

    return {
      id: u._id.toString(),
      username: u.username,
      avatar: u.avatar,
      rating: u.rating,
      gamesPlayed: u.gamesPlayed,
      gamesWon: u.gamesWon,
      winRate,
      rank: i + 1,
    };
  });

  return res.json({
    success: true,
    data: ranked,
  });
};