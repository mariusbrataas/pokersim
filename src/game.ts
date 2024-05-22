import { Card, HandRank, Rank, Suit } from './types';
import { getCombinations, shuffle } from './utils';

export class Deck {
  static suits: Suit[] = ['C', 'D', 'H', 'S'];
  static ranks: Rank[] = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'T',
    'J',
    'Q',
    'K',
    'A'
  ];

  static getRank = (card: Card) => card[0] as Rank;
  static getSuit = (card: Card) => card[1] as Suit;
  static getScore = (() => {
    const scoreTable: Record<Rank, number> = {} as any;
    Deck.ranks.forEach((rank, idx) => {
      scoreTable[rank] = idx + 2;
    });
    return (card: Card) => scoreTable[Deck.getRank(card)];
  })();

  static getCards = (): Card[] =>
    Deck.suits
      .map(suit => Deck.ranks.map(rank => `${rank}${suit}` as Card))
      .flat();

  static getShuffledCards = () => shuffle(this.getCards());

  reset = () => (this.cards = Deck.getShuffledCards());

  private cards = Deck.getShuffledCards();

  clone = () => {
    const newDeck = new Deck();
    newDeck.cards = [...this.cards];
    return newDeck;
  };

  removeCard = (card: Card) => {
    const index = this.cards.indexOf(card);
    if (index > -1) this.cards.splice(index, 1);
  };

  private drawCard = () => {
    const index = Math.floor(Math.random() * this.cards.length);
    const card = this.cards[index];
    this.cards.splice(index, 1);
    return card;
  };

  draw = (nCards = 1) => Array.from({ length: nCards }, () => this.drawCard());

  shuffle = () => {
    shuffle(this.cards);
    return this;
  };
}

export abstract class Hand {
  static rankToString = (rank: HandRank) => {
    switch (rank) {
      case HandRank.royalFlush:
        return 'Royal Flush';
      case HandRank.straightFlush:
        return 'Straight Flush';
      case HandRank.fourOfAKind:
        return 'Four of a Kind';
      case HandRank.fullHouse:
        return 'Full House';
      case HandRank.flush:
        return 'Flush';
      case HandRank.straight:
        return 'Straight';
      case HandRank.threeOfAKind:
        return 'Three of a Kind';
      case HandRank.twoPair:
        return 'Two pair';
      case HandRank.onePair:
        return 'One pair';
      default:
        return 'High card';
    }
  };

  static rank = (hand: Card[]): [HandRank, number[]] => {
    if (hand.some(test => test === undefined))
      throw new Error('Missing cards in hand');
    const handRanks = hand.map(Deck.getScore).sort((a, b) => b - a);
    const uniqueSuits = new Set(hand.map(Deck.getSuit)).size;

    // Flush
    if (uniqueSuits === 1) {
      if (handRanks.join('') === '1413121110')
        return [HandRank.royalFlush, handRanks];
      if (handRanks[0] - handRanks[4] === 4)
        return [HandRank.straightFlush, handRanks];
      return [HandRank.flush, handRanks];
    }

    const handCounts = handRanks.reduce((acc: Record<number, number>, rank) => {
      acc[rank] = (acc[rank] || 0) + 1;
      return acc;
    }, {});

    const sortedRanks = Object.keys(handCounts)
      .map(Number)
      .sort((a, b) => {
        const ca = handCounts[a];
        const cb = handCounts[b];
        if (ca === cb) return b - a;
        return cb - ca;
      });

    // Four of a Kind
    if (handCounts[sortedRanks[0]] === 4) {
      return [HandRank.fourOfAKind, sortedRanks];
    }

    // Full House
    if (handCounts[sortedRanks[0]] === 3 && handCounts[sortedRanks[1]] === 2) {
      return [HandRank.fullHouse, sortedRanks];
    }

    // Straight
    if (handRanks[0] - handRanks[4] === 4 && new Set(handRanks).size === 5) {
      return [HandRank.straight, handRanks];
    }

    // Three of a Kind
    if (handCounts[sortedRanks[0]] === 3) {
      return [HandRank.threeOfAKind, sortedRanks];
    }

    // Two pair
    if (handCounts[sortedRanks[0]] === 2 && handCounts[sortedRanks[1]] === 2) {
      return [HandRank.twoPair, sortedRanks];
    }

    // One pair
    if (handCounts[sortedRanks[0]] === 2) {
      return [HandRank.onePair, sortedRanks];
    }

    // High Card
    return [HandRank.highCard, sortedRanks];
  };

  static best = (cards: Card[]) => {
    const combinations = getCombinations(cards, 5);
    return combinations
      .map(
        combo => [...this.rank(combo), combo] as [HandRank, number[], Card[]]
      )
      .reduce((best, current) =>
        current[0] > best[0] ||
        (current[0] === best[0] &&
          current[1].map(v => v.toString().padStart(2, '0')).join() >
            best[1].map(v => v.toString().padStart(2, '0')).join())
          ? current
          : best
      )!;
  };

  static compare = (
    hand1: [HandRank, number[], Card[]],
    hand2: [HandRank, number[], Card[]]
  ) => {
    const handOneRank = hand1[0];
    const handTwoRank = hand2[0];
    if (handOneRank !== handTwoRank) return handOneRank - handTwoRank;

    for (let i = 0; i < hand1[1].length; i++) {
      const handOneCardRank = hand1[1][i];
      const handTwoCardRank = hand2[1][i];
      if (handOneCardRank !== handTwoCardRank)
        return handOneCardRank - handTwoCardRank;
    }

    return 0;
  };
}

export class Game {
  private deck = new Deck();

  public communityCards: Card[] = [];
  public potSize = 0;
  public amountToCall = 0;

  public maxRaiseAmount = 1000;
  public foldProbability = 0.2; // Probability that a player will fold when faced with a raise

  private calculatedWinProbability?: number;

  constructor(
    public myHand: Card[],
    public numPlayers: number,
    private simulationSettings:
      | { iterations: number; milliseconds?: undefined }
      | { iterations?: undefined; milliseconds: number } = {
      iterations: 10e3
    }
  ) {
    myHand.forEach(card => this.deck.removeCard(card));
    console.log('New game:', this);
  }

  resetCalculations = () => {
    this.calculatedWinProbability = undefined;
  };

  setPotSize = (potSize: number) => (this.potSize = potSize);

  setAmountToCall = (amountToCall: number) =>
    (this.amountToCall = amountToCall);

  setNumPlayers = (numPlayers: number) => {
    this.resetCalculations();
    return (this.numPlayers = numPlayers);
  };

  addCommunityCard = (card: Card) => {
    this.resetCalculations();
    this.deck.removeCard(card);
    this.communityCards.push(card);
  };

  drawCommunityCards = (nCards = 1) => {
    this.resetCalculations();
    this.communityCards.push(...this.deck.draw(nCards));
  };

  simulateOnce = () => {
    const deckCopy = this.deck.clone().shuffle();

    const community = [
      ...this.communityCards,
      ...deckCopy.draw(5 - this.communityCards.length)
    ];

    const myBestHand = Hand.best([...this.myHand, ...community]);

    const opponents = Array.from({ length: this.numPlayers }, () =>
      deckCopy.draw(2)
    );

    const didWin = opponents.every(opHand => {
      const opponentBestHand = Hand.best([...opHand, ...community]);
      return Hand.compare(myBestHand, opponentBestHand) >= 0;
    });

    return didWin;
  };

  simulate = () => {
    let wins = 0;
    let simulationsCount = 0;

    const t1 = Date.now();

    if (this.simulationSettings.iterations) {
      simulationsCount = this.simulationSettings.iterations;
      for (let i = 0; i < simulationsCount; i++)
        if (this.simulateOnce()) wins += 1;
    } else {
      const ms = this.simulationSettings.milliseconds!;
      const expiration = t1 + ms;
      while (Date.now() < expiration) {
        simulationsCount += 1;
        if (this.simulateOnce()) wins += 1;
      }
    }

    const t2 = Date.now();

    console.log(
      `Simulations: ${simulationsCount} (${
        (1000 * simulationsCount) / (t2 - t1)
      }/s)`
    );

    return wins / simulationsCount;
  };

  get winProbability() {
    if (this.calculatedWinProbability === undefined)
      return (this.calculatedWinProbability = this.simulate());
    return this.calculatedWinProbability;
  }

  getExpectedReturnOnCall = () => {
    return (
      this.winProbability * (this.potSize + this.amountToCall) -
      this.amountToCall
    );
  };

  getIdealRaiseAmount = () => {
    const winProbability = this.winProbability;
    let bestRaiseAmount = 0;
    let maxExpectedReturn = this.getExpectedReturnOnCall();

    for (
      let raiseAmount = this.amountToCall;
      raiseAmount <= this.maxRaiseAmount;
      raiseAmount++
    ) {
      let expectedReturn = 0;
      for (let k = 0; k <= this.numPlayers; k++) {
        const combinationProbability =
          Math.pow(1 - this.foldProbability, k) *
          Math.pow(this.foldProbability, this.numPlayers - k);
        const potAfterRaise = this.potSize + raiseAmount * (k + 1);
        const costToRaise = raiseAmount;
        const foldAdjustedWinProbability =
          winProbability * Math.pow(this.foldProbability, this.numPlayers - k);
        expectedReturn +=
          combinationProbability *
          (foldAdjustedWinProbability * potAfterRaise - costToRaise);
      }

      if (expectedReturn > maxExpectedReturn) {
        maxExpectedReturn = expectedReturn;
        bestRaiseAmount = raiseAmount;
      }
    }

    return bestRaiseAmount;
  };

  // Decide whether to call, raise, or fold
  decideAction = (): { action: 'call' | 'raise' | 'fold'; amount: number } => {
    const expectedReturnOnCall = this.getExpectedReturnOnCall();
    const idealRaiseAmount = this.getIdealRaiseAmount();
    const expectedReturnOnRaise =
      this.getExpectedReturnOnCall() +
      (idealRaiseAmount > 0 ? idealRaiseAmount : 0);

    if (
      expectedReturnOnCall > 0 &&
      expectedReturnOnCall >= expectedReturnOnRaise
    ) {
      return { action: 'call', amount: this.amountToCall };
    } else if (expectedReturnOnRaise > expectedReturnOnCall) {
      return { action: 'raise', amount: idealRaiseAmount };
    } else {
      return { action: 'fold', amount: 0 };
    }
  };
}
