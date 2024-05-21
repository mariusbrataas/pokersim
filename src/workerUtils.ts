export function createWorker<
  I extends { [type: string]: any },
  O extends { [type: string]: any }
>(
  worker: Worker,
  messageHandlers: { [type in keyof O]: (data: O[type]) => void },
  onTerminate?: () => void
) {
  const handleTerminate = (() => {
    let didTerminate = false;
    return () => {
      if (!didTerminate) {
        didTerminate = true;
        worker.terminate();
        onTerminate?.();
      }
    };
  })();

  worker.onmessage = (
    message: MessageEvent<
      { [key in keyof O]: { type: key; data: O[key] } }[keyof O] | 'TERMINATE'
    >
  ) => {
    if (message.data === 'TERMINATE') {
      handleTerminate();
    } else {
      messageHandlers[message.data.type](message.data.data);
    }
  };

  return {
    post: <K extends keyof I>(type: K, data: I[K]) =>
      worker.postMessage({ type, data }),
    terminate: () => {
      handleTerminate();
    }
  };
}

export function createMessageSender<T extends { [type: string]: any }>() {
  function sendMessage<K extends keyof T>(type: K, data: T[K]) {
    self.postMessage({ type, data });
  }
  sendMessage.terminate = () => {
    self.postMessage('TERMINATE');
  };
  return sendMessage;
}
