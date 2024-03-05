"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {
  // loading state
  const [isLoading, setIsLoading] = useState(true);

  // target positions
  const [targetPositions, setTargetPositions] = useState(Array(1).fill().map(() => ({ x: 0, y: 0 })));

  // target hit counter
  const [targetHitsCount, setTargetHitsCount] = useState(0);

  // State to track the amount of Coin the player has
  const [Coin, setCoin] = useState(0);

  //  target hit interval in milliseconds
  const [lastTargetHitTimestamp, setLastTargetHitTimestamp] = useState(0);

  //  coin combo multiplier progress in milliseconds
  const [coinComboMultiplier, setCoinComboMultiplier] = useState(0);

  // Store open state
  const [isCoinStoreOpen, setIsCoinStoreOpen] = useState(false);

  // Store items
  const [storeItems, setStoreItems] = useState([
    { id: 0, description: '+1 target', cost: 0.3, owned: 1 },
    { id: 1, description: '+1 max multiplier', cost: 1, owned: 0 },
    { id: 2, description: '-10% multiplier fall off', cost: 10, owned: 0 },
    { id: 3, description: '+1 coin on hit', cost: 100, owned: 0 },
    // Add more store items here...
  ]);







  //generate new random positions for the targets
  const generatePosition = () => {
    const margin = 100;
    return {
      x: (Math.random() * (window.innerWidth - margin * 2) + margin / 2),
      y: (Math.random() * (window.innerHeight - margin * 2) + margin / 2),
    };
  };


  //spawn targets on load
  useEffect(() => {

  }, []);

  // Function to add a new target
  const addTarget = () => {
    setTargetPositions(prevPositions => [...prevPositions, generatePosition()]);
  };

  const removeTarget = () => {
    if (targetPositions.length > 1) { // Ensure at least one target remains
      setTargetPositions(targetPositions.slice(0, -1));
    }
  };

  // input event listener
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 't' || event.key === 'T') {
        addTarget();
      }
      if (event.key === 'g' || event.key === 'G') {
        removeTarget();
      }
      // Toggle store on space bar press
      if (event.key === ' ' || event.code === 'Space') {
        setIsCoinStoreOpen((previsCoinStoreOpen) => !previsCoinStoreOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [targetPositions]);

  // regenerate position for a single target
  const regeneratePosition = (targetID) => {
    setTargetPositions(prevPositions =>
      prevPositions.map((pos, index) => index === targetID ? generatePosition() : pos)
    );
  };

  // Base coin reward function based on time elapsed since last target hit
  const calculateCoinEarned = (timeDifference) => {
    const potentialReward = (1.3 ** ((1000 - timeDifference) * 0.01));
    return potentialReward < 1 || timeDifference == 0 ? 1 : potentialReward;
  };

  // coin combo multiplier goes down at rate of 15ms/10ms
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCoinComboMultiplier(prevCoinComboMultiplier => Math.max(0, prevCoinComboMultiplier - 15));
    }, 10);

    return () => clearInterval(intervalId);
  }, []);

  // Coin reward per target hit
  const targetHitCoinReward = () => {
    const currentTime = Date.now();
    const timeDifference = lastTargetHitTimestamp > 0 ? currentTime - lastTargetHitTimestamp : 0;
    setLastTargetHitTimestamp(currentTime);
    // base Coin reward based on last target hit interval
    const baseCoinEarned = calculateCoinEarned(timeDifference);
    // bonus coin combo multiplier based on progress bar
    const finalCoinEarned = baseCoinEarned * Math.max(1, coinComboMultiplier / 1000);
    // Update Coin state with the final amount earned at 1% of final reward
    setCoin((prevCoin) => prevCoin + finalCoinEarned * 0.01);
  };

  // when u hit a target
  const onTargetHit = (targetID) => {
    regeneratePosition(targetID);
    setTargetHitsCount(prevCount => prevCount + 1);
    targetHitCoinReward();
    setCoinComboMultiplier(prevCoinComboMultiplier => Math.min(10000, prevCoinComboMultiplier + 1000));
  };

  // target miss penalty
  const onTargetMiss = () => {
    setCoin(prevCoin => Math.max(0, prevCoin - 1)); // remove 1 coin
    setCoinComboMultiplier(prevCoinComboMultiplier => Math.max(0, prevCoinComboMultiplier - 2000)); //lower coin multiplier by 2s
  };

  // Function to purchase an item from the store
  const purchaseItem = (itemId) => {
    // Find the index of the item in the storeItems array
    const itemIndex = storeItems.findIndex(item => item.id === itemId);

    if (itemIndex !== -1 && Coin >= storeItems[itemIndex].cost) {
      // Extract the item using the found index
      const item = storeItems[itemIndex];

      // Perform actions based on the item description or other attributes
      switch (item.description) {
        case '+1 target':
          addTarget();
          break;
        // Add more cases as needed
      }

      // Deduct coin cost from player's Coins
      setCoin(prevCoin => prevCoin - item.cost);
      console.log('purchased', item.description, 'for', item.cost, 'Coin');

      // cost increases each purchase
      const updatedStoreItems = storeItems.map((currentItem, index) => {
        if (index === itemIndex) {
          return { ...currentItem, cost: ((currentItem.cost * 5) ** 1.3).toFixed(2) };
        }
        return currentItem;
      });

      setStoreItems(updatedStoreItems);
    } else {
    }
  };

  // on load function
  useEffect(() => {
    setTargetPositions(targetPositions.map(() => generatePosition()));
    setTimeout(() => {
      setIsLoading(false);
    }, 200); // 200ms delay
  }, []);

  // loading screen
  if (isLoading) {
    return <div className="bg-blue-500 font-bold h-screen w-screen overflow-hidden" >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-9xl">
        AIM TRAINER
      </div>
    </div>;
  }

  // Main game screen
  return (
    <main className="select-none bg-gray-200 text-[5vh] font-bold h-screen w-screen overflow-hidden" >
      {/* coin combo multiplier progress bar */}
      <div className="border-b-[3px] border-black absolute top-0 left-0 w-full h-[5vh] bg-[#F89414] bg-opacity-60 flex items-center">
        <div className="h-full border-x-[3px] border-black bg-[#F89414]" style={{
          width: `${(coinComboMultiplier / 10000) * 100}%`,
        }}></div>
        {/* Display current coin combo multiplier */}
        {coinComboMultiplier > 0 && (
          <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
            <span className="text-[3vh]">COMBO x{(coinComboMultiplier / 1000).toFixed(2)}</span>
          </div>
        )}
      </div>
      {/* Target hit counter */}
      <div className="absolute top-[3vh] left-1/2 transform -translate-x-1/2 text-center text-[10vh]">
        {targetHitsCount}
      </div>
      {/* Coin counter */}
      <div className="absolute top-[5vh] left-[2vw] flex items-center">
        <img src="/btclogo.png" alt="BTC Logo" style={{ width: '5vh', height: '5vh' }} className="border-[3px] border-black rounded-full" />
        <div style={{ width: '0.5vw' }}></div>
        <div>
          {Coin.toFixed(5)}
        </div>
      </div>
      {/* target spawn canvas */}
      <div className="h-screen w-screen absolute" onMouseDown={onTargetMiss} style={{ cursor: "url('/greendot.png') 32 32, auto" }}>
        {/* target instances */}
        {targetPositions.map((targetPosition, targetID) => (
          <div
            key={targetID}
            onMouseDown={(e) => {
              e.stopPropagation();
              onTargetHit(targetID);
            }}
            className="absolute w-[9vh] h-[9vh] bg-red-600 rounded-full border-[3px] border-black"
            style={{
              left: `${targetPosition.x}px`,
              top: `${targetPosition.y}px`,
            }}
          />
        ))}
      </div>
      {/* coin store */}
      {isCoinStoreOpen && (
        <div className="absolute overflow-hidden w-screen h-[83.5vh] top-[16.5vh] bg-blue-500 flex flex-col bg-opacity-80">
          {/* "UPGRADE" text section */}
          <div className="bg-opacity-85 bg-blue-500 text-center py-[0.25vh] text-[4vh] border-t-[3px] border-b-[3px] border-black">STORE</div>
          {/* Grid section */}
          <div className="grid grid-cols-5 grid-rows-3 gap-[1vh] flex-grow p-[2vh]">
            {storeItems.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col bg-green-200 px-[1vw] pt-[5vh] bg-opacity-70 border-[3px] border-black"
                onMouseDown={() => purchaseItem(item.id)}
              >
                <div className="flex-1 text-[4vh] self-center">{item.description}</div>
                {/* Item cost */}
                <div className="flex-1 flex items-center">
                  <img src="/btclogo.png" alt="BTC Logo" style={{ width: '5vh', height: '5vh' }} className="border-[3px] border-black rounded-full" />
                  <div style={{ width: '0.5vw' }}></div>
                  <span>{item.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
