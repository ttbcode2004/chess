import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import Game from "../models/game.model";
import User from "../models/user.model";
import mongoose from "mongoose";
import { verifyToken } from '../libs/jwt.lib';
import logger from '../config/logger.config';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthedSocket extends WebSocket {
  userId:   string;
  username: string;
  gameId:   string | null;
}

interface ActiveGame {
  id:    string;
  chess: Chess;
  white: string;
  black: string;
  moves: string[];
}

interface Challenge {
  id:           string;
  from:         string;
  to:           string;
  fromUsername: string;
  timeControl:  string;
}

// ── State ─────────────────────────────────────────────────────────────────────
export const clients  = new Map<string, AuthedSocket>();
const activeGames     = new Map<string, ActiveGame>();
const challenges      = new Map<string, Challenge>();

// ── Helpers ───────────────────────────────────────────────────────────────────
function send(ws: WebSocket | undefined, data: object) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function sendToUser(userId: string, data: object) {
  send(clients.get(userId), data);
}
function broadcastGame(game: ActiveGame, data: object) {
  sendToUser(game.white, data);
  sendToUser(game.black, data);
}
function broadcastPresence(userId: string, online: boolean) {
  clients.forEach((ws, uid) => {
    if (uid !== userId) send(ws, { type: 'friend_presence', userId, online });
  });
}

// FIX: Normalise a Mongoose lean document into a plain player object.
// Previously the server sent the raw Mongoose object which has _id instead of id,
// and selected "avatarUrl" which doesn't exist in the schema (field is "avatar").
function toPlayer(doc: any) {
  return {
    id:       String(doc._id),       // ← was missing; frontend player.id was undefined
    username: doc.username,
    rating:   doc.rating,
    avatar:   doc.avatar ?? null,    // ← was "avatarUrl" which doesn't exist in schema
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (rawWs: WebSocket, req: IncomingMessage) => {
    const url   = new URL(req.url!, 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return rawWs.close(4001, 'Unauthorized');

    let payload;
    try { payload = verifyToken(token); }
    catch { return rawWs.close(4001, 'Invalid token'); }

    const ws    = rawWs as AuthedSocket;
    ws.userId   = payload.userId;
    ws.username = payload.username;
    ws.gameId   = null;

    clients.set(ws.userId, ws);
    broadcastPresence(ws.userId, true);
    send(ws, {
      type:    'online_users',
      userIds: Array.from(clients.keys()).filter(id => id !== ws.userId),
    });

    logger.info(`[WS] + ${ws.username} (${ws.userId})`);

    ws.on('message', async (raw) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      switch (msg.type) {
        case 'challenge':         await handleChallenge(ws, msg); break;
        case 'challenge_accept':  await handleChallengeAccept(ws, msg); break;
        case 'challenge_decline': handleChallengeDecline(ws, msg); break;
        case 'move':              await handleMove(ws, msg); break;
        case 'resign':            await handleResign(ws, msg); break;
        case 'draw_offer':        handleDrawOffer(ws, msg); break;
        case 'draw_response':     await handleDrawResponse(ws, msg); break;
        case 'chat_message':      handleChatMessage(ws, msg); break;
      }
    });

    ws.on('close', () => {
      clients.delete(ws.userId);
      broadcastPresence(ws.userId, false);
      logger.info(`[WS] - ${ws.username}`);
      if (ws.gameId) {
        const game = activeGames.get(ws.gameId);
        if (game) {
          const oppId = game.white === ws.userId ? game.black : game.white;
          sendToUser(oppId, { type: 'opponent_disconnected' });
        }
      }
    });
  });
}

// ── Handlers ──────────────────────────────────────────────────────────────────
async function handleChallenge(ws: AuthedSocket, msg: any) {
  const { toUserId, timeControl = '10+0' } = msg;
  if (!toUserId) return;
  if (!clients.get(toUserId)) return send(ws, { type: 'error', msg: 'That player is not online' });

  const challengeId = uuidv4();
  challenges.set(challengeId, { id: challengeId, from: ws.userId, to: toUserId, fromUsername: ws.username, timeControl });

  sendToUser(toUserId, { type: 'challenge_received', challengeId, from: { id: ws.userId, username: ws.username }, timeControl });
  send(ws, { type: 'challenge_sent', challengeId, toUserId });
}

async function handleChallengeAccept(ws: AuthedSocket, msg: any) {
  const challenge = challenges.get(msg.challengeId);
  if (!challenge || challenge.to !== ws.userId) return;
  challenges.delete(msg.challengeId);

  const [whiteId, blackId] = Math.random() > 0.5
    ? [challenge.from, challenge.to]
    : [challenge.to, challenge.from];

  // FIX: select "avatar" not "avatarUrl" — the schema field is called "avatar"
  const [wu, bu] = await Promise.all([
    User.findById(whiteId).select('username rating avatar').lean(),
    User.findById(blackId).select('username rating avatar').lean(),
  ]);
  if (!wu || !bu) return;

  const game = await Game.create({
    whiteId:     new mongoose.Types.ObjectId(whiteId),
    blackId:     new mongoose.Types.ObjectId(blackId),
    timeControl: challenge.timeControl,
    status:      'PLAYING',
    fen:         new Chess().fen(),
  });

  const ag: ActiveGame = {
    id:    game._id.toString(),
    chess: new Chess(),
    white: whiteId,
    black: blackId,
    moves: [],
  };
  activeGames.set(ag.id, ag);

  const wsW = clients.get(whiteId) as AuthedSocket | undefined;
  const wsB = clients.get(blackId) as AuthedSocket | undefined;
  if (wsW) wsW.gameId = ag.id;
  if (wsB) wsB.gameId = ag.id;

  // FIX: use toPlayer() so frontend receives { id, username, rating, avatar }
  // instead of the raw Mongoose object { _id, username, rating } with no avatar.
  const base = {
    type:        'game_start',
    gameId:      ag.id,
    fen:         ag.chess.fen(),
    white:       toPlayer(wu),
    black:       toPlayer(bu),
    timeControl: challenge.timeControl,
  };
  sendToUser(whiteId, { ...base, color: 'white' });
  sendToUser(blackId, { ...base, color: 'black' });
}

function handleChallengeDecline(ws: AuthedSocket, msg: any) {
  const c = challenges.get(msg.challengeId);
  if (!c) return;
  challenges.delete(msg.challengeId);
  sendToUser(c.from, { type: 'challenge_declined', challengeId: msg.challengeId, byUsername: ws.username });
}

async function handleMove(ws: AuthedSocket, msg: any) {
  const { gameId, from, to, promotion } = msg;
  const game = activeGames.get(gameId);
  if (!game) return;

  const turn  = game.chess.turn() === 'w' ? 'white' : 'black';
  const mover = game.white === ws.userId ? 'white' : 'black';
  if (turn !== mover) return send(ws, { type: 'error', msg: 'Not your turn' });

  let move;
  try { move = game.chess.move({ from, to, promotion: promotion || 'q' }); }
  catch { return send(ws, { type: 'error', msg: 'Invalid move' }); }
  if (!move) return send(ws, { type: 'error', msg: 'Invalid move' });

  game.moves.push(move.san);

  const packet: any = {
    type:       'move',
    from, to,
    san:        move.san,
    fen:        game.chess.fen(),
    turn:       game.chess.turn() === 'w' ? 'white' : 'black',
    moveNumber: Math.ceil(game.moves.length / 2),
    check:      game.chess.isCheck() && !game.chess.isGameOver(),
    promotion:  promotion || null,
  };

  if (game.chess.isGameOver()) {
    packet.check = false;
    let result: string, reason: string;
    if (game.chess.isCheckmate()) {
      result = mover; reason = 'Checkmate';
    } else {
      result = 'draw';
      reason = game.chess.isStalemate()           ? 'Stalemate'
             : game.chess.isInsufficientMaterial() ? 'Insufficient material'
             : game.chess.isThreefoldRepetition()  ? 'Threefold repetition'
             : 'Fifty-move rule';
    }
    packet.gameOver = { result, reason };
    await finishGame(game, result, reason);
  } else {
    await Game.findByIdAndUpdate(game.id, { fen: game.chess.fen(), pgn: game.chess.pgn() });
  }

  broadcastGame(game, packet);
}

async function handleResign(ws: AuthedSocket, msg: any) {
  const game = activeGames.get(msg.gameId);
  if (!game) return;
  const winner = game.white === ws.userId ? 'black' : 'white';
  broadcastGame(game, { type: 'game_over', result: winner, reason: 'Resignation' });
  await finishGame(game, winner, 'Resignation');
}

function handleDrawOffer(ws: AuthedSocket, msg: any) {
  const game = activeGames.get(msg.gameId);
  if (!game) return;
  sendToUser(game.white === ws.userId ? game.black : game.white, { type: 'draw_offer', gameId: msg.gameId });
}

async function handleDrawResponse(ws: AuthedSocket, msg: any) {
  const game = activeGames.get(msg.gameId);
  if (!game) return;
  if (msg.accept) {
    broadcastGame(game, { type: 'game_over', result: 'draw', reason: 'Agreement' });
    await finishGame(game, 'draw', 'Agreement');
  } else {
    sendToUser(game.white === ws.userId ? game.black : game.white, { type: 'draw_declined', gameId: msg.gameId });
  }
}

function handleChatMessage(ws: AuthedSocket, msg: any) {
  const game = activeGames.get(msg.gameId);
  if (!game) return;
  if (game.white !== ws.userId && game.black !== ws.userId) return;
  const text = String(msg.text ?? '').trim().slice(0, 300);
  if (!text) return;
  broadcastGame(game, { type: 'chat_message', from: ws.username, fromId: ws.userId, text, timestamp: Date.now() });
}

// ── Finish game ───────────────────────────────────────────────────────────────
async function finishGame(game: ActiveGame, result: string, reason: string) {
  activeGames.delete(game.id);
  const wsW = clients.get(game.white) as AuthedSocket | undefined;
  const wsB = clients.get(game.black) as AuthedSocket | undefined;
  if (wsW) wsW.gameId = null;
  if (wsB) wsB.gameId = null;

  await Game.findByIdAndUpdate(game.id, {
    status: 'COMPLETED', result, resultReason: reason,
    fen: game.chess.fen(), pgn: game.chess.pgn(),
  });

  const win  = { $inc: { gamesPlayed: 1, gamesWon: 1, rating: 10 } };
  const lose = { $inc: { gamesPlayed: 1, rating: -8 } };
  const draw = { $inc: { gamesPlayed: 1, rating: 2 } };

  if (result === 'white') {
    await Promise.all([User.findByIdAndUpdate(game.white, win), User.findByIdAndUpdate(game.black, lose)]);
  } else if (result === 'black') {
    await Promise.all([User.findByIdAndUpdate(game.black, win), User.findByIdAndUpdate(game.white, lose)]);
  } else {
    await Promise.all([User.findByIdAndUpdate(game.white, draw), User.findByIdAndUpdate(game.black, draw)]);
  }
}