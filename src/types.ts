export type Suit = 'C' | 'D' | 'H' | 'S';
export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';
export type Card = `${Rank}${Suit}`;

export enum HandRank {
  highCard = 0,
  onePair = 1,
  twoPair = 2,
  threeOfAKind = 3,
  straight = 4,
  flush = 5,
  fullHouse = 6,
  fourOfAKind = 7,
  straightFlush = 8,
  royalFlush = 9
}

type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: undefined;
};

export type Either<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

export interface SimulationParams {
  myHand: Card[];
  numPlayers: number;
  communityCards: Card[];
  potSize: number;
  amountToCall: number;
  simulationIterations: number;
  progressInterval: number;
}

// export type SimulationWorker = WorkerInit<
//   { simulate: SimulationParams },
//   { simulationProgress: { pct: number; winProbability: number } }
// >;
