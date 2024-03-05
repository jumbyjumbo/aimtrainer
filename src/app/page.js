"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {
  // loading state
  const [isLoading, setIsLoading] = useState(true);

  // target positions
  const [targetPositions, setTargetPositions] = useState(Array(6).fill().map(() => ({ x: 0, y: 0 })));

  // target hit counter
  const [targetHitsCount, setTargetHitsCount] = useState(0);

  // State to track the amount of Coin the player has
  const [Coin, setCoin] = useState(0);

  //  target hit interval in milliseconds
  const [lastTargetHitTimestamp, setLastTargetHitTimestamp] = useState(0);

  //  coin combo multiplier progress in milliseconds
  const [coinComboMultiplier, setCoinComboMultiplier] = useState(0);

  // Store open state
  const [isStoreOpen, setIsStoreOpen] = useState(false);



  //generate new random positions for the targets
  const generatePosition = () => ({
    x: Math.random() * (window.innerWidth - 100),
    y: Math.random() * (window.innerHeight - 100),
  });

  useEffect(() => {
    setTargetPositions(targetPositions.map(() => generatePosition()));
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
        setIsStoreOpen((prevIsStoreOpen) => !prevIsStoreOpen);
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

  // end loading screen
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500); // 500ms delay
  }, []);


  // loading screen
  if (isLoading) {
    return <div className="bg-gray-200 font-bold h-screen w-screen overflow-hidden" >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-9xl">
        AIM TRAINER
      </div>
    </div>;
  }

  // Main game screen
  return (
    <main className="select-none bg-gray-200 text-[5vh] font-bold h-screen w-screen overflow-hidden" >
      {/* coin combo multiplier progress bar */}
      <div className="border-b-[3px] border-black absolute top-0 left-0 w-full h-[5vh] bg-black bg-opacity-40 flex items-center">
        <div className="h-full border-x-[3px] border-black bg-[#F89414]" style={{
          width: `${(coinComboMultiplier / 10000) * 100}%`,
        }}></div>
        {/* Display current coin combo multiplier */}
        <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
          <span className="text-[3vh]">{(coinComboMultiplier / 1000).toFixed(2)}s</span>
        </div>
      </div>
      {/* Target hit counter */}
      <div className="absolute top-[3vh] left-1/2 transform -translate-x-1/2 text-center text-[10vh]">
        {targetHitsCount}
      </div>
      {/* Coin counter */}
      <div className="absolute top-[5vh] left-[2vw] flex items-center">
        <img src="/btclogo.png" alt="BTC Logo" style={{ width: '5vh', height: '5vh' }} className="border-[3px] border-black rounded-full" />
        {/* Spacer div */}
        <div style={{ width: '0.5vw' }}></div>
        <div>
          {Coin.toFixed(5)}
        </div>
      </div>
      {/* target spawn canvas */}
      <div className="h-screen w-screen absolute" onMouseDown={onTargetMiss} style={{ cursor: "url('/greendot.png') 32 32, auto" }}>
        {/* Render each target */}
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
      {isStoreOpen && (
        <div className="absolute w-screen h-[83.5vh] top-[16.5vh] bg-gray-200 flex flex-col border-t-[3px] border-black">
          {/* "UPGRADE" text section */}
          <div className="bg-green-200 text-center py-[0.25vh] text-[5vh]">UPGRADE</div>
          {/* Grid section */}
          <div className="grid grid-cols-5 grid-rows-3 flex-grow p-[1.5px]">
            {Array.from({ length: 15 }).map((_, upgradeID) => (
              <div
                key={upgradeID}
                className={`border-r-[3px] border-b-[3px] border-black ${upgradeID % 5 === 0 ? 'border-l-[3px]' : ''
                  } ${upgradeID < 5 ? 'border-t-[3px]' : ''}`}
              >
                <div>{upgradeID + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
