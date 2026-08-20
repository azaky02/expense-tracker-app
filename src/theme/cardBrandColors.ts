import { palette } from './palette';

/**
 * The wireframes color each saved card differently (not by network/brand — three Visa
 * cards each get a distinct color), so cards store their own `color` (see db/schema.ts).
 * This is the rotation new cards cycle through, and the fallback if a card has no color yet.
 */
export const cardColorRotation = [
  palette.navy700,
  palette.teal600,
  palette.brown600,
  palette.navy600,
  palette.teal700,
  palette.brown700,
] as const;

export function nextCardColor(existingCardCount: number): string {
  return cardColorRotation[existingCardCount % cardColorRotation.length];
}

export const cashCardColor = palette.navy900;
