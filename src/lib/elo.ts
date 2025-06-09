export interface EloResult {
  playerANewRating: number
  playerBNewRating: number
}

export function calculateEloRatings(
  playerARating: number,
  playerBRating: number,
  playerAScore: number,
  playerBScore: number,
  kFactor: number = 32
): EloResult {
  // Calculate expected scores
  const expectedA = 1 / (1 + Math.pow(10, (playerBRating - playerARating) / 400))
  const expectedB = 1 / (1 + Math.pow(10, (playerARating - playerBRating) / 400))

  // Determine actual scores (1 for win, 0.5 for tie, 0 for loss)
  let actualA: number
  let actualB: number

  if (playerAScore > playerBScore) {
    actualA = 1
    actualB = 0
  } else if (playerBScore > playerAScore) {
    actualA = 0
    actualB = 1
  } else {
    actualA = 0.5
    actualB = 0.5
  }

  // Calculate new ratings
  const playerANewRating = Math.round(playerARating + kFactor * (actualA - expectedA))
  const playerBNewRating = Math.round(playerBRating + kFactor * (actualB - expectedB))

  return {
    playerANewRating,
    playerBNewRating
  }
} 