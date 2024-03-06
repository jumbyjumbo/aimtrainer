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
    { id: 0, buff: '+1 target', baseCost: 0.42, owned: 0, growthRate: Math.E },
    { id: 1, buff: '-10% combo decrease', baseCost: 0.69, owned: 0, growthRate: Math.E },
    { id: 2, buff: '+1 max combo', baseCost: 1, owned: 0, growthRate: 1.07 },
    { id: 3, buff: '+10% target size', baseCost: 11, owned: 0, growthRate: Math.E },
    { id: 4, buff: '+1 coin on hit', baseCost: 99, owned: 0, growthRate: Math.E },
    { id: 5, buff: '+10% combo growth', baseCost: 1000, owned: 0, growthRate: Math.E },
    { id: 6, buff: '+10% coins', baseCost: 9999, owned: 0, growthRate: 1.07 },
    { id: 7, buff: '+100% speed reward', baseCost: 10000, owned: 0, growthRate: 1.07 },
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

  // get current cost of an item depending on how many owned
  const calculateCurrentItemCost = (baseCost, growthRate, owned) => {
    return parseFloat((baseCost * Math.pow(growthRate, owned)).toFixed(2));
  };

  // Function to apply the effects of a purchased item
  const applyPurchasedItem = (buff) => {
    switch (buff) {
      case '+1 target':
        addTarget();
        break;
      case '-10% combo decrease':
        // Logic to reduce the combo decrease rate by 10%.
        break;
      case '+1 max combo':
        // Logic to increase the maximum combo duration by 1 second.
        break;
      case '+10% target size':
        // Logic to increase the target size by 10%.
        break;
      case '+1 coin on hit':
        // Logic to increase coin earned per hit by 1.
        break;
      case '+10% combo growth':
        // Logic to increase the combo growth rate by 10%.
        break;
      case '+10% coins':
        // Logic to increase the coin earnings by 10%.
        break;
      case '+100% speed reward':
        // Logic to double the speed reward.
        break;
    }
  };



  // Function to purchase an item from the store
  const purchaseItem = (itemId) => {
    const itemIndex = storeItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      const item = storeItems[itemIndex];
      const currentCost = calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned);
      // Check if the player has enough Coin to purchase the item
      if (Coin >= currentCost) {
        setCoin(prevCoin => prevCoin - currentCost);
        const updatedStoreItems = storeItems.map((currentItem, index) => {
          // Apply the purchased item
          if (index === itemIndex) {
            // Apply the effects of the purchased item based on its description
            applyPurchasedItem(item.description);
            return { ...currentItem, owned: currentItem.owned + 1 };
          }
          return currentItem;
        });
        setStoreItems(updatedStoreItems);
      }
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
      {/* target spawn canvas */}
      <div className=" h-screen w-screen absolute" onMouseDown={onTargetMiss} style={{ cursor: "url('/greendot.png') 32 32, auto" }}>
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

      { /* UI  */}
      <div className="pointer-events-none">
        { /* press space bar to open shop indicator  */}
        <div className="text-[4vh] absolute bottom-[5vh] left-1/2 transform -translate-x-1/2 flex items-center justify-center ">
          <img src="/spacebaricon.png" alt="Open Shop" style={{ width: '8vh', height: '8vh' }} />
          <div style={{ width: '0.5vw' }}></div>
          <span>SHOP</span>
        </div>

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

      </div>


      {/* coin store */}
      {isCoinStoreOpen && (
        <div className="absolute overflow-hidden w-screen h-[83.5vh] top-[16.5vh] bg-blue-500 flex flex-col bg-opacity-80">
          {/* "UPGRADE" text section */}
          <div className="bg-opacity-85 bg-blue-500 text-center py-[0.25vh] text-[4vh] border-t-[3px] border-b-[3px] border-black">STORE</div>
          {/* Grid section */}
          <div className="grid grid-cols-5 grid-rows-3 gap-[2vh] flex-grow p-[2vh]">
            {storeItems.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col bg-green-200 px-[1vw] pt-[5vh] bg-opacity-70 border-[3px] border-black"
                onMouseDown={() => purchaseItem(item.id)}
              >
                <div className="flex-1 text-[4vh] self-center">{item.buff}</div>
                {/* Item cost */}
                <div className="flex-1 flex items-center">
                  <img src="/btclogo.png" alt="BTC Logo" style={{ width: '5vh', height: '5vh' }} className="border-[3px] border-black rounded-full" />
                  <div style={{ width: '0.5vw' }}></div>
                  <span>{calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
