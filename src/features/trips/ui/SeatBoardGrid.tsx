import { Pressable, Text, View } from "react-native";
import type { BoardSeat, TripBoard } from "../core/entities/board";

// Renders the operator seat board as a positioned grid. Booked seats are
// tappable (to open the boarding actions); driver/blocked/available are static.

interface SeatBoardGridProps {
  board: TripBoard;
  selectedSeat: number | null;
  onSelectSeat: (seat: BoardSeat) => void;
}

function seatTone(seat: BoardSeat): string {
  if (seat.state === "driver") return "bg-surface-alt border-border";
  if (seat.state === "blocked") return "bg-danger/15 border-danger";
  if (seat.state === "available") return "bg-surface border-border";
  // booked — colour by booking status
  if (seat.bookingStatus === "boarded") return "bg-success/25 border-success";
  if (seat.bookingStatus === "no_show") return "bg-danger/20 border-danger";
  return "bg-brand-100 border-brand-500";
}

function seatGlyph(seat: BoardSeat): string {
  if (seat.state === "driver") return "🚍";
  if (seat.state === "blocked") return "×";
  if (seat.state === "available") return String(seat.number);
  return String(seat.number);
}

export function SeatBoardGrid({ board, selectedSeat, onSelectSeat }: SeatBoardGridProps) {
  const byPosition = new Map<string, BoardSeat>();
  for (const seat of board.seats) byPosition.set(`${seat.row}:${seat.col}`, seat);

  return (
    <View className="gap-2 self-center rounded-card bg-surface p-3 shadow-sm">
      {Array.from({ length: board.rows }, (_, row) => (
        <View key={row} className="flex-row gap-2">
          {Array.from({ length: board.cols }, (_, col) => {
            const seat = byPosition.get(`${row}:${col}`);
            if (!seat) return <View key={col} className="h-11 w-11" />;
            const selectable = seat.state === "booked";
            const isSelected = selectable && seat.number === selectedSeat;
            return (
              <Pressable
                key={col}
                disabled={!selectable}
                onPress={() => onSelectSeat(seat)}
                className={`h-11 w-11 items-center justify-center rounded-seat border ${seatTone(seat)} ${isSelected ? "border-2 border-brand-700" : ""}`}
              >
                <Text className="font-body-medium text-xs text-ink">{seatGlyph(seat)}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
