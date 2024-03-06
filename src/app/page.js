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


  // New state to track if the player can afford any shop item
  const [canAfford, setCanAfford] = useState(false);

  // Update canAfford state whenever coins or storeItems change
  useEffect(() => {
    const affordable = storeItems.some(item => Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned));
    setCanAfford(affordable);
  }, [Coin, storeItems]);








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
  //TO LINK WITH ITEM BUFF
  //decrease rate drop off
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCoinComboMultiplier(prevCoinComboMultiplier => Math.max(0, prevCoinComboMultiplier - 15));
    }, 10);

    return () => clearInterval(intervalId);
  }, []);

  // Coin reward per target hit
  //TO LINK WITH ITEM BUFF
  //coin boost speed buff
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
  //TO LINK WITH ITEM BUFF 
  //+x coin on hit
  const onTargetHit = (targetID) => {
    regeneratePosition(targetID);
    setTargetHitsCount(prevCount => prevCount + 1);
    targetHitCoinReward();
    setCoinComboMultiplier(prevCoinComboMultiplier => Math.min(10000, prevCoinComboMultiplier + 1000));
  };

  // target miss penalty
  //TO LINK WITH ITEM BUFF
  //decrease penalties
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
            applyPurchasedItem(item.buff);
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
    }, 500); // 200ms delay
  }, []);

  // space bar input logic (press or hold to open shop)
  useEffect(() => {
    let timer = null;
    let toggleMode = true; // Initially, allow toggling.
    let holdMode = false; // Initially, not in hold mode.

    const handleKeyDown = (event) => {
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault(); // Prevent default behavior (e.g., page scrolling)
        if (toggleMode) {
          // If in toggle mode, open the shop and prepare to check for holding.
          setIsCoinStoreOpen(prevIsCoinStoreOpen => !prevIsCoinStoreOpen);
          toggleMode = false; // Disable toggle mode to prevent toggling when holding.

          // Start a timer to check for holding.
          timer = setTimeout(() => {
            if (!holdMode) { // After X time in ms, if not already in hold mode, enable it.
              holdMode = true;
              toggleMode = false;
            }
          }, 150);
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === ' ' || event.code === 'Space') {
        clearTimeout(timer); // Stop the timer regardless of whether it was a tap or hold.
        if (holdMode) {
          // If it was a hold, close the shop and reset modes.
          setIsCoinStoreOpen(false);
          holdMode = false;
        }
        toggleMode = true; // Re-enable toggle mode after releasing the key.
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // loading screen
  if (isLoading) {
    return <div className="bg-blue-500 font-bold h-screen w-screen overflow-hidden" >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-[10vh] md:text-[20vh]">
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
        { /* hold space bar to open shop indicator when item is affordable */}
        {canAfford && (
          <div className="text-[4vh] absolute bottom-[5vh] left-1/2 transform -translate-x-1/2 flex items-center justify-center ">
            <img src="/spacebar.png" alt="Open Shop" style={{ width: '12vh', height: '3vh' }} />
            <div className="w-[0.5vw]"></div>
            <span>to shop</span>
          </div>
        )}

        {/* coin combo multiplier progress bar */}
        <div className="border-b-[3px] border-black absolute top-0 left-0 w-full h-[5vh] bg-[#F89414] bg-opacity-60 flex items-center">
          <div className={`h-full  border-black bg-[#F89414] ${coinComboMultiplier == 0 ? '' : 'border-r-[3px]'} `} style={{
            width: `${(coinComboMultiplier / 10000) * 100}%`,
          }}></div>
          {/* Display current coin combo multiplier */}
          {coinComboMultiplier > 0 && (
            <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
              <span className="text-[3vh]">combo <span style={{ textTransform: 'lowercase' }}>x</span>{(coinComboMultiplier / 1000).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Target hit counter */}
        <div className="absolute top-[3vh] right-[2vw] md:left-1/2 md:-translate-x-1/2 md:text-center text-[10vh]">
          {targetHitsCount}
        </div>


        {/* Coin counter */}
        <div className="absolute top-[5vh] left-[2vw] flex items-center">
          <img src="/btclogo.png" alt="BTC Logo" style={{ width: '5vh', height: '5vh' }} className="border-[3px] border-black rounded-full" />
          <div style={{ width: '1vw' }}></div>
          <div>
            {Coin.toFixed(5)}
          </div>
        </div>
      </div>

      {/* coin store */}
      {isCoinStoreOpen && (
        <div className="absolute overflow-hidden w-screen h-[83.5vh] top-[16.5vh] bg-blue-400 flex flex-col bg-opacity-80">
          {/* "UPGRADE" text section */}
          <div className="bg-opacity-85 bg-blue-400 text-center py-[0.25vh] text-[4vh] border-t-[3px] border-b-[3px] border-black">
            shop
          </div>
          {/* Grid section */}
          <div className="grid grid-cols-5 grid-rows-3 gap-[2vh] flex-grow p-[2vh]">
            {storeItems.map((item, index) => {
              // Determine if the current item can be afforded
              const affordable = Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned);

              return (
                <div
                  key={item.id}
                  className={`flex flex-col bg-green-200 px-[1vw] pt-[5vh] bg-opacity-70 border-[3px] border-black justify-center items-center ${!affordable ? "opacity-40" : ""}`}
                  onMouseDown={() => affordable && purchaseItem(item.id)}
                >
                  <div className="flex-1 text-[3vh] text-center">{item.buff}</div>
                  {/* Item cost */}
                  <div className="flex-1 flex items-center justify-center mt-2">
                    <img src="/btclogo.png" alt="BTC Logo" className="w-[5vh] h-[5vh] border-[3px] border-black rounded-full" />
                    <span className="ml-2">{calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
