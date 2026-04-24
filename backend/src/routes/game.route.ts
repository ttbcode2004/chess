import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { getMyGames, getGameById, getTopUsers } from "../controllers/game.controller";

const gameRouter = Router();

gameRouter.get("/", protect, getMyGames);
gameRouter.get("/leaderBoard", protect, getTopUsers);
gameRouter.get("/:id", protect, getGameById);

export default gameRouter;