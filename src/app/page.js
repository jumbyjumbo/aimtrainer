"use client"
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
//db
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
//auth
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyALhqznQk-LWgFCzjzP3OHfm624ZLFO_cs",
  authDomain: "aimtrainer-6dec5.firebaseapp.com",
  projectId: "aimtrainer-6dec5",
  storageBucket: "aimtrainer-6dec5.appspot.com",
  messagingSenderId: "281642412398",
  appId: "1:281642412398:web:5b46861f479c81077c797f",
  measurementId: "G-G29YT9VKFG"
};
// Init firebase
const app = initializeApp(firebaseConfig);
// init db
const db = getFirestore(app);
// init auth
const auth = getAuth(app);


// main component (full app)
export default function AimTrainer() {

  // Function to fetch game data from Firestore
  const fetchGameData = async (userId) => {
    const docRef = doc(db, 'players', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Game data retrieved from Firestore:', data);
      return data; // Return the fetched data
    } else {
      console.log("No saved data found in Firestore");
      return null; // Return null to indicate no data was found
    }
  };
  // apply item effects
  const applyItemEffectsBasedOnOwned = (updatedStoreItems) => {
    updatedStoreItems.forEach(item => {
      for (let i = 0; i < item.owned; i++) {
        applyPurchasedItem(item.buff);
      }
    });
  };
  // apply level up effects
  const applyLevelUpEffectsBasedOnOwned = (updatedLevelUpUpgrades) => {
    updatedLevelUpUpgrades.forEach(upgrade => {
      for (let i = 0; i < upgrade.owned; i++) {
        applyLevelUpUpgrades(upgrade.buff);
      }
    });
  };
  // apply game data to current game state
  const applyGameData = (data) => {
    // Set basic game data
    setScore(data.score);
    setCoin(data.coin);
    setPlayerProgress({ currentXP: data.xp, currentLevel: data.level });
    setVolume(data.volume);

    // Update the store items with the loaded data
    const updatedStoreItems = storeItems.map(item => {
      const loadedItem = data.storeItems.find(loadedItem => loadedItem.id === item.id);
      return { ...item, owned: loadedItem ? loadedItem.owned : item.owned };
    });
    setStoreItems(updatedStoreItems);

    // Update the level up upgrades with the loaded data
    const updatedLevelUpUpgrades = levelUpUpgrades.map(upgrade => {
      const loadedUpgrade = data.levelUpUpgrades.find(loadedUpgrade => loadedUpgrade.id === upgrade.id);
      return { ...upgrade, owned: loadedUpgrade ? loadedUpgrade.owned : 0 };
    });
    setLevelUpUpgrades(updatedLevelUpUpgrades);

    // Apply the effects of the purchased items based on the loaded data
    applyItemEffectsBasedOnOwned(updatedStoreItems);
    applyLevelUpEffectsBasedOnOwned(updatedLevelUpUpgrades);
  };
  // set game data on load from local storage or firestore (or new game if none found)
  const initializeGameData = async (userId) => {
    // Attempt to load game data from Local Storage first
    const gameDataString = localStorage.getItem('gameData');
    const localGameData = gameDataString ? JSON.parse(gameDataString) : null;

    if (localGameData) {
      // Initialize game state with local game data
      console.log('Initializing game from Local Storage data');
      applyGameData(localGameData);
    } else {
      console.log('Local Storage data not found, fetching from Firestore');
      const firestoreData = await fetchGameData(userId);
      if (firestoreData) {
        console.log('Initializing game from Firestore data');
        applyGameData(firestoreData);
      } else {
        console.log('No game data found. new game initialized');
      }
    }
  };
  // auto create user on load and load game data
  useEffect(() => {
    // Check for an authenticated user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('User is signed in:', user.uid);
        // Initialize the user's game data (either from Local Storage or Firestore)
        await initializeGameData(user.uid);
        setIsLoading(false); // Set the app as loaded
      } else {
        console.log('No user is signed in, signing in anonymously');
        signInAnonymously(auth)
          .then(() => console.log('Signed in anonymously'))
          .catch(error => console.error('Error signing in anonymously:', error.message));
      }
    });
    return () => unsubscribe(); // Clean up the subscription
  }, []);


  // Sound volume state
  const [volume, setVolume] = useState(0.2);
  // app loading state
  const [isLoading, setIsLoading] = useState(true);
  // game paused state
  const [isGamePaused, setIsGamePaused] = useState(false);

  // leaderboard open state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Store open state
  const [isShopOpen, setIsShopOpen] = useState(false);
  // render store?
  const [showStore, setShowStore] = useState(false);
  // shop animation effect
  useEffect(() => {
    let timeoutId;

    if (isShopOpen) {
      setShowStore(true); // Immediately show the store for the slide-up animation
    } else {
      // Start the slide-down animation but keep the store visible for its duration
      timeoutId = setTimeout(() => setShowStore(false), 150); // Match the animation duration
    }

    return () => clearTimeout(timeoutId);
  }, [isShopOpen]);
  // game state when Leveling up
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  // menu overlay state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // pause game when menu or Level up overlay is open
  useEffect(() => {
    setIsGamePaused(isMenuOpen || isLevelingUp);
  }, [isMenuOpen, isLevelingUp]);



  // target positions
  const [targetPositions, setTargetPositions] = useState(Array(1).fill().map(() => ({ x: 0, y: 0 })));
  // Ref for target positions
  const targetPositionsRef = useRef(targetPositions);
  // Update the ref when the state changes
  useEffect(() => {
    targetPositionsRef.current = targetPositions;
  }, [targetPositions]);
  //  target hit interval in milliseconds
  const [lastTargetHitTimestamp, setLastTargetHitTimestamp] = useState(0);

  // Bot position state
  const [botPositions, setBotPositions] = useState(() => Array(0).fill().map(() => ({ x: 0, y: 0 })));

  // target hit counter
  const [Score, setScore] = useState(0);
  //  Coin combo multiplier in integer
  const [combo, setCombo] = useState(0);
  // State to track the amount of Coin the player has
  const [Coin, setCoin] = useState(99999999);

  //  track ontargethit/miss Coin popups
  const [CoinPopups, setCoinPopups] = useState([]);





  // Store items
  const [storeItems, setStoreItems] = useState([
    { id: 0, buff: '+1 target', baseCost: 0.42, owned: 0, growthRate: 2 },
    { id: 1, buff: '-10% combo decrease', baseCost: 0.69, owned: 0, growthRate: 4 },
    { id: 2, buff: '-10% miss penalty', baseCost: 0.99, owned: 0, growthRate: 1.09 },
    { id: 3, buff: '+10% target size', baseCost: 2.22, owned: 0, growthRate: 5 },
    { id: 4, buff: '+1 base XP', baseCost: 3.33, owned: 0, growthRate: 2 },
    { id: 5, buff: '+10% XP', baseCost: 10, owned: 0, growthRate: 2 },
    { id: 6, buff: '+1 max combo', baseCost: 111, owned: 0, growthRate: 2 },
  ]);
  // store the next affordable item id
  const [nextAffordableItemId, setNextAffordableItemId] = useState(null);
  // get the next affordable item
  useEffect(() => {
    // Filter unowned and unaffordable items
    const unownedItems = storeItems.filter(item => item.owned === 0 && Coin < calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned));

    // Sort by affordability (ascending)
    unownedItems.sort((a, b) => calculateCurrentItemCost(a.baseCost, a.growthRate, a.owned) - calculateCurrentItemCost(b.baseCost, b.growthRate, b.owned));

    // Set the ID of the next affordable item (if any)
    if (unownedItems.length > 0) {
      setNextAffordableItemId(unownedItems[0].id);
    } else {
      setNextAffordableItemId(null);
    }
  }, [Coin, storeItems]);
  // New state to track if the player can afford any shop item
  const [canAfford, setCanAfford] = useState(false);
  // Update canAfford state whenever Coins or storeItems change
  useEffect(() => {
    const affordable = storeItems.some(item => Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned));
    setCanAfford(affordable);
  }, [Coin, storeItems]);


  // amount of combo and Coin loss on miss in percentage
  const [missPenaltyPercentage, setMissPenaltyPercentage] = useState(1);
  // Initial decrease rate in percentage per milliseconds
  const [comboDecreaseRate, setComboDecreaseRate] = useState(0.0035);
  // Target size in % of base size
  const [targetSizeMultiplier, setTargetSizeMultiplier] = useState(1);
  const baseTargetSize = 85; // Base size in px
  // State to track the base Coin reward
  const [baseCoinReward, setBaseCoinReward] = useState(1);
  // combo increase multiplier
  const [comboIncreaseMultiplier, setComboIncreaseMultiplier] = useState(1.1);
  // max Coin combo limit
  const [maxComboLimit, setMaxComboLimit] = useState(3);
  // target hit interval speed reward multiplier
  const [intervalSpeedRewardMultiplier, setIntervalSpeedRewardMultiplier] = useState(1);
  // item cost reduction rate
  const [itemCostReductionMultiplier, setItemCostReductionMultiplier] = useState(1);
  //  bot speed multiplier
  const [botSpeedMultiplier, setBotSpeedMultiplier] = useState(1);
  // Multipliers for coin and XP gains
  const [coinGainMultiplier, setCoinGainMultiplier] = useState(1.0);
  const [xpGainMultiplier, setXpGainMultiplier] = useState(1.0);





  // XP progress towards next Level
  const [playerProgress, setPlayerProgress] = useState({ currentXP: 0, currentLevel: 1 });
  const [baseXPGainPerHit, setBaseXPGainPerHit] = useState(1); // Base XP gain per target hit
  // 3 random Offered upgrades on Level up
  const [offeredUpgrades, setOfferedUpgrades] = useState([]);
  // Function to calculate the XP needed to Level up
  const XPNeededToLevelUp = (Level) => {
    const baseXP = 50; // Base XP needed for the first level
    // Polynomial growth
    return Math.floor(baseXP + (100 * Math.pow(Level - 1, 1.5)));
  };
  // handle XP gain and Level up on target hit
  const addXPAndCheckLevelUp = (XPGained) => {
    setPlayerProgress(prevProgress => {
      let newCurrentXP = prevProgress.currentXP + XPGained;
      let currentLevel = prevProgress.currentLevel;
      let XPNeeded = XPNeededToLevelUp(currentLevel);
      // Check if the player has enough XP to level up
      if (newCurrentXP >= XPNeeded) {
        newCurrentXP -= XPNeeded;
        currentLevel++;
        setIsLevelingUp(true);

        // Get 3 random upgrades to offer
        const upgradesToOffer = getRandomUpgrades();
        // Assuming you have a state to store these 3 upgrades
        setOfferedUpgrades(upgradesToOffer);
      }
      return { currentXP: newCurrentXP, currentLevel: currentLevel };
    });
  };



  // Level-Up Upgrades
  const [levelUpUpgrades, setLevelUpUpgrades] = useState([
    { id: 0, buff: "+1 base ₿", owned: 0 },
    { id: 1, buff: "+1 ⵙ", owned: 0 },
    { id: 2, buff: "+5% ⵙ speed", owned: 0 },
    { id: 3, buff: "+10% ₿", owned: 0 },
    { id: 4, buff: "+10% speed reward", owned: 0 },
  ]);

  // Function to apply the effects of a level-up upgrade
  const applyLevelUpUpgrades = (buff) => {
    switch (buff) {
      case "+1 base ₿":
        setBaseCoinReward(baseCoinReward => baseCoinReward + 1);
        break;
      case "+1 ⵙ":
        addBot();
        break;
      case "+5% ⵙ speed":
        setBotSpeedMultiplier(prevMultiplier => prevMultiplier + 0.05);
        break;
      case "+10% ₿":
        setCoinGainMultiplier(prevMultiplier => prevMultiplier + 0.1);
        break;
      case "+10% speed reward":
        setIntervalSpeedRewardMultiplier(prevMultiplier => prevMultiplier + 0.1);
        break;
      default:
        console.log("Invalid upgrade description:", buff);
    }
  };

  // get 3 random levelUpUpgrades
  const getRandomUpgrades = () => {
    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = levelUpUpgrades.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [levelUpUpgrades[i], levelUpUpgrades[j]] = [levelUpUpgrades[j], levelUpUpgrades[i]];
    }

    // Return the first 3 items of the shuffled array
    return levelUpUpgrades.slice(0, 3);
  };


  // on click effect for level up upgrade
  const selectLevelUpUpgrade = (selectedUpgrade) => {
    // Increment 'owned' for the selected upgrade
    setLevelUpUpgrades(upgrades =>
      upgrades.map(upgrade =>
        upgrade.id === selectedUpgrade.id ? { ...upgrade, owned: upgrade.owned + 1 } : upgrade
      )
    );

    // Apply the selected upgrade's effect
    applyLevelUpUpgrades(selectedUpgrade.buff);

    // Close the level-up overlay
    setIsLevelingUp(false);
  };





  // Format any amount to 2 decimal places if fractional and significant
  const formatAmount = (amount) => {
    if (amount % 1 === 0 || parseFloat(amount.toFixed(2)) % 1 === 0) {
      return `${Math.floor(amount)}`;
    } else {
      return amount.toFixed(2);
    }
  };


  // Function to add a new target
  const addTarget = () => {
    setTargetPositions(prevPositions => [...prevPositions, generateTargetPosition()]);
  };
  const removeTarget = () => {
    if (targetPositions.length > 1) { // Ensure at least one target remains
      setTargetPositions(targetPositions.slice(0, -1));
    }
  };



  // Function to generate a random position on the screen
  const generatePosition = () => {
    // Calculate the target's radius.
    const targetRadius = (baseTargetSize * targetSizeMultiplier) / 2;

    // Random position adjusted for the margin and size increase.
    const x = Math.random() * (window.innerWidth - targetRadius * 2) + targetRadius;
    const y = Math.random() * (window.innerHeight - targetRadius * 2) + targetRadius;

    // Return the calculated position.
    return { x, y };
  };

  // New function for generating non-overlapping target positions
  const generateTargetPosition = () => {
    let newPosition = generatePosition();
    return newPosition;
  };
  // regenerate position for a single target
  const regenerateTargetPosition = (targetID) => {
    setTargetPositions(prevPositions =>
      prevPositions.map((pos, index) => index === targetID ? generateTargetPosition() : pos)
    );
  };





  // Coin combo multiplier decrease (variable rate)
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




  // Base Coin reward bonus function based on time elapsed since last target hit
  const calculateIntervalSpeedCoinBonus = (timeDifference) => {
    // Cap the minimum time difference at 50ms
    const effectiveTimeDifference = Math.max(timeDifference, 50);
    // Calculate potential reward based on the formula and multiply by baseCoinReward
    const potentialReward = baseCoinReward * (1.35 ** ((1000 - effectiveTimeDifference) * 0.01 * intervalSpeedRewardMultiplier));
    // Return 1 as the minimum potential reward or the calculated potential reward
    return potentialReward < 1 || timeDifference === 0 ? baseCoinReward : potentialReward;
  };
  // Coin reward per target hit
  const targetHitCoinReward = () => {
    const currentTime = Date.now();
    const timeDifference = lastTargetHitTimestamp > 0 ? currentTime - lastTargetHitTimestamp : 0;
    setLastTargetHitTimestamp(currentTime);
    // base Coin reward based on last target hit interval
    const speedCoinBonus = calculateIntervalSpeedCoinBonus(timeDifference);
    // bonus Coin combo multiplier based on progress bar
    const comboCoinBonus = 0.01 * (speedCoinBonus * Math.max(1, combo));

    // Apply the "+10% Coins" bonus
    const finalCoinEarned = comboCoinBonus * coinGainMultiplier;

    // Update Coin state with the final amount earned
    setCoin((prevCoin) => prevCoin + finalCoinEarned);
    return finalCoinEarned;
  };


  // Sound effect for target hit
  const hitSoundRef = useRef(null);
  // Preload the hit sound on game load
  useEffect(() => {
    // Preload the hit sound and store it in the ref
    hitSoundRef.current = new Audio('/hitbubble.mp3');
    hitSoundRef.current.load();
  }, []);
  // Function to play the hit sound
  const playHitSound = () => {
    if (hitSoundRef.current) {
      const hitSound = hitSoundRef.current.cloneNode(); // Clone the audio for concurrent playback
      hitSound.volume = volume; // Set volume to the current state value
      hitSound.play().catch(error => console.error('Error playing the sound:', error));
    }
  };


  // trigger the popup on target hit/miss
  const showPopup = (x, y, amount, type) => {
    // Calculate adjustment towards center for the popup
    const adjustmentX = x < window.innerWidth / 2 ? 100 : -100;
    const adjustmentY = y < window.innerHeight / 2 ? 50 : -50;

    // Create the popup object
    const newPopup = {
      id: Date.now(), // Unique ID for the popup
      x: x + adjustmentX,
      y: y + adjustmentY,
      amount: type === 'loss' ? `-${formatAmount(amount)}%` : formatAmount(amount),
      type: type,
    };

    // Add the popup to the state
    setCoinPopups((prevPopups) => [...prevPopups, newPopup]);

    // Set the removal delay based on the popup type
    const removalDelay = type === 'loss' ? 1000 : 500;
    // Schedule the popup removal after 500ms
    setTimeout(() => {
      setCoinPopups((prevPopups) => prevPopups.filter(popup => popup.id !== newPopup.id));
    }, removalDelay);
  };


  // when u hit a target
  const onTargetHit = (targetID, event) => {
    // Play the hit sound
    playHitSound();

    // Remove the target and add a new one
    regenerateTargetPosition(targetID);
    // Increase the target hit counter
    setScore(prevCount => prevCount + 1);
    const finalCoinEarned = targetHitCoinReward();

    // Increase combo multiplier by 10% max combo * comboIncreaseMultiplier on target hit
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo + 0.1 * maxComboLimit * (comboIncreaseMultiplier)));

    // Multiply XP gain by the combo multiplier 
    const XPGained = baseXPGainPerHit * Math.max(1, combo) * xpGainMultiplier; // Ensure the multiplier is at least 1
    // Add the XP and check for Level up
    addXPAndCheckLevelUp(XPGained);

    // Show the Coin gain popup
    showPopup(event.clientX, event.clientY, finalCoinEarned, 'gain');
  };

  // target miss penalty
  const onTargetMiss = (event) => {
    // Apply the loss based on the current loss percentage
    //Coin loss
    setCoin(prevCoin => Math.max(0, prevCoin * (1 - missPenaltyPercentage)));
    //combo loss
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo - prevCombo * (missPenaltyPercentage)));
    //XP loss
    setPlayerProgress(prevProgress => {
      const newXP = Math.max(0, prevProgress.currentXP * (1 - missPenaltyPercentage));
      return { ...prevProgress, currentXP: newXP };
    });

    // Show the Coin loss popup
    showPopup(event.clientX, event.clientY, missPenaltyPercentage * 100, 'loss');
  };




  // get current cost of an item depending on how many owned
  const calculateCurrentItemCost = (baseCost, growthRate, owned) => {
    // Polynomial growth
    return parseFloat(baseCost * Math.pow(1 + (growthRate * owned), 1.5)) * itemCostReductionMultiplier;
  };

  // Function to apply the effects of a purchased item
  const applyPurchasedItem = (itemBuff) => {
    switch (itemBuff) {
      case '+1 target':
        addTarget();
        break;
      case '-10% combo decrease':
        setComboDecreaseRate(prevRate => prevRate * 0.9); //log decrease
        break;
      case '-10% miss penalty':
        setMissPenaltyPercentage(prevPercentage => prevPercentage * 0.9); //log decrease
        break;
      case '+10% target size':
        setTargetSizeMultiplier(prevSize => prevSize + 0.1); //base 10% increase
        break;
      case '+1 base XP':
        setBaseXPGainPerHit(prevXPGain => prevXPGain + 1);
        break;
      case '+1 max combo':
        setMaxComboLimit(prevLimit => prevLimit + 1);
        break;
      case '+10% XP':
        setXpGainMultiplier(prevMultiplier => prevMultiplier + 0.1);
        break;
      default: console.log('Invalid item description:', itemBuff);
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




  // Function to add a new bot
  const addBot = () => {
    setBotPositions(prevBotPositions => [...prevBotPositions, generatePosition()]);
  };
  // check if bot overlaps target
  const doesBotOverlapTarget = (botPos, targetPos) => {
    // get the target radius
    const targetRadius = (baseTargetSize * targetSizeMultiplier) / 2;

    // Reduce the effective target radius by 1px for the bot's advantage
    const effectiveTargetRadius = targetRadius - 1;

    // Calculate the distance between the bot and the target
    const distanceX = botPos.x - targetPos.x;
    const distanceY = botPos.y - targetPos.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // Check if the distance is less than the effective target radius (with 1px advantage)
    return distance <= effectiveTargetRadius;
  };
  // trigger a hit when bot overlaps target
  const checkForBotHit = (botPos) => {
    for (let targetIndex = targetPositionsRef.current.length - 1; targetIndex >= 0; targetIndex--) {
      const targetPos = targetPositionsRef.current[targetIndex];
      if (doesBotOverlapTarget(botPos, targetPos)) {
        onTargetHit(targetIndex, { clientX: botPos.x, clientY: botPos.y });
        break;
      }
    }
  };
  // move a bot to a new position then check for target hit
  const moveBotAndCheckHit = (botIndex) => {
    // Generate a new position for the bot
    const newPosition = generatePosition();
    // Update the position of the specific bot
    setBotPositions(prevBotPositions =>
      prevBotPositions.map((pos, index) => index === botIndex ? newPosition : pos)
    );
    // Delay the hit check to occur after the bot movement animation completes
    setTimeout(() => {
      checkForBotHit(newPosition);
    }, 250 + 50); // Match the duration of the CSS transition + click delay
  };
  // move every bot and check for hit sequentially
  const moveBotsSequentially = () => {
    botPositions.forEach((_, index) => {
      setTimeout(() => {
        moveBotAndCheckHit(index);
      }, index * 100); // Delay between each bot move
    });
  };
  // Move bots sequentially at interval
  useEffect(() => {
    if (!isGamePaused) {
      const intervalId = setInterval(() => {
        moveBotsSequentially();
      }, 5000 / botSpeedMultiplier); // interval in ms

      return () => clearInterval(intervalId);
    }
  }, [botSpeedMultiplier, isGamePaused]); //dependencies







  // on load utilities (prevent scroll on mobile, generate targets, remove loading screen)
  useEffect(() => {
    // Prevent default touch behavior globally
    const preventDefaultTouch = (e) => e.preventDefault();
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    // Generate initial target positions
    setTargetPositions(targetPositions.map(() => generateTargetPosition()));

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
    // Calculate the maximum eXPected reward for normalization
    const maxEXPectedReward = calculateIntervalSpeedCoinBonus(50); // This uses 50ms as the cap as defined earlier

    // Normalize the potential reward, which is higher for lower timeElapsed values
    let normalizedFactor = potentialReward / maxEXPectedReward;

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






  // data refs for game data autosave
  const scoreRef = useRef(Score);
  const coinRef = useRef(Coin);
  const xpRef = useRef(playerProgress.currentXP);
  const levelRef = useRef(playerProgress.currentLevel);
  const storeItemsRef = useRef(storeItems);
  const levelUpUpgradesRef = useRef(levelUpUpgrades);
  const volumeRef = useRef(volume);
  // Update the ref when the state changes
  useEffect(() => {
    scoreRef.current = Score;
    coinRef.current = Coin;
    xpRef.current = playerProgress.currentXP;
    levelRef.current = playerProgress.currentLevel;
    storeItemsRef.current = storeItems;
    levelUpUpgradesRef.current = levelUpUpgrades;
    volumeRef.current = volume;

  }, [Score, Coin, playerProgress, storeItems, levelUpUpgrades, volume]);
  //local storage auto save in real time
  useEffect(() => {
    if (!isLoading) {
      const gameData = {
        score: scoreRef.current,
        coin: coinRef.current,
        xp: xpRef.current,
        level: levelRef.current,
        storeItems: storeItemsRef.current.map(item => ({ id: item.id, owned: item.owned })),
        levelUpUpgrades: levelUpUpgradesRef.current.map(upgrade => ({ id: upgrade.id, owned: upgrade.owned })),
        volume: volumeRef.current,
      };
      // Update Local Storage in real-time
      localStorage.setItem('gameData', JSON.stringify(gameData));
    }

  }, [Score, Coin, playerProgress, storeItems, levelUpUpgrades, volume]);
  // Function to save game data to Firestore
  const autosaveGame = async (gameData) => {
    if (auth.currentUser) {
      const docRef = doc(db, 'players', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, gameData);
        console.log('Game data updated for user ', auth.currentUser.uid);
      } else {
        // Document does not exist, create a new one with gameData
        await setDoc(docRef, gameData);
        console.log('New document created with current data for user', auth.currentUser.uid);
      }
    }
  };
  //auto save game data on interval to firestore
  useEffect(() => {
    const autosaveAction = () => {
      // Fetch the latest game data from Local Storage
      const gameDataString = localStorage.getItem('gameData');
      const gameData = JSON.parse(gameDataString);

      // Check if gameData is not null
      if (gameData) {
        // Autosave the game data to Firestore
        autosaveGame(gameData)
          .then(() => console.log('Autosaved game data to Firestore at', new Date().toLocaleTimeString()))
          .catch(error => console.error('Error autosaving game data to Firestore:', error));
      }
    };

    const autosaveInterval = setInterval(autosaveAction, 60000); // 1-minute interval
    return () => clearInterval(autosaveInterval);
  }, []);



  // Determine the swipe direction based on the swipe direction
  const handleSwipeGesture = (deltaX, deltaY) => {
    const direction = Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? 'right' : 'left') : (deltaY > 0 ? 'down' : 'up');
    //swipe actions by direction
    switch (direction) {
      case 'up':
        setIsShopOpen(true);
        break;
      case 'down':
        setIsShopOpen(false);
        break;
      default:
        break;
    }
  }
  // Touch swipe gesture detection
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 });
  // Handle the start of a touch
  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    setTouchStartPosition({ x: touch.clientX, y: touch.clientY });
  };
  // Handle the end of a touch
  const handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartPosition.x;
    const deltaY = touch.clientY - touchStartPosition.y;

    // Check if the swipe is significant
    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
      handleSwipeGesture(deltaX, deltaY);
    }
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

  // loading screen
  if (isLoading) {
    return (
      <div className="bg-black text-gray-200 h-screen w-screen overflow-hidden flex flex-col justify-center items-center">
        {/* game title */}
        <div className="text-[10vh] lg:text-[20vh] leading-none text-center">
          aim trainer
        </div>
        {/* glyphteck studio */}
        <div className="text-[3vh] lg:text-[5vh] leading-none">by glyphteck studiⵙs</div>
      </div>
    );
  }

  // Mobile warning screen
  if (isMobile) {
    return (
      <div className="bg-black text-gray-200 h-screen w-screen overflow-hidden flex flex-col justify-center items-center">
        {/* mobile warning */}
        <div className="text-[7vh] lg:text-[15vh] leading-none text-center">
          mobile not suported
        </div>
        <div className="text-[4vh] lg:text-[10vh] leading-none text-center">
          desktop only
        </div>
      </div>
    );
  }

  // Main game
  return (
    <main className="bg-bliss h-screen w-screen bg-cover bg-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} >
      {/* target spawn canvas */}
      <div
        style={{ cursor: "url('/greendot.png') 32 32, auto" }}
        className="backdrop-blur-sm h-screen w-screen absolute overflow-hidden"
        onMouseDown={(e) => {
          e.preventDefault();
          onTargetMiss(e);
          e.stopPropagation();
        }}
      >
        {/* target instances */}
        {targetPositions.map((targetPosition, targetID) => (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              onTargetHit(targetID, e);
              e.stopPropagation();
            }}
            className="absolute bg-[#e53935] rounded-full border-[3px] border-black"
            style={{
              left: `${targetPosition.x - (baseTargetSize * targetSizeMultiplier / 2)}px`,
              top: `${targetPosition.y - (baseTargetSize * targetSizeMultiplier / 2)}px`,
              width: `${baseTargetSize * targetSizeMultiplier}px`,
              height: `${baseTargetSize * targetSizeMultiplier}px`,
            }}
          />
        ))}

        {/* bot instances */}
        {botPositions.map((botPosition, index) => (
          <div
            key={index}
            className="absolute pointer-events-none"
            style={{
              left: `${botPosition.x - 16}px`,
              top: `${botPosition.y - 16}px`,
              transition: 'left 250ms ease-out, top 250ms ease-out',
            }}
          >
            <img src="/bot.png" alt="Bot cursor" style={{ width: 32, height: 32 }} />
          </div>
        ))}
      </div>

      {/* HUD */}
      <div className="pointer-events-none">
        {/* Coin combo multiplier progress bar */}
        <div className="backdrop-blur-sm border-b-[3px] border-black absolute top-0 left-0 w-full md:h-[5vh] h-[6vh] flex items-center" style={{ backgroundColor: `${comboBarColor.replace('rgb', 'rgba').replace(')', ', 0.65)')}` }}>
          {/* Combo bar filler */}
          <div className={`h-full border-black ${combo == 0 ? '' : 'border-r-[3px]'} `} style={{ width: `${(combo / maxComboLimit) * 100}%`, backgroundColor: `${comboBarColor.replace('rgb', 'rgba').replace(')', ', 0.65)')}` }}></div>
          {/* Display current Coin combo multiplier */}
          {/* Display current Coin combo multiplier */}
          <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
            <span className="text-[3vh]">combo <span style={{ textTransform: 'lowercase' }}>x</span>{combo > 1 ? formatAmount(combo) : '1'}</span>
          </div>

        </div>

        {/* Target hit and coin counter */}
        <div className="md:text-[7vh] px-[2vw] absolute top-[6vh] md:top-[5vh] w-full flex flex-row justify-between items-center">
          {Coin > 0 ? <div>{formatAmount(Coin)} ₿</div> : <div className="flex-grow"></div>}
          {Score > 0 && <div>{Score}</div>}
        </div>

        { /* can shop indicator */}
        {canAfford && (
          <div className="text-[3vh] w-full absolute bottom-[7vh] left-1/2 transform -translate-x-1/2 flex items-center justify-center">
            <img src="/spacebar.png" alt="Open Shop" style={{ width: '12vh', height: '3vh' }} />
            <div className="w-[0.5vw]"></div>
            <div>to shop</div>
          </div>
        )}

        {/* XP Progress Bar */}
        <div className="backdrop-blur-sm border-t-[3px] border-black absolute bottom-0 left-0 w-full h-[6vh] md:h-[5vh] bg-xp bg-opacity-65 flex items-center">
          <div className={`h-full border-black bg-xp bg-opacity-50 ${playerProgress.currentXP == 0 ? '' : 'border-r-[3px]'}`} style={{ width: `${playerProgress.currentXP / ((XPNeededToLevelUp(playerProgress.currentLevel))) * 100}%` }}></div>
          {/* Display Level on the far left */}
          <div className="absolute left-0 h-full flex items-center px-4">
            {playerProgress.currentLevel > 1 && <div className="text-[3vh]">Level {playerProgress.currentLevel}</div>}
          </div>
          {/* Display current XP in the middle of the bar */}
          <div className="absolute left-0 right-0 h-full flex items-center justify-center">
            <span className="text-[3vh]">{formatAmount(playerProgress.currentXP)}/{XPNeededToLevelUp(playerProgress.currentLevel)}</span>
          </div>
        </div>

        {/* Coin popups */}
        {CoinPopups.map((popup) => (
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

      {/* Coin store */}
      {showStore && (
        <div className={`${isShopOpen ? 'animate-slideUp' : 'animate-slideDown'} absolute w-screen h-screen top-0 md:h-[85vh] md:top-[15vh] overflow-hidden backdrop-blur-2xl flex flex-col border-t-[3px] border-black`}>
          {/* item list */}
          <div className="overflow-hidden p-[2vh] md:pt-[4vh] gap-[2vh] grid grid-cols-2 grid-rows-5 lg:grid-cols-5 lg:grid-rows-3">
            {storeItems.map((item, index) => {
              // Determine if the current item can be afforded
              const affordable = Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned);

              return (
                <div key={item.id} onMouseDown={() => affordable && purchaseItem(item.id)} className={`flex flex-col bg-white bg-opacity-50 rounded-xl md:rounded-3xl px-[2vw] py-[1vh] border-[3px] border-black justify-center items-center text-center ${!affordable && item.owned === 0 ? item.id === nextAffordableItemId ? "opacity-50" : "opacity-0" : affordable ? "" : "opacity-50"}`}>
                  {/* Item description */}
                  <div className="flex-2 flex justify-center items-center h-full text-[2.5vh] lg:text-[3vh] text-center">{item.buff}</div>
                  {/* Item cost */}
                  <div className="flex-1 h-full flex items-center justify-center">
                    <div className="text-[3.5vh] lg:text-[5vh] ml-2">{formatAmount(calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned))} ₿</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Level up overlay */}
      {isLevelingUp && (
        <div className="absolute backdrop-blur-2xl w-screen h-screen flex flex-col justify-center items-center">
          <div className='text-[7vh] md:text-[10vh] h-[20vh]' >level up!</div>
          <div className="px-[8vw] pb-[16vh] h-full grid grid-cols-1 lg:grid-cols-3 gap-[2vh] lg:gap-[2vw]">
            {offeredUpgrades.map((upgrade, index) => (
              <div
                key={upgrade.id}
                className="bg-white bg-opacity-50 px-[4vw] py-[4vh] flex justify-center items-center leading-none text-center border-[4px] border-black rounded-3xl"
                onClick={() => selectLevelUpUpgrade(upgrade)}
              >
                {upgrade.buff}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* menu overlay */}
      {isMenuOpen && (
        <div className=" absolute backdrop-blur-2xl w-screen h-screen flex flex-col justify-center items-center">
          <div className='text-[10vh] h-[20vh] flex justify-center items-center' >aimtrainer</div>
          {/* sound control */}
          <div className='h-[80vh] flex flex-row justify-center items-center' >
            <img src="/volume.png" alt="volume icon" style={{ width: '5vh', height: '5vh' }} />
            <div className='w-[2vw]'></div>
            <input style={{ backgroundSize: `${volume * 100}% 100%`, cursor: "url('/reddot.png') 32 32, auto" }} className="cursor-default w-[15vw] h-[2.5vh] accent-black outline-none"
              id="volume-control"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </div>
        </div>
      )}
    </main >
  );
}
