import { useEffect, useMemo, useState } from 'react';
import './App.css';
import styles from './App.module.scss';
import { Game } from './game';
import { Card, SimulationParams } from './types';
import { createWorker } from './workerUtils';

function RenderCard({ card }: { card: Card | 'back' }) {
  return (
    <div className={styles.card}>
      <img src={`images/${card}.svg`} />
    </div>
  );
}

function CommunityCards({ cards }: { cards: Card[] }) {
  return (
    <div className={styles.communityCardWrapper}>
      <h2>Community cards</h2>
      <div className={styles.communityCards}>
        {cards.map(card => (
          <RenderCard key={`community_card_${card}`} card={card} />
        ))}
        {Array.from({ length: 5 - cards.length }, (_, idx) => (
          <div
            key={`community_card_hidden_${idx}`}
            className={styles.hiddenCommunityCard}
          >
            <RenderCard card="back" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PocketCards({ cards }: { cards: Card[] }) {
  return (
    <div className={styles.pocketCards}>
      {cards.map(card => (
        <RenderCard key={`pocket_card_${card}`} card={card} />
      ))}
    </div>
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

function App() {
  const game = useMemo(() => {
    const newGame = new Game(['AC', 'KC'], 5, { milliseconds: 1e3 });
    newGame.drawCommunityCards(3);
    newGame.setPotSize(100);
    newGame.setAmountToCall(20);
    return newGame;
  }, []);

  const [players, setPlayers] = useState(game.numPlayers);
  const [potSize, setPotSize] = useState(game.potSize);
  const [amountToCall, setAmountToCall] = useState(game.amountToCall);

  useEffect(() => {
    game.setNumPlayers(players);
  }, [players]);
  useEffect(() => {
    game.setPotSize(potSize);
  }, [potSize]);
  useEffect(() => {
    game.setAmountToCall(amountToCall);
  }, [amountToCall]);

  const [progress, setProgress] = useState(100);
  const [winProbability, setWinProbability] = useState(0);

  const handleSimulate = () => {
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

    worker.post('simulation', {
      myHand: ['AH', 'KH'],
      numPlayers: 3,
      communityCards: ['2C', '3D', '4H'],
      potSize: 100,
      amountToCall: 10,
      simulationIterations: 30e3,
      progressInterval: 1000
    });
  };

  return (
    <main className={styles.app}>
      <div className={styles.content}>
        <CommunityCards cards={game.communityCards} />
        <PocketCards cards={game.myHand} />

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
              title="Pot size"
              value={potSize}
              onChange={setPotSize}
            />
            <NumberInput
              title="Amount to call"
              value={amountToCall}
              onChange={setAmountToCall}
            />
          </div>
          <div className={styles.bigButtons}>
            <button className={styles.progressButton} onClick={handleSimulate}>
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
  );
}

export default App;
