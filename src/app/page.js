"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {

  // Sound volume state
  const [volume, setVolume] = useState(0.2);


  // app loading state
  const [isLoading, setIsLoading] = useState(true);

  // game paused state
  const [isGamePaused, setIsGamePaused] = useState(false);

  // Store open state
  const [isShopOpen, setIsShopOpen] = useState(false);

  // game state when leveling up
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // menu overlay state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // pause game when menu or level up overlay is open
  useEffect(() => {
    setIsGamePaused(isMenuOpen || isLevelingUp);
  }, [isMenuOpen, isLevelingUp]);

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

  //  coin combo multiplier in integer
  const [combo, setCombo] = useState(0);





  // Store items
  const [storeItems, setStoreItems] = useState([
    { id: 0, buff: '+1 target', baseCost: 0.42, owned: 0, growthRate: 15 },
    { id: 1, buff: '-10% combo decrease', baseCost: 0.69, owned: 0, growthRate: 5 },
    { id: 2, buff: '-10% miss penalty', baseCost: 3.33, owned: 0, growthRate: 5 },
    { id: 3, buff: '+10% target size', baseCost: 6.9, owned: 0, growthRate: 30 },
    { id: 4, buff: '+1 base coin', baseCost: 11, owned: 0, growthRate: 1.3 },
    { id: 5, buff: '+10% combo increase', baseCost: 42, owned: 0, growthRate: 4 },
    { id: 6, buff: '+1 max combo', baseCost: 99, owned: 0, growthRate: 13 },
    { id: 7, buff: '+10% coins', baseCost: 333, owned: 0, growthRate: 7 },
    { id: 8, buff: '+25% speed reward', baseCost: 420, owned: 0, growthRate: 30 },
    { id: 9, buff: '-10% item cost', baseCost: 999, owned: 0, growthRate: 15 },
  ]);

  // amount of combo and coin loss on miss in percentage
  const [missPenaltyPercentage, setMissPenaltyPercentage] = useState(1);

  // Initial decrease rate in percentage per milliseconds
  const [comboDecreaseRate, setComboDecreaseRate] = useState(0.0035);

  // Target size in % of base size
  const [targetSizePercentage, setTargetSizePercentage] = useState(100);
  const baseTargetSize = 85; // Base size in px

  // State to track the base coin reward
  const [baseCoinReward, setBaseCoinReward] = useState(1);

  // combo increase multiplier
  const [comboIncreaseMultiplier, setComboIncreaseMultiplier] = useState(1.1);

  // max coin combo limit
  const [maxComboLimit, setMaxComboLimit] = useState(10);

  // target hit interval speed reward multiplier
  const [intervalSpeedRewardMultiplier, setIntervalSpeedRewardMultiplier] = useState(1);

  // item cost reduction rate
  const [itemCostReductionMultiplier, setItemCostReductionMultiplier] = useState(1);





  // XP progress towards next level
  const [playerProgress, setPlayerProgress] = useState({ currentXP: 0, currentLevel: 1 });
  const [baseXPGainPerHit, setBaseXPGainPerHit] = useState(1); // Base XP gain per target hit

  // Function to calculate the XP needed to level up
  const XPNeededToLevelUp = (level) => {
    const baseXP = 50; // XP needed for level 1 to 2
    const growthFactor = 1.5; // Determines how much more XP is needed for each subsequent level
    const exponentBase = 1.07; // Determines how much the difficulty increases per level

    if (level === 1) {
      return baseXP;
    }

    return Math.floor(baseXP * Math.pow(growthFactor, Math.pow(level, exponentBase)));
  };

  // handle xp gain and level up on target hit
  const addXPAndCheckLevelUp = (XPGained) => {
    setPlayerProgress(prevProgress => {
      let newCurrentXP = prevProgress.currentXP + XPGained;
      let currentLVL = prevProgress.currentLevel;
      let XPNeeded = XPNeededToLevelUp(currentLVL);

      // Check if the player has enough XP to level up
      if (newCurrentXP >= XPNeeded) {
        newCurrentXP -= XPNeeded;
        currentLVL++;
        setIsLevelingUp(true);
      }

      return { currentXP: newCurrentXP, currentLevel: currentLVL };
    });
  };





  // State to determine if the user is on a mobile device
  const [isMobile, setIsMobile] = useState(false);

  // check if user is on mobile
  useEffect(() => {
    // Detect mobile users
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  // Touch event states
  const [startTouchY, setStartTouchY] = useState(null);

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

  // touch event listeners
  useEffect(() => {
    // Add touch event listeners
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startTouchY]); // Dependencies






  // New state to track if the player can afford any shop item
  const [canAfford, setCanAfford] = useState(false);

  // Update canAfford state whenever coins or storeItems change
  useEffect(() => {
    const affordable = storeItems.some(item => Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned));
    setCanAfford(affordable);
  }, [Coin, storeItems]);




  // level up upgrade pool
  const levelUpUpgradePool = [
    {
      //base xpgainperhit++
      name: "+1 base xp",
      effect: () => {
        setBaseXPGainPerHit(baseXPGainPerHit => baseXPGainPerHit + 1);
        setIsLevelingUp(false);
      }
    },
    {
      name: "+1 bot",
      effect: () => {

        setIsLevelingUp(false);
      }
    },
    {
      name: "+10% bot speed",
      effect: () => {

        setIsLevelingUp(false);
      }
    }
  ];





  // Format any amount to 2 decimal places if fractional and significant
  const formatAmount = (amount) => {
    if (amount % 1 === 0 || parseFloat(amount.toFixed(2)) % 1 === 0) {
      return `${Math.floor(amount)}`;
    } else {
      return amount.toFixed(2);
    }
  };

  // Generalized function for applying a multiplicative change %
  const applyMultiplicativeChange = (currentValue, changePercentage = 0.1) => {
    // For reduction, ie -10%, changePercentage should be negative
    return currentValue * (1 + changePercentage);
  };

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




  // Base coin reward bonus function based on time elapsed since last target hit
  const calculateIntervalSpeedCoinBonus = (timeDifference) => {
    // Cap the minimum time difference at 50ms
    const effectiveTimeDifference = Math.max(timeDifference, 50);
    // Calculate potential reward based on the formula and multiply by baseCoinReward
    const potentialReward = baseCoinReward * (1.35 ** ((1000 - effectiveTimeDifference) * 0.01 * intervalSpeedRewardMultiplier));
    // Return 1 as the minimum potential reward or the calculated potential reward
    return potentialReward < 1 || timeDifference === 0 ? baseCoinReward : potentialReward;
  };



  // coin combo multiplier decrease (variable rate)
  useEffect(() => {
    let intervalId;

    if (!isGamePaused) {
      intervalId = setInterval(() => {
        setCombo(prevCombo => {
          const decreaseAmount = prevCombo * comboDecreaseRate;
          const additionalDecrease = prevCombo <= (maxComboLimit * 0.033) ? 0.00005 * maxComboLimit : 0;
          return Math.max(0, prevCombo - decreaseAmount - additionalDecrease);
        });
      }, 1);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [comboDecreaseRate, maxComboLimit, isGamePaused]); //dependencies





  // Coin reward per target hit
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

  // Function to play the hit sound
  const playHitSound = () => {
    if (typeof window !== "undefined") {
      const hitSound = new Audio('/hit.mp3');
      hitSound.volume = volume;
      hitSound.play();
    }
  };

  // when u hit a target
  const onTargetHit = (targetID, event) => {
    // Play the hit sound
    playHitSound();

    // Remove the target and add a new one
    regeneratePosition(targetID);
    // Increase the target hit counter
    setTargetHitsCount(prevCount => prevCount + 1);
    const finalCoinEarned = targetHitCoinReward();

    // Increase combo multiplier by 10% max combo * comboIncreaseMultiplier on target hit
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo + 0.1 * maxComboLimit * (comboIncreaseMultiplier)));


    // Multiply XP gain by the combo multiplier 
    const XPGained = baseXPGainPerHit * Math.max(1, combo); // Ensure the multiplier is at least 1
    // Add the XP and check for level up
    addXPAndCheckLevelUp(XPGained);

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
    //coin loss
    setCoin(prevCoin => Math.max(0, prevCoin * (1 - missPenaltyPercentage)));
    //combo loss
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo - prevCombo * (missPenaltyPercentage)));
    //XP loss
    setPlayerProgress(prevProgress => {
      const newXP = Math.max(0, prevProgress.currentXP * (1 - missPenaltyPercentage));
      return { ...prevProgress, currentXP: newXP };
    });

    // Calculate adjustment towards center for the popup
    const adjustmentX = event.clientX < window.innerWidth / 2 ? 100 : -100;
    const adjustmentY = event.clientY < window.innerHeight / 2 ? 50 : -50;
    // Create a loss popup at the click position
    const lossPopup = {
      id: Date.now(),
      x: event.clientX + adjustmentX,
      y: event.clientY + adjustmentY,
      amount: `-${formatAmount(missPenaltyPercentage * 100)}%`,
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
    return parseFloat((baseCost * Math.pow(growthRate, owned))) * itemCostReductionMultiplier;
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
      case '+10% combo increase':
        setComboIncreaseMultiplier(prevComboIncreaseMultiplier => prevComboIncreaseMultiplier + 0.1); //base 10% increase
        break;
      case '+1 max combo':
        setMaxComboLimit(prevLimit => prevLimit + 1);
        break;
      case '+10% coins':
        // Logic for +10% coins
        break;
      case '+25% speed reward':
        setIntervalSpeedRewardMultiplier(prevMultiplier => prevMultiplier + 0.4); // flat + 0.4 multiplier
        break;
      case '-10% item cost':
        setItemCostReductionMultiplier(prevRate => applyMultiplicativeChange(prevRate, -0.1)); //log decrease
        break;
      default: console.log('Invalid item description:', buff);
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
      // handle space bar to shop logic
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

  // Event listener for Esc key to toggle menu overlay
  useEffect(() => {
    const toggleMenu = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(prevState => !prevState);
      }
    };

    window.addEventListener('keydown', toggleMenu);

    return () => {
      window.removeEventListener('keydown', toggleMenu);
    };
  }, []);


  // Combo bar color state
  const [comboBarColor, setComboBarColor] = useState('rgb(248,148,20)'); // Start with orange

  // Function to determine the combo bar color based on timeElapsed
  const getComboBarColor = (timeElapsed) => {
    // Calculate the potential reward based on time elapsed
    const potentialReward = calculateIntervalSpeedCoinBonus(timeElapsed);
    // Calculate the maximum expected reward for normalization
    const maxExpectedReward = calculateIntervalSpeedCoinBonus(50); // This uses 50ms as the cap as defined earlier

    // Normalize the potential reward, which is higher for lower timeElapsed values
    let normalizedFactor = potentialReward / maxExpectedReward;

    // Since we need the color to be more intense (more red) for higher rewards (lower timeElapsed),
    // we actually want to use the inverse of the normalized factor for our color intensity.
    normalizedFactor = 1 - normalizedFactor; // Now, 0 means high reward (more red), and 1 means low reward (more orange)

    // Interpolate color based on inverted normalizedFactor
    // Starting color when normalizedFactor is 0 (high reward): rgb(248, 148, 20) (orange)
    // Ending color when normalizedFactor is 1 (low reward): rgb(229, 57, 53) (red)
    const redComponent = 229 + (248 - 229) * normalizedFactor;
    const greenComponent = 57 + (148 - 57) * normalizedFactor;
    const blueComponent = 53 + (20 - 53) * normalizedFactor;

    return `rgb(${Math.round(redComponent)}, ${Math.round(greenComponent)}, ${Math.round(blueComponent)})`;
  };

  // Update the combo bar color based on timeElapsed
  const updateComboBarColor = () => {
    const currentTime = Date.now();
    const timeElapsed = currentTime - lastTargetHitTimestamp;

    // Call your function to determine the combo bar color based on timeElapsed
    // For example, you can map timeElapsed to a range [0, maximumThreshold] and interpolate the color between red and orange.
    const comboBarColor = getComboBarColor(timeElapsed);

    // Update your combo bar color state here
    setComboBarColor(comboBarColor); // Assume you have a state for this

    // Continue the animation loop
    requestAnimationFrame(updateComboBarColor);
  };

  // Call the updateComboBarColor function when the component mounts
  useEffect(() => {
    // Start the animation loop
    const animationFrameId = requestAnimationFrame(updateComboBarColor);

    // Cleanup function to cancel the animation frame when the component unmounts
    return () => cancelAnimationFrame(animationFrameId);
  }, [lastTargetHitTimestamp]); // Dependencies array



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
            className="absolute bg-[#e53935] rounded-full border-[3px] border-black"
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
        <div className=" border-b-[3px] border-black absolute top-0 left-0 w-full h-[5vh] flex items-center" style={{ backgroundColor: `${comboBarColor.replace('rgb', 'rgba').replace(')', ', 0.6)')}` }}>
          {/* Combo bar filler */}
          <div className={` h-full border-black bg-[#F89414] ${combo == 0 ? '' : 'border-r-[3px]'} `} style={{ width: `${(combo / maxComboLimit) * 100}%`, backgroundColor: comboBarColor }}></div>
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
          <div className={`h-full border-black bg-blue-500 ${playerProgress.currentXP == 0 ? '' : 'border-r-[3px]'}`} style={{ width: `${playerProgress.currentXP / ((XPNeededToLevelUp(playerProgress.currentLevel))) * 100}%` }}></div>
          {/* Display level on the far left */}
          <div className="absolute left-0 h-full flex items-center px-4">
            <span className="text-[3vh]">level {playerProgress.currentLevel}</span>
          </div>
          {/* Display current XP in the middle of the bar */}
          <div className="absolute left-0 right-0 h-full flex items-center justify-center">
            <span className="text-[3vh]">{formatAmount(playerProgress.currentXP)}/{XPNeededToLevelUp(playerProgress.currentLevel)}</span>
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
          <div className="grid grid-cols-3 grid-rows-3 lg:grid-cols-5 lg:grid-rows-3 gap-[2vh] p-[2vh]">
            {storeItems.map((item, index) => {
              // Determine if the current item can be afforded
              const affordable = Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned);

              return (
                <div
                  key={item.id}
                  className={`flex flex-col bg-green-200 px-[2vw] py-[1vh] bg-opacity-70 border-[3px] border-black justify-center items-center ${!affordable ? "opacity-40" : ""}`}
                  onMouseDown={() => affordable && purchaseItem(item.id)}
                >
                  {/* Item description */}
                  <div className="flex-2 flex justify-center items-center h-full text-[2.5vh] lg:text-[3vh] text-center">{item.buff}</div>
                  {/* Item cost */}
                  <div className="flex-1 h-full flex items-center justify-center">
                    <img src="/btclogo.png" alt="BTC Logo" className="w-[3.5vh] h-[3.5vh] lg:w-[5vh] lg:h-[5vh] border-[3px] border-black rounded-full" />
                    <span className="text-[3.5vh] lg:text-[5vh] ml-2">{formatAmount(calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* level up overlay */}
      {isLevelingUp && (
        <div className="absolute bg-black bg-opacity-60 w-screen h-screen flex justify-center items-center">
          <div className="flex flex-col justify-center items-center w-full h-[80%] ">
            <div className="text-gray-200" >level up!</div>
            <div className="text-gray-200 text-[2.5vh] lg:text-[3.5vh] mb-4">choose an upgrade:</div>
            <div className="px-[8vw] h-full grid grid-cols-1 lg:grid-cols-3 gap-[2vh] lg:gap-[2vw]">
              {levelUpUpgradePool.map((choice, index) => (
                <button
                  key={index}
                  className="bg-gray-200 px-[4vw] py-[4vh] text-center border-[3px] border-black"
                  onClick={() => {
                    choice.effect();
                  }}
                >
                  {choice.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* menu overlay */}
      {isMenuOpen && (
        <div className="text-gray-200 absolute bg-black bg-opacity-90 w-screen h-screen flex flex-col justify-center items-center">
          <div className='text-[10vh] h-[20vh] flex justify-center items-center' >paused</div>
          {/* sound control */}
          <div className='h-[80vh] flex flex-row justify-center items-center' >
            <img src="/volume.png" alt="volume icon" style={{ width: '7vh', height: '7vh' }} />
            <div className='w-[2vw]'></div>
            <input
              id="volume-control"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-[20vw] h-[1.5vh] bg-gray-200 accent-red-600 outline-none"
              style={{ backgroundSize: `${volume * 100}% 100%` }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
