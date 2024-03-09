"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {
  // loading state
  const [isLoading, setIsLoading] = useState(true);

  // target positions
  const [targetPositions, setTargetPositions] = useState(Array(1).fill().map(() => ({ x: 0, y: 0 })));

  // target hit counter
  const [targetHitsCount, setTargetHitsCount] = useState(0);

  //  target hit interval in milliseconds
  const [lastTargetHitTimestamp, setLastTargetHitTimestamp] = useState(0);

  // State to track the amount of Coin the player has
  const [Coin, setCoin] = useState(0);

  //  track ontargethit/miss coin popups
  const [coinPopups, setCoinPopups] = useState([]);

  //  coin combo multiplier progress in milliseconds
  const [combo, setCombo] = useState(0);

  // Store open state
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Store items
  const [storeItems, setStoreItems] = useState([
    { id: 0, buff: '+1 target', baseCost: 0.42, owned: 0, growthRate: 15 },
    { id: 1, buff: '-10% combo decrease', baseCost: 0.69, owned: 0, growthRate: 5 },
    { id: 2, buff: '-10% miss penalty', baseCost: 3.33, owned: 0, growthRate: 5 },
    { id: 3, buff: '+10% target size', baseCost: 6.9, owned: 0, growthRate: 30 },
    { id: 4, buff: '+1 base coin', baseCost: 11, owned: 0, growthRate: 1.1 },
    { id: 5, buff: '+10% combo growth', baseCost: 99, owned: 0, growthRate: 4 },
    { id: 6, buff: '+1 max combo', baseCost: 1000, owned: 0, growthRate: 15 },
    { id: 7, buff: '+10% coins', baseCost: 9999, owned: 0, growthRate: 1.1 },
    { id: 8, buff: '+100% speed reward', baseCost: 10000, owned: 0, growthRate: 100 },
  ]);

  // amount of combo and coin loss on miss in %
  const [missPenaltyPercentage, setMissPenaltyPercentage] = useState(100);

  // Initial decrease rate in percentage per millisecond
  const [comboDecreaseRate, setComboDecreaseRate] = useState(0.003);

  // Target size in % of base size
  const [targetSizePercentage, setTargetSizePercentage] = useState(100);
  const baseTargetSize = 85; // Base size in px

  // State to track the base coin reward
  const [baseCoinReward, setBaseCoinReward] = useState(1);

  // combo growth rate in % of base growth
  const [comboGrowthRate, setComboGrowthRate] = useState(100);

  // max coin combo limit
  const [maxComboLimit, setMaxComboLimit] = useState(10);

  // target hit interval speed reward multiplier in %
  const [intervalSpeedRewardMultiplier, setIntervalSpeedRewardMultiplier] = useState(100);





  // xp progress towards next level in %
  const [playerProgress, setPlayerProgress] = useState({ currentXP: 0, currentLevel: 1 });
  const xpGainPerHit = 1; // xp gain per target hit
  const xpNeededToLevelUp = Math.floor(Math.pow(1.5, playerProgress.currentLevel * 2 + 3)); // function to calculate level progression




  // Touch event states
  const [startTouchY, setStartTouchY] = useState(null);

  // State to determine if the user is on a mobile device
  const [isMobile, setIsMobile] = useState(false);

  // check if user is on mobile
  useEffect(() => {
    // Detect mobile users
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  // New state to track if the player can afford any shop item
  const [canAfford, setCanAfford] = useState(false);

  // Update canAfford state whenever coins or storeItems change
  useEffect(() => {
    const affordable = storeItems.some(item => Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned));
    setCanAfford(affordable);
  }, [Coin, storeItems]);








  // Format any amount to 2 decimal places if fractional and significant
  const formatAmount = (amount) => {
    if (amount % 1 === 0 || parseFloat(amount.toFixed(2)) % 1 === 0) {
      return `${Math.floor(amount)}`;
    } else {
      return amount.toFixed(2);
    }
  };

  // Handler for touch start event
  const handleTouchStart = (e) => {
    const touchY = e.touches[0].clientY; // Get the starting Y position
    setStartTouchY(touchY);
  };

  // Handler for touch end event
  const handleTouchEnd = (e) => {
    const touchY = e.changedTouches[0].clientY; // Get the ending Y position
    if (startTouchY != null) {
      // Determine swipe direction
      const deltaY = startTouchY - touchY;
      if (deltaY > 50) { // Swiped upwards
        setIsShopOpen(true);
      } else if (deltaY < -50) { // Swiped downwards
        setIsShopOpen(false);
      }
    }
  };

  useEffect(() => {
    // Add touch event listeners
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startTouchY]); // Depend on startTouchY to capture changes


  const generatePosition = () => {
    // Calculate the target's radius.
    const targetRadius = (baseTargetSize * targetSizePercentage) / 100 / 2;

    // Random position adjusted for the margin and size increase.
    const x = Math.random() * (window.innerWidth - targetRadius * 2) + targetRadius;
    const y = Math.random() * (window.innerHeight - targetRadius * 2) + targetRadius;

    // Return the calculated position.
    return { x, y };
  };

  // regenerate position for a single target
  const regeneratePosition = (targetID) => {
    setTargetPositions(prevPositions =>
      prevPositions.map((pos, index) => index === targetID ? generatePosition() : pos)
    );
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

  // Generalized function for applying a multiplicative change %
  const applyMultiplicativeChange = (currentValue, changePercentage = 0.1) => {
    // For reduction, ie -10%, changePercentage should be negative
    return currentValue * (1 + changePercentage);
  };






  // Base coin reward bonus function based on time elapsed since last target hit
  const calculateIntervalSpeedCoinBonus = (timeDifference) => {
    // Calculate potential reward based on the formula and multiply by baseCoinReward
    const potentialReward = baseCoinReward * (1.35 ** ((1000 - timeDifference) * 0.01 * (intervalSpeedRewardMultiplier / 100)));
    // Return 1 as the minimum potential reward or the calculated potential reward
    return potentialReward < 1 || timeDifference === 0 ? baseCoinReward : potentialReward;
  };

  // coin combo multiplier decrease (variable rate)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCombo(prevCombo => {
        // Calculate the new value based on a 0.1% decrease
        const decreaseAmount = prevCombo * comboDecreaseRate;
        return Math.max(0, prevCombo - decreaseAmount);
      });
    }, 1);

    return () => clearInterval(intervalId);
  }, [comboDecreaseRate]); // This effect depends on comboDecreaseRate

  // Coin reward per target hit
  //TO LINK WITH ITEM BUFF
  //coin boost speed buff
  const targetHitCoinReward = () => {
    const currentTime = Date.now();
    const timeDifference = lastTargetHitTimestamp > 0 ? currentTime - lastTargetHitTimestamp : 0;
    setLastTargetHitTimestamp(currentTime);
    // base Coin reward based on last target hit interval
    const speedCoinBonus = calculateIntervalSpeedCoinBonus(timeDifference);
    // bonus coin combo multiplier based on progress bar
    const comboCoinBonus = 0.01 * (speedCoinBonus * Math.max(1, combo));

    // Find the "+10% coins" item and calculate its bonus
    const coinBonusItem = storeItems.find(item => item.buff === '+10% coins');
    const coinBonusMultiplier = 1 + (0.1 * coinBonusItem.owned); // 10% bonus for each owned

    // Apply the "+10% coins" bonus
    const finalCoinEarned = comboCoinBonus * coinBonusMultiplier;

    // Update Coin state with the final amount earned
    setCoin((prevCoin) => prevCoin + finalCoinEarned);
    return finalCoinEarned;
  };





  // when u hit a target
  const onTargetHit = (targetID, event) => {

    // xp progression on target hit
    setPlayerProgress(prevProgress => {
      let newXP = prevProgress.currentXP + xpGainPerHit;
      let newLevel = prevProgress.currentLevel;

      // check if xp is enough to level up
      if (newXP >= xpNeededToLevelUp) {
        newLevel += 1; // level up
        newXP -= xpNeededToLevelUp; // Reset XP to 0
      }

      return { currentXP: newXP, currentLevel: newLevel };
    });


    regeneratePosition(targetID);
    setTargetHitsCount(prevCount => prevCount + 1);
    const finalCoinEarned = targetHitCoinReward();
    // Increase combo multiplier by 1 * comboGrowthRate on target hit
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo + 1 * (comboGrowthRate / 100)));


    // Calculate adjustment towards center for the popup
    const adjustmentX = event.clientX < window.innerWidth / 2 ? 100 : -100;
    const adjustmentY = event.clientY < window.innerHeight / 2 ? 50 : -50;
    // popup for total coin gain on hit
    const newPopup = {
      id: Date.now(),
      x: event.clientX + adjustmentX,
      y: event.clientY + adjustmentY,
      amount: formatAmount(finalCoinEarned),
      type: 'gain',
    };
    setCoinPopups((prevPopups) => [...prevPopups, newPopup]);

    // Schedule the popup removal after 200ms
    setTimeout(() => {
      setCoinPopups((prevPopups) => prevPopups.filter(popup => popup.id !== newPopup.id));
    }, 500);
  };

  // target miss penalty
  const onTargetMiss = (event) => {
    // Apply the loss based on the current loss percentage
    setCoin(prevCoin => Math.max(0, prevCoin * (1 - missPenaltyPercentage / 100)));
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo - prevCombo * (missPenaltyPercentage / 100)));

    // Calculate adjustment towards center for the popup
    const adjustmentX = event.clientX < window.innerWidth / 2 ? 100 : -100;
    const adjustmentY = event.clientY < window.innerHeight / 2 ? 50 : -50;
    // Create a loss popup at the click position
    const lossPopup = {
      id: Date.now(),
      x: event.clientX + adjustmentX,
      y: event.clientY + adjustmentY,
      amount: `-${formatAmount(missPenaltyPercentage)}%`,
      type: 'loss',
    };
    setCoinPopups((prevPopups) => [...prevPopups, lossPopup]);

    // Schedule the popup removal after 200ms
    setTimeout(() => {
      setCoinPopups((prevPopups) => prevPopups.filter(popup => popup.id !== lossPopup.id));
    }, 1000);
  };




  // get current cost of an item depending on how many owned
  const calculateCurrentItemCost = (baseCost, growthRate, owned) => {
    return parseFloat((baseCost * Math.pow(growthRate, owned)));
  };

  // Function to apply the effects of a purchased item
  const applyPurchasedItem = (buff) => {
    switch (buff) {
      case '+1 target':
        addTarget();
        break;
      case '-10% combo decrease':
        setComboDecreaseRate(prevRate => applyMultiplicativeChange(prevRate, -0.1)); //log decrease
        break;
      case '-10% miss penalty':
        setMissPenaltyPercentage(prevPercentage => applyMultiplicativeChange(prevPercentage, -0.1)); //log decrease
        break;
      case '+10% target size':
        setTargetSizePercentage(prevSize => prevSize + 10); //base 10% increase
        break;
      case '+1 base coin':
        setBaseCoinReward(prevCoins => prevCoins + 1); //flat ++
        break;
      case '+10% combo growth':
        setComboGrowthRate(prevGrowthRate => prevGrowthRate + 10); //base 10% increase
        break;
      case '+1 max combo':
        setMaxComboLimit(prevLimit => prevLimit + 1);
        break;
      case '+10% coins':
        // Logic for +10% coins
        break;
      case '+100% speed reward':
        setIntervalSpeedRewardMultiplier(prevMultiplier => prevMultiplier + 100);
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






  // on load utilities (prevent scroll on mobile, generate targets, remove loading screen)
  useEffect(() => {
    // Prevent default touch behavior globally
    const preventDefaultTouch = (e) => e.preventDefault();
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    // Generate initial target positions
    setTargetPositions(targetPositions.map(() => generatePosition()));

    // Remove loading screen
    setIsLoading(false);

    // cleanup / remove event listeners
    return () => {
      document.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  // Add event listeners for space bar to open shop
  useEffect(() => {
    let timer = null;
    let toggleMode = true; // default is toggle mode.
    let holdMode = false;

    // keydown events
    const handleKeyDown = (event) => {
      // handkle space bar to shop logic
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault(); // Prevent default behavior (e.g., page scrolling)
        if (toggleMode) {
          // If in toggle mode, open the shop and prepare to check for holding.
          setIsShopOpen(previsShopOpen => !previsShopOpen);
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

    //keyup events
    const handleKeyUp = (event) => {
      // handle space bar to shop logic
      if (event.key === ' ' || event.code === 'Space') {
        clearTimeout(timer);
        if (holdMode) {
          setIsShopOpen(false);
          holdMode = false;
        }
        toggleMode = true;
      }
    };

    // Add event listeners for inputs
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
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-[10vh] lg:text-[20vh]">
        AIM TRAINER
      </div>
    </div>;
  }





  // Main game screen
  return (
    <main className="h-screen w-screen overflow-hidden" >
      {/* target spawn canvas */}
      <div className=" h-screen w-screen absolute overflow-hidden" onMouseDown={(e) => { e.stopPropagation(); onTargetMiss(e); }} style={{ cursor: "url('/greendot.png') 32 32, auto" }}>
        {/* target instances */}
        {targetPositions.map((targetPosition, targetID) => (
          <div
            key={targetID}
            onMouseDown={(e) => {
              e.stopPropagation();
              onTargetHit(targetID, e);
            }}
            className="absolute bg-red-600 rounded-full border-[3px] border-black"
            style={{
              left: `${targetPosition.x - (baseTargetSize * (targetSizePercentage / 100) / 2)}px`,
              top: `${targetPosition.y - (baseTargetSize * (targetSizePercentage / 100) / 2)}px`,
              width: `${baseTargetSize * (targetSizePercentage / 100)}px`, // Adjusted size
              height: `${baseTargetSize * (targetSizePercentage / 100)}px`, // Adjusted size
            }}
          />
        ))}
      </div>

      {/* HUD */}
      <div className="pointer-events-none">
        {/* coin combo multiplier progress bar */}
        <div className="border-b-[3px] border-black absolute top-0 left-0 w-full h-[5vh] bg-[#F89414] bg-opacity-60 flex items-center">
          <div className={`h-full border-black bg-[#F89414] ${combo == 0 ? '' : 'border-r-[3px]'} `} style={{
            width: `${(combo / maxComboLimit) * 100}%`,
          }}></div>
          {/* Display current coin combo multiplier */}
          {combo > 1 && (
            <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
              <span className="text-[3vh]">combo <span style={{ textTransform: 'lowercase' }}>x</span>{formatAmount(combo)}</span>
            </div>
          )}
        </div>

        {/* Target hit counter */}
        <div className="absolute top-[3.5vh] right-[2vw] lg:left-1/2 lg:-translate-x-1/2 lg:text-center lg:text-[10vh]">
          {targetHitsCount}
        </div>

        {/* Coin counter */}
        <div className="absolute top-[5vh] left-[2vw] flex items-center">
          <img src="/btclogo.png" alt="BTC Logo" style={{ width: '5vh', height: '5vh' }} className="border-[3px] border-black rounded-full" />
          <div style={{ width: '1vw' }}></div>
          <div>
            {formatAmount(Coin)}
          </div>
        </div>

        { /* can shop indicator */}
        {canAfford && (
          <div className="text-[3vh] w-full absolute bottom-[7vh] left-1/2 transform -translate-x-1/2 flex items-center justify-center">
            {isMobile ? (
              // Display text for mobile users
              <span>swipe up to shop</span>
            ) : (
              // Display image and text for non-mobile users
              <>
                <img src="/spacebar.png" alt="Open Shop" style={{ width: '12vh', height: '3vh' }} />
                <div className="w-[0.5vw]"></div>
                <span>to shop</span>
              </>
            )}
          </div>
        )}

        {/* XP Progress Bar */}
        <div className="border-t-[3px] border-black absolute bottom-0 left-0 w-full h-[5vh] bg-blue-500 bg-opacity-60 flex items-center">
          <div className={`h-full border-black bg-blue-500 ${playerProgress.currentXP == 0 ? '' : 'border-r-[3px]'}`} style={{ width: `${playerProgress.currentXP / (xpNeededToLevelUp) * 100}%` }}></div>
          {/* Display level on the far left */}
          <div className="absolute left-0 h-full flex items-center px-4">
            <span className="text-[3vh]">level {playerProgress.currentLevel}</span>
          </div>
          {/* Display current XP in the middle of the bar */}
          <div className="absolute left-0 right-0 h-full flex items-center justify-center">
            <span className="text-[3vh]">{playerProgress.currentXP}/{xpNeededToLevelUp}</span>
          </div>
        </div>


        {/* coin popups */}
        {coinPopups.map((popup) => (
          <div
            key={popup.id}
            className={`fixed transition-opacity ${popup.type === 'gain' ? 'animate-fadeOutGain text-[#F89414]' : 'animate-fadeOutLoss text-red-500'}`}
            style={{
              left: `${popup.x - 80}px`,
              top: `${popup.y - 40}px`,
            }}
          >
            {popup.amount > 0 ? `+${popup.amount}` : popup.amount}
          </div>
        ))}
      </div>

      {/* coin store */}
      {isShopOpen && (
        <div className="absolute overflow-hidden w-screen h-[83.5vh] top-[16.5vh] bg-blue-400 flex flex-col bg-opacity-80">
          {/* shop title */}
          <div className="flex justify-center items-center bg-opacity-85 h-[5.5vh] bg-blue-400 text-center text-[3.5vh] border-t-[3px] border-b-[3px] border-black">
            shop
          </div>

          {/* item list */}
          <div className="grid grid-cols-3 grid-rows-3 lg:grid-cols-5 lg:grid-rows-3 gap-[2vh]  p-[2vh]">
            {storeItems.map((item, index) => {
              // Determine if the current item can be afforded
              const affordable = Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned);

              return (
                <div
                  key={item.id}
                  className={`flex flex-col bg-green-200 mx-[2vw] my-[1vh] bg-opacity-70 border-[3px] border-black justify-center items-center ${!affordable ? "opacity-40" : ""}`}
                  onMouseDown={() => affordable && purchaseItem(item.id)}
                >
                  {/* Item description */}
                  <div className="flex-2 text-[2.5vh] lg:text-[3vh] text-center">{item.buff}</div>
                  {/* Item cost */}
                  <div className="flex-1 flex items-center justify-center">
                    <img src="/btclogo.png" alt="BTC Logo" className="w-[3.5vh] h-[3.5vh] lg:w-[5vh] lg:h-[5vh] border-[3px] border-black rounded-full" />
                    <span className="text-[3.5vh] lg:text-[5vh] ml-2">{formatAmount(calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned))}</span>
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
