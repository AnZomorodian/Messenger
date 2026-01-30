import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const VIBRANT_COLORS = [
  "#FF3B30", // Red
  "#FF9500", // Orange
  "#FFCC00", // Yellow
  "#4CD964", // Green
  "#5AC8FA", // Light Blue
  "#007AFF", // Blue
  "#5856D6", // Purple
  "#FF2D55", // Pink
  "#A2845E", // Brown
  "#8E8E93", // Gray
  "#E056FD", // Magenta
  "#0BE881", // Mint
  "#1ABC9C", // Teal
  "#3498DB", // Sky Blue
  "#9B59B6", // Amethyst
  "#34495E", // Dark Gray
  "#16A085", // Sea Green
  "#27AE60", // Emerald
  "#2980B9", // Ocean Blue
  "#8E44AD", // Violet
  "#F39C12", // Sunflower
  "#D35400", // Pumpkin
  "#C0392B", // Crimson
  "#2C3E50", // Midnight
];

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  className?: string;
}

export function ColorPicker({ selectedColor, onSelect, className }: ColorPickerProps) {
  return (
    <div className={cn("grid grid-cols-6 gap-2", className)}>
      {VIBRANT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
            selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110 shadow-lg" : "opacity-80 hover:opacity-100"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        >
          {selectedColor === color && (
            <Check className="w-5 h-5 text-white drop-shadow-md" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}
