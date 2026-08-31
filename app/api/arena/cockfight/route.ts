import { NextRequest, NextResponse } from "next/server";
import { simulateCockFightMatch, RoosterCorner, CockFightMatchResult } from "@/lib/serverCockFightEngine";

export interface ArenaWaitingRoom {
  roomId: string;
  stake: number;
  hostPlayerId: string;
  hostName: string;
  hostCorner: RoosterCorner;
  challengerPlayerId?: string;
  challengerName?: string;
  challengerCorner?: RoosterCorner;
  status: "WAITING" | "MATCHED" | "EXPIRED" | "CANCELLED";
  createdAt: number;
  matchStartAt?: number;
  matchResult?: CockFightMatchResult;
}

// Global in-memory multi-client room registry
const arenaRooms: Map<string, ArenaWaitingRoom> = new Map();

// Periodic cleanup of stale rooms older than 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of arenaRooms.entries()) {
    if (now - room.createdAt > 300000) {
      arenaRooms.delete(id);
    }
  }
}, 60000);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomId, playerId, playerName, stake, corner } = body;

    // 1. LIST ACTIVE OPEN WAITING TABLES
    if (action === "LIST_ROOMS") {
      const openRooms: ArenaWaitingRoom[] = [];
      for (const room of arenaRooms.values()) {
        if (room.status === "WAITING" && Date.now() - room.createdAt < 120000) {
          openRooms.push(room);
        }
      }
      return NextResponse.json({ success: true, rooms: openRooms });
    }

    // 2. JOIN OR CREATE 1v1 MATCH QUEUE
    if (action === "JOIN_QUEUE") {
      const stakeNum = Number(stake) || 100;
      const playerCorner: RoosterCorner = corner === "BLUE" ? "BLUE" : "RED";
      const pId = playerId || `player_${Math.random().toString(36).substring(2, 7)}`;
      const pName = playerName || `Gladiator_${pId.slice(-4)}`;

      // Check if there is an existing waiting room for this exact stake created by a DIFFERENT player
      let matchedRoom: ArenaWaitingRoom | null = null;
      for (const room of arenaRooms.values()) {
        if (
          room.status === "WAITING" &&
          room.stake === stakeNum &&
          room.hostPlayerId !== pId &&
          Date.now() - room.createdAt < 120000
        ) {
          matchedRoom = room;
          break;
        }
      }

      if (matchedRoom) {
        // MATCH FOUND! Player 2 enters the room as the challenger
        const challengerCorner: RoosterCorner = matchedRoom.hostCorner === "RED" ? "BLUE" : "RED";
        matchedRoom.challengerPlayerId = pId;
        matchedRoom.challengerName = pName;
        matchedRoom.challengerCorner = challengerCorner;
        matchedRoom.status = "MATCHED";
        matchedRoom.matchStartAt = Date.now() + 1500;

        // Generate authoritative combat simulation
        const matchResult = simulateCockFightMatch(stakeNum, matchedRoom.hostCorner);
        matchedRoom.matchResult = matchResult;

        return NextResponse.json({
          success: true,
          status: "MATCHED",
          room: matchedRoom,
          matchResult,
        });
      } else {
        // NO WAITING OPPONENT: Create a new Waiting Room
        const newRoomId = `ROOM_${stakeNum}_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 899 + 100)}`;
        const newRoom: ArenaWaitingRoom = {
          roomId: newRoomId,
          stake: stakeNum,
          hostPlayerId: pId,
          hostName: pName,
          hostCorner: playerCorner,
          status: "WAITING",
          createdAt: Date.now(),
        };

        arenaRooms.set(newRoomId, newRoom);

        return NextResponse.json({
          success: true,
          status: "WAITING",
          room: newRoom,
        });
      }
    }

    // 3. POLL WAITING ROOM STATUS (Called every 1s by host)
    if (action === "POLL_ROOM") {
      if (!roomId || !arenaRooms.has(roomId)) {
        return NextResponse.json({ success: false, status: "NOT_FOUND", error: "Room not found or expired" });
      }

      const room = arenaRooms.get(roomId)!;
      return NextResponse.json({
        success: true,
        status: room.status,
        room,
        matchResult: room.matchResult || null,
      });
    }

    // 4. CANCEL & REFUND WAITING ROOM
    if (action === "CANCEL_ROOM") {
      if (roomId && arenaRooms.has(roomId)) {
        const room = arenaRooms.get(roomId)!;
        room.status = "CANCELLED";
        arenaRooms.delete(roomId);
      }
      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Cock fight arena queue error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
