import { Game } from './game';
import { SimulationParams } from './types';
import { createMessageSender } from './workerUtils';

const sendMessage = createMessageSender<{
  progress: { pct: number; winProbability: number };
}>();

self.addEventListener(
  'message',
  (
    event: MessageEvent<{
      type: 'simulation';
      data: SimulationParams;
    }>
  ) => {
    const {
      myHand,
      numPlayers,
      communityCards,
      potSize,
      amountToCall,
      simulationIterations,
      progressInterval
    } = event.data.data;

    const t1 = Date.now();

    const game = new Game(myHand, numPlayers, {
      iterations: simulationIterations
    });
    game.setPotSize(potSize);
    game.setAmountToCall(amountToCall);
    communityCards.forEach(card => game.addCommunityCard(card));

    let wins = 0;
    for (let i = 0; i < simulationIterations; i++) {
      if (game.simulateOnce()) wins += 1;
      if (i % progressInterval === 0) {
        sendMessage('progress', {
          pct: (i / simulationIterations) * 100,
          winProbability: wins / (i + 1)
        });
      }
    }
    const winProbability = wins / simulationIterations;
    sendMessage('progress', { pct: 100, winProbability });

    const t2 = Date.now();
    console.log(
      `${Math.round((1000 * simulationIterations) / (t2 - t1))} sim/sec`
    );

    sendMessage.terminate();
  }
);
