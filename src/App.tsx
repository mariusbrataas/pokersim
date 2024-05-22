import { useEffect, useMemo, useState } from 'react';
import './App.css';
import styles from './App.module.scss';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { Deck, Hand } from './game';
import { joinStyles } from './joinStyles';
import { Card, SimulationParams } from './types';
import { useSearchParam } from './useSearchParam';
import { createWorker } from './workerUtils';

function RenderCard({
  card,
  onClick,
  disabled,
  highlight
}: {
  card: Card | 'back';
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <>
      <div
        className={joinStyles(
          styles.card,
          disabled && styles.disabled,
          highlight && styles.highlight
        )}
        onClick={onClick}
      >
        <img src={`images/${card}.svg`} />
      </div>
    </>
  );
}

function NumberInput({
  title,
  value,
  onChange
}: {
  title: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.numberInput}>
      <label>{title}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.valueAsNumber)}
      />
    </div>
  );
}
// }
// function useSearchParam<
//   T extends
//     | number
//     | number[]
//     | (number | undefined)[]
//     | string
//     | string[]
//     | (string | undefined)[]
// >(key: string, defaultState: T) {}

function App() {
  const [communityCards, setCommunityCards] = useSearchParam<
    (undefined | Card)[]
  >('community', [undefined, undefined, undefined, undefined, undefined]);
  const [pocketCards, setPocketCards] = useSearchParam<(undefined | Card)[]>(
    'hole',
    [undefined, undefined]
  );

  const [changeComCard, setChangeComCard] = useState<undefined | number>();
  const [changePocCard, setChangePocCard] = useState<undefined | number>();

  const [simulations, setSimulations] = useSearchParam<number>(
    'simulations',
    10e3
  );
  const [players, setPlayers] = useSearchParam<number>('players', 5);
  const [potSize, setPotSize] = useState(100);
  const [amountToCall, setAmountToCall] = useState(20);

  const [shouldSimulate, setShouldSimulate] = useState(false);
  const [progress, setProgress] = useState(100);
  const [winProbability, setWinProbability] = useState(0);

  useEffect(() => {
    if (!shouldSimulate || progress !== 100) return;
    setShouldSimulate(false);

    const filteredPocket = pocketCards.filter(card => card) as Card[];
    const filteredCommunity = communityCards.filter(card => card) as Card[];
    if (filteredPocket.length < 2 || filteredCommunity.length < 3) return;

    const worker = createWorker<
      {
        simulation: SimulationParams;
      },
      { progress: { pct: number; winProbability: number } }
    >(
      new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module'
      }),
      {
        progress: ({ pct, winProbability }) => {
          setWinProbability(winProbability);
          setProgress(pct);
        }
      },
      () => setProgress(100)
    );

    setProgress(0);
    worker.post('simulation', {
      myHand: filteredPocket,
      communityCards: filteredCommunity,
      numPlayers: players,
      potSize,
      amountToCall,
      simulationIterations: simulations,
      progressInterval: 500
    });
  }, [shouldSimulate, progress]);

  const allUsedCards = useMemo(
    () => [...pocketCards, ...communityCards].filter(card => card) as Card[],
    [pocketCards, communityCards]
  );

  const best = useMemo(() => {
    const filteredPocket = pocketCards.filter(card => card) as Card[];
    const filteredCommunity = communityCards.filter(card => card) as Card[];
    if (filteredPocket.length < 2 || filteredCommunity.length < 3) return;

    const bestHand = Hand.best([...filteredPocket, ...filteredCommunity]);
    const bestHandCards = bestHand[2];

    const bestHandCardLib = bestHandCards.reduce((acc, card) => {
      acc[card] = true;
      return acc;
    }, {} as Record<Card, boolean>);

    return { rank: bestHand[0], cards: bestHandCardLib };
  }, [pocketCards, communityCards]);

  useEffect(() => {
    setShouldSimulate(true);
  }, [pocketCards, communityCards, players]);

  return (
    <>
      <main className={styles.app}>
        <div className={styles.content}>
          <div className={styles.communityCardWrapper}>
            <h2>Community cards</h2>
            <div className={styles.communityCards}>
              {communityCards.map((card, idx) => (
                <RenderCard
                  key={`community_card_${idx}`}
                  card={card || 'back'}
                  onClick={() => setChangeComCard(idx)}
                  highlight={card && best?.cards[card]}
                />
              ))}
            </div>
          </div>

          <div className={styles.communityCardWrapper}>
            <h2>
              Hole cards{best ? ` (${Hand.rankToString(best.rank)})` : ''}
            </h2>
            <div className={styles.communityCards}>
              {pocketCards.map((card, idx) => (
                <RenderCard
                  key={`pocket_card_${idx}`}
                  card={card || 'back'}
                  onClick={() => setChangePocCard(idx)}
                />
              ))}
            </div>
          </div>

          <div>
            <div>
              Win probability: {Math.round(winProbability * 10000) / 100}%
            </div>
          </div>

          <div className={styles.settingsCard}>
            <div className={styles.inputs}>
              <NumberInput
                title="Number of players"
                value={players}
                onChange={setPlayers}
              />
              <NumberInput
                title="Simulations"
                value={simulations}
                onChange={setSimulations}
              />
            </div>
            <div className={styles.bigButtons}>
              <button
                className={styles.progressButton}
                onClick={() => setShouldSimulate(true)}
                disabled={
                  progress !== 100 ||
                  pocketCards.filter(card => card).length < 2 ||
                  communityCards.filter(card => card).length < 3
                }
              >
                Simulate!
                <span
                  style={{
                    width: `${progress === 100 ? 0 : progress}%`,
                    opacity: progress === 100 ? 0 : 1
                  }}
                ></span>
              </button>
            </div>
          </div>
        </div>
      </main>
      {changeComCard !== undefined ? (
        <SelectCardModal
          usedCards={allUsedCards}
          onClose={() => setChangeComCard(undefined)}
          onSelectCard={nextCard => {
            setCommunityCards(prevState => {
              prevState[changeComCard] = nextCard;
              return [...prevState];
            });
            setChangeComCard(undefined);
          }}
        />
      ) : undefined}
      {changePocCard !== undefined ? (
        <SelectCardModal
          usedCards={allUsedCards}
          onClose={() => setChangePocCard(undefined)}
          onSelectCard={nextCard => {
            setPocketCards(prevState => {
              prevState[changePocCard] = nextCard;
              return [...prevState];
            });
            setChangePocCard(undefined);
          }}
        />
      ) : undefined}
    </>
  );
}

function SelectCardModal({
  usedCards,
  onSelectCard,
  onClose
}: {
  usedCards: Card[];
  onSelectCard: (card?: Card) => void;
  onClose: () => void;
}) {
  const usedCardsMap = useMemo(
    () =>
      usedCards.reduce((acc, card) => {
        acc[card] = true;
        return acc;
      }, {} as Record<Card, boolean>),
    [usedCards]
  );
  const emptyCard = (
    <RenderCard card="back" onClick={() => onSelectCard(undefined)} />
  );
  return (
    <Modal onClose={onClose}>
      <h2>Change card</h2>
      <Tabs
        tabs={{
          clubs: (
            <div className={styles.selectCardModal}>
              {emptyCard}
              {Deck.getCards().map(card =>
                Deck.getSuit(card) === 'C' ? (
                  <RenderCard
                    key={`select_card_modal_${card}`}
                    card={card}
                    disabled={usedCardsMap[card]}
                    onClick={() => onSelectCard(card)}
                  />
                ) : undefined
              )}
            </div>
          ),
          diamonds: (
            <div className={styles.selectCardModal}>
              {emptyCard}
              {Deck.getCards().map(card =>
                Deck.getSuit(card) === 'D' ? (
                  <RenderCard
                    key={`select_card_modal_${card}`}
                    card={card}
                    disabled={usedCardsMap[card]}
                    onClick={() => onSelectCard(card)}
                  />
                ) : undefined
              )}
            </div>
          ),
          hearts: (
            <div className={styles.selectCardModal}>
              {emptyCard}
              {Deck.getCards().map(card =>
                Deck.getSuit(card) === 'H' ? (
                  <RenderCard
                    key={`select_card_modal_${card}`}
                    card={card}
                    disabled={usedCardsMap[card]}
                    onClick={() => onSelectCard(card)}
                  />
                ) : undefined
              )}
            </div>
          ),
          spades: (
            <div className={styles.selectCardModal}>
              {emptyCard}
              {Deck.getCards().map(card =>
                Deck.getSuit(card) === 'S' ? (
                  <RenderCard
                    key={`select_card_modal_${card}`}
                    card={card}
                    disabled={usedCardsMap[card]}
                    onClick={() => onSelectCard(card)}
                  />
                ) : undefined
              )}
            </div>
          )
        }}
      />
    </Modal>
  );
}

export default App;
