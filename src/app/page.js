"use client"
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
//db
import { getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, query, collection, where, limit, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
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


  // State to determine if the user is on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  // check if user is on mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Code that uses 'window' or other browser-specific globals
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      setIsMobile(mobile);
    }
  }, []);

  //check screen size / enforce large screen
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const minScreenWidth = 1200;
  const minScreenHeight = 850;
  const checkScreenSize = () => {
    if (window.innerWidth < minScreenWidth || window.innerHeight < minScreenHeight) {
      setIsScreenTooSmall(true);
    } else {
      setIsScreenTooSmall(false);
    }
  };
  useEffect(() => {
    checkScreenSize(); // Check size on initial render
    // Re-check size on window resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize); // Cleanup
  }, []);


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
      // Apply effects based on the number owned for each rarity
      upgrade.owned.forEach((count, index) => {
        for (let i = 0; i < count; i++) {
          // Determine the rarity based on the index
          const rarity = Object.keys(rarities)[index]; // assuming rarities is an ordered array-like object
          const effect = levelupUpgradeEffects[upgrade.id][rarity];
          effect();
        }
      });
    });
  };
  // apply game data to current game state
  const applyGameData = (data) => {
    // Set basic game data
    setScore(data.score);
    setCoin(data.coin);
    setPlayerProgress({ currentXP: data.xp, currentLevel: data.level });
    setVolume(data.volume);
    setIsShopIndicatorOn(data.isShopIndicatorOn);
    setPlayerName(data.playerName || "ANONYMOUS");
    // Update the store items with the loaded data
    const updatedStoreItems = storeItems.map(item => {
      const loadedItem = data.storeItems.find(loadedItem => loadedItem.id === item.id);
      return { ...item, owned: loadedItem ? loadedItem.owned : item.owned };
    });
    setStoreItems(updatedStoreItems);
    // Update the level up upgrades with the loaded data
    const updatedLevelUpUpgrades = levelUpUpgrades.map(upgrade => {
      const loadedUpgrade = data.levelUpUpgrades.find(loadedUpgrade => loadedUpgrade.id === upgrade.id);
      return { ...upgrade, owned: loadedUpgrade ? [...loadedUpgrade.owned] : [0, 0, 0] };
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
    if (isMobile) {
      setIsLoading(false); // Immediately set loading to false on mobile
      return; // Skip the rest of the initialization
    }
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
          .catch(error => console.error('Error signing in anonymously:', error.message));
      }
    });
    return () => unsubscribe(); // Clean up the subscription
  }, [isMobile]);


  //player name state
  const [playerName, setPlayerName] = useState('ANONYMOUS');
  // State for the name input prompt
  const [nameInput, setNameInput] = useState("");
  // Function to handle name input
  const handleNameInput = (e) => {
    setNameInput(e.target.value);
  };

  // Function to handle name submission
  const handleNameSubmit = async () => {
    if (nameInput.trim() !== "" && nameInput.trim().toUpperCase() !== "ANONYMOUS") {
      const upperCaseName = nameInput.trim().toUpperCase();
      // Check if the name is valid (only uppercase letters, numbers, "." and "_")
      const isValidName = /^[A-Z0-9._]+$/.test(upperCaseName);
      if (!isValidName) {
        alert("Please enter a valid name. Only letters, numbers, '.' and '_' are allowed.");
        return;
      }
      // Check if the name is unique
      const nameExists = await checkNameExists(upperCaseName);
      if (!nameExists) {
        setPlayerName(upperCaseName);
        // Save to local storage and Firestore
        const gameData = JSON.parse(localStorage.getItem('gameData')) || {};
        gameData.playerName = upperCaseName;
        localStorage.setItem('gameData', JSON.stringify(gameData));
        await autosaveGame(gameData);
      } else {
        alert("This name is already taken. Please choose another name.");
      }
    } else {
      alert("Please enter a valid name.");
    }
  };
  // Function to check if a name exists in Firestore
  const checkNameExists = async (playerName) => {
    const q = query(collection(db, 'players'), where('name', '==', playerName));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };


  // Sound volume state
  const [volume, setVolume] = useState(0.2);
  // app loading state
  const [isLoading, setIsLoading] = useState(true);
  // game paused state
  const [isGamePaused, setIsGamePaused] = useState(false);


  // Store open state
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isShopIndicatorOn, setIsShopIndicatorOn] = useState(true);
  // render store
  const [showStore, setShowStore] = useState(false);
  // shop animation effect
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    let timeoutId;

    if (isShopOpen) {
      setShowStore(true); // Immediately show the store for the slide-up animation
    } else {
      // Start the slide-down animation but keep the store visible for its duration
      timeoutId = setTimeout(() => setShowStore(false), 150); // Match the animation duration
    }

    return () => clearTimeout(timeoutId);
  }, [isShopOpen, isMobile]);


  // leaderboard open state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  //render leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // leaderboard data state
  const [leaderboardData, setLeaderboardData] = useState([]);

  // get the data for the leaderboard get current player data from local storage and other players data from firestore
  const fetchLeaderboardData = () => {
    // get top 100 player data from firestore
    const q = query(collection(db, 'players'), where('playerName', '!=', 'ANONYMOUS'), orderBy('score', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Fetch current player's data from Local Storage
      const localGameDataString = localStorage.getItem('gameData');
      const localGameData = localGameDataString ? JSON.parse(localGameDataString) : null;
      // Filter out the current player's data from Firestore data
      firestoreData = firestoreData.filter(player => player.id !== auth.currentUser.uid);
      // Add current player's data if available
      if (localGameData) {
        firestoreData.push({ id: auth.currentUser.uid, ...localGameData });
      }
      // Sort the leaderboard data by score
      firestoreData.sort((a, b) => b.score - a.score);
      // Update the state with the combined leaderboard data
      setLeaderboardData(firestoreData);
    });
    return unsubscribe;
  };

  // Leaderboard animation effect + leaderboard data fetch
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    let timeoutId;
    let unsubscribe = null;

    if (isLeaderboardOpen) {
      setShowLeaderboard(true); // Immediately show the leaderboard for the slide-in animation
      unsubscribe = fetchLeaderboardData(); // Fetch leaderboard data when the leaderboard is opened
    } else {
      // Start the slide-out animation but keep the leaderboard visible for its duration
      timeoutId = setTimeout(() => setShowLeaderboard(false), 150); // Match the animation duration
    }

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe(); // Clean up the Firestore listener when the leaderboard is closed
      }
    };
  }, [isLeaderboardOpen, isMobile]);





  // game state when Leveling up
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  // is the level up screen interactable?
  const [isLevelUpInteractable, setIsLevelUpInteractable] = useState(true);
  // menu overlay state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // pause game when menu or Level up overlay is open
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    setIsGamePaused(isMenuOpen || isLevelingUp || isLeaderboardOpen);
  }, [isMenuOpen, isLevelingUp, isLeaderboardOpen, isMobile]);



  // target positions
  const [targetPositions, setTargetPositions] = useState(Array(1).fill().map(() => ({ x: 0, y: 0 })));
  const [ghostTargets, setGhostTargets] = useState([]);
  // Ref for target positions
  const targetPositionsRef = useRef(targetPositions);
  // Update the ref when the state changes
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
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
  const [Coin, setCoin] = useState(0);
  //  track ontargethit/miss Coin popups
  const [hitPopups, setHitPopups] = useState([]);




  // number of shields 🛡
  const [maxShield, setMaxShield] = useState(1);
  const [currentShield, setCurrentShield] = useState(0);
  const [shieldRegenRate, setShieldRegenRate] = useState(10000);
  const [shieldRegenMultiplier, setShieldRegenMultiplier] = useState(1);
  // Shield regeneration logic
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    if (maxShield > 0 && currentShield < maxShield) {
      const intervalId = setInterval(() => {
        setCurrentShield(prevShield => Math.min(maxShield, prevShield + 1));
      }, shieldRegenRate / shieldRegenMultiplier);
      return () => clearInterval(intervalId);
    }
  }, [currentShield, maxShield, shieldRegenRate, shieldRegenMultiplier]);
  // whenever max shield is increased, set current shield to max shield
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    // Only increase currentShield if it is less than the new maxShield
    if (currentShield < maxShield) {
      setCurrentShield(maxShield);
    }
  }, [maxShield, isMobile]);


  // Store items
  const [storeItems, setStoreItems] = useState([
    { id: 0, buff: '+1 target', baseCost: 0.42, owned: 0, growthRate: 2 },
    { id: 1, buff: '+5% combo sustain', baseCost: 0.69, owned: 0, growthRate: 4 },
    { id: 2, buff: '-10% miss penalty', baseCost: 0.99, owned: 0, growthRate: 1.07 },
    { id: 3, buff: '+5% target size', baseCost: 2.22, owned: 0, growthRate: 10 },
    { id: 4, buff: '+10% shield regen', baseCost: 5, owned: 0, growthRate: 3 },
    { id: 5, buff: '+10% XP', baseCost: 10, owned: 0, growthRate: 4 },
    { id: 6, buff: '+1 max combo', baseCost: 42, owned: 0, growthRate: 2 },
  ]);
  // store the next affordable item id
  const [nextAffordableItemId, setNextAffordableItemId] = useState(null);
  // get the next affordable item
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
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
  }, [Coin, storeItems, isMobile]);
  // New state to track if the player can afford any shop item
  const [canAfford, setCanAfford] = useState(false);
  // Update canAfford state whenever Coins or storeItems change
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    const affordable = storeItems.some(item => Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned));
    setCanAfford(affordable);
  }, [Coin, storeItems, isMobile]);


  // amount of combo and Coin loss on miss in percentage
  const [missPenaltyPercentage, setMissPenaltyPercentage] = useState(1);
  // Initial decrease rate in percentage per milliseconds
  const [comboDecreaseRate, setComboDecreaseRate] = useState(0.0035);
  // Target size in % of base size
  const [targetSizeMultiplier, setTargetSizeMultiplier] = useState(1);
  const baseTargetSize = 100; // Base size in px
  // State to track the base Coin reward
  const [baseCoinReward, setBaseCoinReward] = useState(1);
  // combo increase multiplier
  const [comboIncreaseMultiplier, setComboIncreaseMultiplier] = useState(1.1);
  // max Coin combo limit
  const [maxComboLimit, setMaxComboLimit] = useState(7);
  // target hit interval speed reward multiplier
  const [intervalSpeedRewardMultiplier, setIntervalSpeedRewardMultiplier] = useState(1);
  // item cost reduction rate
  const [itemCostReductionMultiplier, setItemCostReductionMultiplier] = useState(1);
  //  bot speed multiplier
  const [botSpeedMultiplier, setBotSpeedMultiplier] = useState(1);
  // Multipliers for coin and XP gains
  const [coinLevelMultiplier, setCoinLevelMultiplier] = useState(1.0);
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
    return Math.floor(baseXP + (100 * Math.pow(Level - 1, 1 + Level * 0.02)));
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
        setIsLevelUpInteractable(false); // make sure we cant interact with the level up overlay
        setIsLevelingUp(true); // Show the level-up overlay
        // Disable interaction for Xms to prevent accidental clicks
        setTimeout(() => {
          setIsLevelUpInteractable(true);
        }, 800);
        // Get 3 random upgrades to offer
        const upgradesToOffer = getRandomUpgrades();
        // Assuming you have a state to store these 3 upgrades
        setOfferedUpgrades(upgradesToOffer);
      }
      return { currentXP: newCurrentXP, currentLevel: currentLevel };
    });
  };



  // Level-Up Upgrades [common, rare, legendary] ⵙ ₿ speed reward shield
  const [levelUpUpgrades, setLevelUpUpgrades] = useState([
    //{ id: 'bot', owned: [0, 0, 0] },
    { id: 'coin_bonus', owned: [0, 0, 0] },
    { id: 'speed_bonus', owned: [0, 0, 0] },
    { id: 'shield', owned: [0, 0, 0] },
  ]);
  // 3 rarities with probabilities
  const rarities = {
    common: 0.8,
    rare: 0.15,
    legendary: 0.05,
  };
  // get a rarity based on probabilities
  const determineRarity = () => {
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const rarity in rarities) {
      cumulativeProbability += rarities[rarity];
      if (rand < cumulativeProbability) {
        return rarity;
      }
    }
    return 'common'; // Default to common if no match is found
  };
  // what each level up upgrade actually does
  const levelupUpgradeEffects = {
    // bot: {
    //   common: () => addBot(1),
    //   rare: () => addBot(2),
    //   legendary: () => addBot(3),
    // },
    coin_bonus: {
      common: () => setCoinLevelMultiplier(prev => prev + 0.1),
      rare: () => setCoinLevelMultiplier(prev => prev + 0.2),
      legendary: () => setCoinLevelMultiplier(prev => prev + 0.3),
    },
    speed_bonus: {
      common: () => setIntervalSpeedRewardMultiplier(prev => prev + 0.2),
      rare: () => setIntervalSpeedRewardMultiplier(prev => prev + 0.3),
      legendary: () => setIntervalSpeedRewardMultiplier(prev => prev + 0.5),
    },
    shield: {
      common: () => setMaxShield(prev => prev + 1),
      rare: () => setMaxShield(prev => prev + 2),
      legendary: () => setMaxShield(prev => prev + 3),
    },
  };
  // get 3 random levelUpUpgrades
  const getRandomUpgrades = () => {
    const shuffledUpgrades = [...levelUpUpgrades].sort(() => Math.random() - 0.5);
    return shuffledUpgrades.slice(0, 3).map(upgrade => {
      const rarity = determineRarity();
      return { ...upgrade, rarity };
    });
  };
  // apply the selected level up upgrade
  const applyLevelUpUpgradeEffect = (selectedUpgrade) => {
    const { id, rarity } = selectedUpgrade;
    const effect = levelupUpgradeEffects[id][rarity];
    effect();
  };
  // on click selection of level up upgrade
  const selectLevelUpUpgrade = (selectedUpgrade) => {
    // If level up overlay shouldn't be interactable yet, do nothing
    if (!isLevelUpInteractable) return;
    // Get the index of the selected upgrade's rarity
    const rarityIndex = Object.keys(rarities).indexOf(selectedUpgrade.rarity);
    // Increment 'owned' for the selected upgrade's rarity
    setLevelUpUpgrades(upgrades =>
      upgrades.map(upgrade =>
        upgrade.id === selectedUpgrade.id ? {
          ...upgrade,
          owned: upgrade.owned.map((count, index) => index === rarityIndex ? count + 1 : count)
        } : upgrade
      )
    );
    // Apply the selected upgrade's effect
    applyLevelUpUpgradeEffect(selectedUpgrade);
    // Close the level-up overlay
    setIsLevelingUp(false);
  };
  // Function to get the display for each upgrade type
  const getUpgradeDisplay = (upgrade) => {
    switch (upgrade.id) {
      case 'bot':
        return (
          <div>
            +{upgrade.rarity === 'common' ? '1' : upgrade.rarity === 'rare' ? '2' : '3'} ⵙ
          </div>
        );
      case 'coin_bonus':
        return (
          <div>
            +{upgrade.rarity === 'common' ? '10' : upgrade.rarity === 'rare' ? '20' : '30'}% coin bonus
          </div>
        );
      case 'speed_bonus':
        return (
          <div>
            +{upgrade.rarity === 'common' ? '20' : upgrade.rarity === 'rare' ? '30' : '50'}% speed bonus
          </div>
        );
      case 'shield':
        return (
          <div className='flex flex-row gap-4 justify-center items-center'>
            +{upgrade.rarity === 'common' ? '1' : upgrade.rarity === 'rare' ? '2' : '3'} max <img src="shield.png" className='h-14' alt="Shield" />
          </div>
        );
      default:
        return (
          <div>
            Unknown Upgrade
          </div>
        );
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
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 }; // Return default position or handle as needed for SSR
    }
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

  // target component
  const target = (targetPosition, targetID) => {
    const targetSize = baseTargetSize * targetSizeMultiplier;
    return (
      <div
        key={targetID}
        onMouseDown={(e) => {
          e.preventDefault();
          onTargetHit(targetID, e);
          e.stopPropagation();
        }}
        className="absolute flex justify-center items-center rounded-full bg-[#3b82f6] border-[3px] border-black opacity-90"
        style={{
          left: `${targetPosition.x - targetSize / 2}px`,
          top: `${targetPosition.y - targetSize / 2}px`,
          width: `${targetSize}px`,
          height: `${targetSize}px`,
        }}
      >
        {/* target middle x3 */}
        <div className="absolute rounded-full bg-[#F89414] border-[3px] border-black" style={{ width: `${targetSize * 0.6}px`, height: `${targetSize * 0.6}px` }}></div>
        {/* target center x10 */}
        <div className="absolute rounded-full bg-[#e53935] border-[3px] border-black" style={{ width: `${targetSize * 0.25}px`, height: `${targetSize * 0.25}px` }}></div>
      </div>
    );
  };





  // Coin combo multiplier decrease (variable rate)
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
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
  }, [comboDecreaseRate, maxComboLimit, isGamePaused, isMobile]); //dependencies



  // Sound effect for target hit
  const hitSoundRef = useRef(null);
  // Preload the hit sound on game load
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    // Preload the hit sound and store it in the ref
    hitSoundRef.current = new Audio('/hit.mp3');
    hitSoundRef.current.load();
  }, [isMobile]);
  // Function to play the hit sound
  const playHitSound = () => {
    if (hitSoundRef.current) {
      const hitSound = hitSoundRef.current.cloneNode(); // Clone the audio for concurrent playback
      hitSound.volume = volume; // Set volume to the current state value
      hitSound.play();
    }
  };

  // trigger the popup on target hit/miss
  const showPopup = (x, y, type, amount = null, hitArea = null) => {
    // Calculate adjustment towards center for the popup
    const adjustmentX = x < window.innerWidth / 2 ? 100 : -100;
    const adjustmentY = y < window.innerHeight / 2 ? 50 : -50;

    // Determine the display text based on the type
    let displayText;
    switch (type) {
      case 'block':
        displayText = 'block';
        break;
      case 'loss':
        displayText = `-${formatAmount(amount)}%`;
        break;
      case 'gain':
        displayText = `+${formatAmount(amount)}`;
        break;
      default:
        displayText = '';
    }

    // Determine the color based on hit area
    let popupColor = '#000'; // Default to black
    if (hitArea === 'center') {
      popupColor = '#e53935'; // Red for center
    } else if (hitArea === 'middle') {
      popupColor = '#F89414'; // Yellow for middle
    } else if (hitArea === 'outer') {
      popupColor = '#3b82f6'; // Blue for outer
    }

    // Create the popup object
    const newPopup = {
      id: Date.now(), // Unique ID for the popup
      x: x + adjustmentX,
      y: y + adjustmentY,
      displayText: displayText,
      type: type,
      color: popupColor,
    };

    // Add the popup to the state
    setHitPopups((prevPopups) => [...prevPopups, newPopup]);

    // Set the removal delay based on the popup type
    const removalDelay = type === 'loss' || 'block' ? 1200 : 500;
    // Schedule the popup removal after 500ms
    setTimeout(() => {
      setHitPopups((prevPopups) => prevPopups.filter(popup => popup.id !== newPopup.id));
    }, removalDelay);
  };


  // Base Coin reward bonus function based on time elapsed since last target hit
  const calculateIntervalSpeedCoinBonus = (timeDifference) => {
    // Cap the minimum time difference at 50ms
    const effectiveTimeDifference = Math.max(timeDifference, 50);
    // Define the maximum reward multiplier
    const maxMultiplier = 5; //effective is a lil over x4 bc of 50ms cap
    // Define the decay factor to control how quickly the reward decreases with time
    const decayFactor = 0.004;

    // Calculate the reward multiplier using an exponential decay formula
    const rewardMultiplier = maxMultiplier * Math.exp(-decayFactor * effectiveTimeDifference);
    // Calculate the potential reward
    const potentialReward = baseCoinReward * rewardMultiplier;
    // Return the baseCoinReward as the minimum reward or the calculated potential reward
    return Math.max(potentialReward, baseCoinReward);
  };

  // Coin reward per target hit
  const targetHitCoinReward = () => {
    const currentTime = Date.now();
    const timeDifference = lastTargetHitTimestamp > 0 ? currentTime - lastTargetHitTimestamp : 0;
    setLastTargetHitTimestamp(currentTime);
    // base Coin reward based on last target hit interval
    const speedCoinBonus = calculateIntervalSpeedCoinBonus(timeDifference);
    // base coin reward * speed * combo * multiplier
    return 0.01 * speedCoinBonus * Math.max(1, combo) * coinLevelMultiplier;
  };

  // when u hit a target
  const onTargetHit = (targetID, event) => {
    // Play the hit sound
    playHitSound();
    // Increase the target hit counter
    setScore(prevCount => prevCount + 1);
    // Get the target's center position before removing it
    const targetCenterX = targetPositions[targetID].x;
    const targetCenterY = targetPositions[targetID].y;
    // Remove the target and add a new one
    regenerateTargetPosition(targetID);
    // Get the click position (or bot hit position)
    const clickX = event.clientX;
    const clickY = event.clientY;
    // Calculate the distance between the click and the target's center
    const distance = Math.sqrt((clickX - targetCenterX) ** 2 + (clickY - targetCenterY) ** 2);
    // Calculate the target size based on the multiplier
    const targetSize = baseTargetSize * targetSizeMultiplier;
    const middleRadius = targetSize * 0.3; // 30% of the target size for middle part
    const centerRadius = targetSize * 0.125; // 12.5% of the target size for center part

    let hitAreaRewardMultiplier = 1; // Base reward multiplier
    let hitArea = 'outer'; // Default to outer area
    // identify which part of target was hit
    if (distance <= centerRadius) {
      hitAreaRewardMultiplier = 5; // Center part hit
      hitArea = 'center';
    } else if (distance <= middleRadius) {
      hitAreaRewardMultiplier = 3; // Middle part hit
      hitArea = 'middle';
    }

    // Calculate the final Coin earned based on multipliers
    const finalCoinEarned = targetHitCoinReward() * hitAreaRewardMultiplier;
    // Update Coin state with the final amount earned
    setCoin((prevCoin) => prevCoin + finalCoinEarned);
    // increase xp by 1 * multipliers
    const XPGained = baseXPGainPerHit * Math.max(1, combo) * xpGainMultiplier * hitAreaRewardMultiplier;
    // Add the XP and check for Level up
    addXPAndCheckLevelUp(XPGained);
    // Increase combo multiplier by 1% * multipliers
    setCombo(prevCombo => Math.min(maxComboLimit, prevCombo + 0.01 * maxComboLimit * comboIncreaseMultiplier * hitAreaRewardMultiplier));
    // Show the Coin gain popup
    showPopup(event.clientX, event.clientY, 'gain', finalCoinEarned, hitArea);
  };
  // target miss penalty
  const onTargetMiss = (event) => {
    //check if shield is available
    if (currentShield > 0) {
      // Reduce shields if any are available
      setCurrentShield(prevShield => Math.max(0, prevShield - 1));
      // Show the "block" popup
      showPopup(event.clientX, event.clientY, 'block');
    } else {
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
      showPopup(event.clientX, event.clientY, 'loss', missPenaltyPercentage * 100);
    }
  };




  // get current cost of an item depending on how many owned
  const calculateCurrentItemCost = (baseCost, growthRate, owned) => {
    // Polynomial growth
    return parseFloat(baseCost * Math.pow(1 + (growthRate * owned), 1 + owned * 0.01)) * itemCostReductionMultiplier;
  };

  // Function to apply the effects of a purchased item
  const applyPurchasedItem = (itemBuff) => {
    switch (itemBuff) {
      case '+1 target':
        addTarget();
        break;
      case '+5% combo sustain':
        setComboDecreaseRate(prevRate => prevRate * 0.95); //log decrease
        break;
      case '-10% miss penalty':
        setMissPenaltyPercentage(prevPercentage => prevPercentage * 0.9); //log decrease
        break;
      case '+5% target size':
        setTargetSizeMultiplier(prevSize => prevSize + 0.05); //base 10% increase
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
      case '+10% shield regen':
        setShieldRegenMultiplier(prevMultiplier => prevMultiplier + 0.1);
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



  const [moveDelayPerBot, setMoveDelayPerBot] = useState(500); // base delay between each bot's move
  const [botsInitialized, setBotsInitialized] = useState(false);
  // Function to add new bots ⵙ
  const addBot = (botAmount = 1) => {
    setBotPositions(prevPositions => [...prevPositions, ...Array(botAmount).fill().map(() => generatePosition())]);
    setBotsInitialized(true);
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
        // ghost target to prevent player from missing the target
        setGhostTargets(prevTargets => [...prevTargets, { ...targetPos, timestamp: Date.now() }]);
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
      }, index * moveDelayPerBot / botSpeedMultiplier); // Delay between each bot move
    });
  };
  // Move bots sequentially at interval
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    if (!isGamePaused && botPositions.length > 0 && botsInitialized) {

      moveBotsSequentially();

      // calculate total time for 1 full sequence 
      const totalSequenceTime = botPositions.length * moveDelayPerBot / botSpeedMultiplier;
      const intervalId = setInterval(() => {
        moveBotsSequentially();
      }, totalSequenceTime + moveDelayPerBot / botSpeedMultiplier); // delay between each sequence
      return () => clearInterval(intervalId);
    }
  }, [botSpeedMultiplier, isGamePaused, moveDelayPerBot, botsInitialized, isMobile]); //dependencies


  // Remove ghost targets after a certain time
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    const interval = setInterval(() => {
      const now = Date.now();
      setGhostTargets(prevTargets => prevTargets.filter(target => now - target.timestamp < 500));
    }, 50); // Run this every 50ms to check for ghost targets to remove

    return () => clearInterval(interval);
  }, [ghostTargets, isMobile]);



  // Generate initial target positions
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    setTargetPositions(targetPositions.map(() => generateTargetPosition()));
  }, []);



  // Add event listeners for space bar to open shop and tab to open leaderboard
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    let shopTimer = null;
    let leaderboardTimer = null;
    let shopToggleMode = true;
    let leaderboardToggleMode = true;
    let shopHoldMode = false;
    let leaderboardHoldMode = false;

    const handleKeyDown = (event) => {

      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        if (shopToggleMode) {
          setIsShopOpen(prev => !prev);
          shopToggleMode = false;

          shopTimer = setTimeout(() => {
            if (!shopHoldMode) {
              shopHoldMode = true;
              shopToggleMode = false;
            }
          }, 150);
        }
      } else if (event.key === 'Tab') {
        event.preventDefault();
        if (leaderboardToggleMode) {
          setIsLeaderboardOpen(prev => !prev);
          leaderboardToggleMode = false;

          leaderboardTimer = setTimeout(() => {
            if (!leaderboardHoldMode) {
              leaderboardHoldMode = true;
              leaderboardToggleMode = false;
            }
          }, 150);
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === ' ' || event.code === 'Space') {
        clearTimeout(shopTimer);
        if (shopHoldMode) {
          setIsShopOpen(false);
          shopHoldMode = false;
        }
        shopToggleMode = true;
      } else if (event.key === 'Tab') {
        clearTimeout(leaderboardTimer);
        if (leaderboardHoldMode) {
          setIsLeaderboardOpen(false);
          leaderboardHoldMode = false;
        }
        leaderboardToggleMode = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile]);
  // Event listener for Esc key to toggle menu overlay
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    const toggleMenu = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(prevState => !prevState);
      }
    };

    window.addEventListener('keydown', toggleMenu);

    return () => {
      window.removeEventListener('keydown', toggleMenu);
    };
  }, [isMobile]);


  // Format to 3 digits max and add suffix if needed
  const formatAmount = (amount) => {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    let suffixIndex = 0;

    // Divide by 1000 and add suffix until the amount is less than 1000
    while (amount >= 1000 && suffixIndex < suffixes.length - 1) {
      amount /= 1000;
      suffixIndex++;
    }

    // Format amount based on its value
    let roundedAmount;
    if (amount >= 100) {
      roundedAmount = Math.round(amount); // No decimal places
    } else if (amount >= 10) {
      roundedAmount = Math.floor(amount * 10) / 10; // 1 decimal place
    } else {
      roundedAmount = Math.floor(amount * 100) / 100; // 2 decimal places
    }

    // Handle trailing zeros
    let formattedAmount = roundedAmount.toString();
    if (formattedAmount.indexOf('.') !== -1) {
      formattedAmount = formattedAmount.replace(/\.?0+$/, '');
    }

    // Return the formatted amount with the suffix
    return `${formattedAmount}${suffixes[suffixIndex]}`;
  };

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
    if (isMobile) return; // ignore on mobile
    // Start the animation loop
    const animationFrameId = requestAnimationFrame(updateComboBarColor);

    // Cleanup function to cancel the animation frame when the component unmounts
    return () => cancelAnimationFrame(animationFrameId);
  }, [lastTargetHitTimestamp, isMobile]); // Dependencies array


  // data refs for game data autosave
  const scoreRef = useRef(Score);
  const coinRef = useRef(Coin);
  const xpRef = useRef(playerProgress.currentXP);
  const levelRef = useRef(playerProgress.currentLevel);
  const storeItemsRef = useRef(storeItems);
  const levelUpUpgradesRef = useRef(levelUpUpgrades);
  const volumeRef = useRef(volume);
  const isShopIndicatorOnRef = useRef(isShopIndicatorOn);
  const playerNameRef = useRef(playerName);
  // Update the ref when the state changes
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    scoreRef.current = Score;
    coinRef.current = Coin;
    xpRef.current = playerProgress.currentXP;
    levelRef.current = playerProgress.currentLevel;
    storeItemsRef.current = storeItems;
    levelUpUpgradesRef.current = levelUpUpgrades;
    volumeRef.current = volume;
    isShopIndicatorOnRef.current = isShopIndicatorOn;
    playerNameRef.current = playerName;
  }, [Score, Coin, playerProgress, storeItems, levelUpUpgrades, volume, isShopIndicatorOn, playerName, isMobile]);
  //local storage auto save in real time
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    if (!isLoading) {
      const gameData = {
        score: scoreRef.current,
        coin: coinRef.current,
        xp: xpRef.current,
        level: levelRef.current,
        storeItems: storeItemsRef.current.map(item => ({ id: item.id, owned: item.owned })),
        levelUpUpgrades: levelUpUpgradesRef.current.map(upgrade => ({ id: upgrade.id, owned: [...upgrade.owned] })),
        volume: volumeRef.current,
        isShopIndicatorOn: isShopIndicatorOnRef.current,
        playerName: playerNameRef.current,
      };
      // Update Local Storage in real-time
      localStorage.setItem('gameData', JSON.stringify(gameData));
    }
  }, [Score, Coin, playerProgress, storeItems, levelUpUpgrades, volume, isShopIndicatorOn, playerName, isLoading, isMobile]);
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


  const lastSavedDataRef = useRef(null);
  //auto save game data on interval to firestore
  useEffect(() => {
    if (isMobile) return; // ignore on mobile
    const initialGameData = localStorage.getItem('gameData');
    lastSavedDataRef.current = initialGameData;

    //check for cheating
    const isPlayerCheating = (currentData, lastData) => {
      const maxScoreIncreasePerMinute = 500;
      const scoreIncrease = currentData.score - lastData.score;

      if (scoreIncrease > maxScoreIncreasePerMinute) {
        return true; // Cheating detected
      }
      return false; // No cheating detected
    };
    //destroy cheaters data
    const resetPlayerData = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        // Delete user data from Firestore
        const docRef = doc(db, 'players', userId);
        try {
          await deleteDoc(docRef);
          console.log('Deleted user data from Firestore for user', userId);
        } catch (error) {
          console.error('Error deleting user data from Firestore:', error);
        }
        // Clear local storage
        localStorage.clear();
        // Reload the page to reset the game
        window.location.reload();
      }
    };
    const autosaveAction = () => {
      const gameDataString = localStorage.getItem('gameData');
      const gameData = JSON.parse(gameDataString);

      if (gameData) {
        const currentTime = Date.now();

        if (lastSavedDataRef.current) {
          const isCheating = isPlayerCheating(gameData, lastSavedDataRef.current);
          if (isCheating) {
            resetPlayerData();
          } else {
            // Proceed with autosave if data has changed
            if (
              JSON.stringify(gameData) !== JSON.stringify(lastSavedDataRef.current)
            ) {
              autosaveGame(gameData)
                .then(() => {
                  console.log(
                    'Autosaved game data to Firestore at',
                    new Date().toLocaleTimeString()
                  );
                  lastSavedDataRef.current = gameData;
                })
                .catch((error) =>
                  console.error('Error autosaving game data to Firestore:', error)
                );
            }
          }
        } else {
          // First-time save
          autosaveGame(gameData)
            .then(() => {
              console.log(
                'Autosaved game data to Firestore at',
                new Date().toLocaleTimeString()
              );
              lastSavedDataRef.current = gameData;
              lastSavedTimeRef.current = currentTime;
            })
            .catch((error) =>
              console.error('Error autosaving game data to Firestore:', error)
            );
        }
      }
    };

    const autosaveInterval = setInterval(autosaveAction, 1000 * 60); // 1min
    return () => clearInterval(autosaveInterval);
  }, [isMobile]);






  // Mobile decorative targets
  const [backgroundTargets, setBackgroundTargets] = useState(Array(12).fill().map(() => generatePosition()));
  // Generate decorative target positions
  useEffect(() => {
    if (!isMobile) return; // Ensure this runs only on mobile
    let lastTargetIndex = null; // Variable to store the last updated target index
    const regeneratePosition = () => {
      let currentTargetIndex;
      do {
        // pick random target index
        currentTargetIndex = Math.floor(Math.random() * 12);
      } while (currentTargetIndex === lastTargetIndex); // Repeat if it's the same as the last index
      setBackgroundTargets(currentTargets =>
        currentTargets.map((target, index) =>
          index === currentTargetIndex ? generatePosition() : target
        )
      );
      // Update lastTargetIndex to the newly regenerated index
      lastTargetIndex = currentTargetIndex;
      // Generate a random interval between 180ms and 360ms
      const nextTimeout = Math.floor(Math.random() * (360 - 180 + 1) + 180);
      // Call regeneratePosition again after the random interval
      setTimeout(regeneratePosition, nextTimeout);
    };
    // Start the recursive timeout loop
    regeneratePosition();
    // Cleanup function to clear timeout when the component unmounts or isMobile changes
    return () => {
      if (regeneratePosition) {
        clearTimeout(regeneratePosition);
      }
    };
  }, [isMobile]);
  // Mobile warning screen
  if (isMobile) {
    return (
      <div className="h-screen w-screen overflow-hidden pointer-events-none">
        <div className="">
          {backgroundTargets.map((pos, index) => (target(pos, index)))}
        </div>
        <div className='animate-playondesktopflash absolute top-0 left-0 h-full w-full flex flex-col justify-center items-center'>
          <div className="text-5xl leading-none text-center">
            mobile not supported
          </div>
          <div className="text-3xl leading-none text-center ">
            play on desktop
          </div>
        </div>
      </div>
    );
  }




  // loading screen
  if (isLoading) {
    return (
      <div className="h-screen w-screen overflow-hidden ">
        <div className='absolute top-0 left-0 z-30 h-full w-full flex flex-col justify-center items-center'>
          {/* game title */}
          < div className="text-6xl lg:text-[20vh] leading-none text-center" >
            aim trainer
          </div >
          {/* glyphteck studio */}
          <div className="text-3xl lg:text-[5vh] leading-none" >
            by glyphteck studiⵙ
          </div>
        </div>
      </div>
    );
  }
  // enforce min screen size
  if (isScreenTooSmall) {
    return (
      <div className="h-screen w-screen overflow-hidden ">
        <div className='absolute top-0 left-0 z-30 h-full w-full flex flex-col justify-center items-center'>
          {/* game title */}
          < div className="text-6xl lg:text-[20vh] leading-none text-center" >
            aim trainer
          </div >
          {/* warning */}
          <div className="text-3xl lg:text-[5vh] leading-none" >
            screen too small
          </div>
        </div>
      </div>
    );
  }
  // Main game
  return (
    <main className="h-screen w-screen bg-cover bg-center">
      {/* target spawn canvas */}
      <div
        style={{ cursor: "url('/greendot.png') 32 32, auto" }}
        className="backdrop-blur-sm h-screen w-screen absolute overflow-hidden"
        onMouseDown={(e) => {
          const clickX = e.clientX;
          const clickY = e.clientY;
          const targetRadius = (baseTargetSize * targetSizeMultiplier) / 2; // Calculate target radius

          // Check if the click is within any ghost target area
          const isClickOnGhost = ghostTargets.some(ghost => {
            const ghostCenterX = ghost.x;
            const ghostCenterY = ghost.y;
            // Calculate the bounding box of the ghost target
            const ghostLeft = ghostCenterX - targetRadius;
            const ghostRight = ghostCenterX + targetRadius;
            const ghostTop = ghostCenterY - targetRadius;
            const ghostBottom = ghostCenterY + targetRadius;

            // Check if the click is within the ghost target's bounds
            return clickX >= ghostLeft && clickX <= ghostRight &&
              clickY >= ghostTop && clickY <= ghostBottom;
          });

          if (!isClickOnGhost) {
            onTargetMiss(e); // Register as miss only if not clicked on ghost
          }
          e.preventDefault();
          e.stopPropagation();
        }}
      >

        {/* Ghost target instances */}
        {ghostTargets.map((ghostTarget, ghostTargetID) => (
          <div
            key={ghostTargetID}
            className="absolute rounded-full"
            style={{
              left: `${ghostTarget.x - (baseTargetSize * targetSizeMultiplier / 2)}px`,
              top: `${ghostTarget.y - (baseTargetSize * targetSizeMultiplier / 2)}px`,
              width: `${baseTargetSize * targetSizeMultiplier}px`,
              height: `${baseTargetSize * targetSizeMultiplier}px`,
            }}
          />
        ))}

        {/* target instances */}
        {targetPositions.map((targetPosition, targetID) => target(targetPosition, targetID))}

        {/* bot instances */}
        {botPositions.map((botPosition, botID) => (
          <div
            key={botID}
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

      {/* main HUD */}
      <div className="pointer-events-none">
        {/* Coin combo multiplier progress bar */}
        <div className=" backdrop-blur-sm border-b-[3px] border-black absolute top-0 left-0 w-full h-[5vh] flex items-center" style={{ backgroundColor: `${comboBarColor.replace('rgb', 'rgba').replace(')', ', 0.4)')}` }}>
          {/* Combo bar filler */}
          <div className={`h-full border-black ${combo == 0 ? '' : 'border-r-[3px]'} `} style={{ width: `${(combo / maxComboLimit) * 100}%`, backgroundColor: `${comboBarColor.replace('rgb', 'rgba').replace(')', ', 0.5)')}` }}></div>
          {/* Label "Combo" on the left */}
          <div className="absolute left-0 h-full px-4 flex items-center">
            <span className="text-[3vh]">combo</span>
          </div>
          {/* Display current Coin combo multiplier in the center */}
          <div className="lowercase absolute left-0 right-0 h-full flex items-center justify-center">
            {combo > 1 && <span className="text-[3vh]">x{formatAmount(combo)}</span>}
          </div>
        </div>

        {/* Target hit and coin and shield counter in corners */}
        <div className="text-8xl px-8 pt-4 absolute top-[32px] w-full flex flex-row justify-center items-center">
          {Score > 0 ? <div>{Score}</div> : <div className="flex-grow"></div>}
        </div>
        <div className="text-6xl px-8 pt-4 absolute top-[5vh] w-full flex flex-row justify-between items-center">
          {Coin > 0 ? <div>{formatAmount(Coin)} ₿</div> : <div className="flex-grow"></div>}
          {currentShield > 0 ?
            <div className='flex flex-row justify-center items-center gap-1 md:gap-3 ' >
              {currentShield}
              <img src="shield.png" className='h-14' alt="Shield" />
            </div> : <div className="flex-grow"></div>}
        </div>

        { /* can shop indicator */}
        {canAfford && isShopIndicatorOn && (
          <div className="animate-flash text-[3vh] w-full absolute bottom-[7vh] left-1/2 transform -translate-x-1/2 flex items-center justify-center">
            <img src="/spacebar.png" alt="Open Shop" style={{ width: '12vh', height: '3vh' }} />
            <div className="w-[0.5vw]"></div>
            <div>to shop</div>
          </div>
        )}

        {/* XP Progress Bar */}
        <div className=" backdrop-blur-sm border-t-[3px] border-black absolute bottom-0 left-0 w-full h-[5vh] bg-xp bg-opacity-65 flex items-center">
          <div className={`h-full border-black bg-xp bg-opacity-50 ${playerProgress.currentXP == 0 ? '' : 'border-r-[3px]'}`} style={{ width: `${playerProgress.currentXP / ((XPNeededToLevelUp(playerProgress.currentLevel))) * 100}%` }}></div>
          {/* Display Level on the far left */}
          <div className="absolute left-0 h-full flex items-center px-4">
            {playerProgress.currentLevel > 1 && <div className="text-[3vh]">Level {playerProgress.currentLevel}</div>}
          </div>
          {/* Display current XP in the middle of the bar */}
          <div className="absolute left-0 right-0 h-full flex items-center justify-center">
            <span className="text-[3vh]">{formatAmount(playerProgress.currentXP)}/{formatAmount(XPNeededToLevelUp(playerProgress.currentLevel))}</span>
          </div>
        </div>

        {/* hit popups */}
        {hitPopups.map((popup) => (
          <div
            key={popup.id}
            className={`fixed transition-opacity ${popup.type === 'gain' ? 'animate-fadeOutGain' : 'animate-fadeOutLoss'}`}
            style={{
              left: `${popup.x - 80}px`,
              top: `${popup.y - 40}px`,
              color: popup.color,
            }}
          >
            {popup.displayText}
          </div>
        ))}
      </div>

      {/*  SPACE Coin store */}
      {showStore && (
        <div className={`${isShopOpen ? 'animate-slideUp' : 'animate-slideDown'} absolute w-screen h-screen top-0 md:h-[85vh] md:top-[15vh] overflow-hidden backdrop-blur-2xl flex flex-col border-t-[3px] border-black`}>
          {/* item list */}
          <div className="overflow-hidden p-[2vh] md:pt-[4vh] gap-[2vh] grid grid-cols-2 grid-rows-5 lg:grid-cols-5 lg:grid-rows-3">
            {storeItems.map((item, index) => {
              // Determine if the current item can be afforded
              const affordable = Coin >= calculateCurrentItemCost(item.baseCost, item.growthRate, item.owned);
              return (
                <div key={item.id} onMouseUp={() => affordable && purchaseItem(item.id)} className={` flex flex-col bg-white bg-opacity-50 rounded-xl md:rounded-3xl px-[2vw] py-[1vh] border-[3px] border-black justify-center items-center text-center ${!affordable && item.owned === 0 ? item.id === nextAffordableItemId ? "opacity-50" : "opacity-0" : affordable ? "" : "opacity-50"}`}>
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

      {/* TAB leaderboard */}
      {showLeaderboard && (
        <div className={` backdrop-blur-xl absolute left-0 top-0 w-screen h-screen flex justify-center items-center  ${isLeaderboardOpen ? 'animate-slideRight' : 'animate-slideLeft'}`}>
          {playerName === "ANONYMOUS" ? (
            <div>
              <div className="text-7xl pb-4 text-center">choose a name</div>
              <input
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                type="text"
                value={nameInput}
                onChange={handleNameInput}
                className="border-[3px] border-black bg-black bg-opacity-25 rounded-3xl px-6 py-0 uppercase cursor-pointer"

              />
            </div>
          ) : (
            <div>
              <div className="text-7xl pb-4">Leaderboard</div>
              {leaderboardData.map((gamedata, index) => (
                <div key={gamedata.id} className="text-3xl flex gap-12 justify-between">
                  <div>{index + 1}</div>
                  <div>{gamedata.playerName}</div>
                  <div>{gamedata.score}</div>
                </div>
              ))}
            </div>
          )}
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
                className={`${upgrade.rarity === 'legendary' ? 'bg-[#e53935]' : upgrade.rarity === 'rare' ? 'bg-[#F89414]' : 'bg-[#3b82f6]'} bg-opacity-30 px-[4vw] py-[4vh] flex justify-center items-center leading-none text-center border-[4px] border-black rounded-3xl ${!isLevelUpInteractable ? 'opacity-50 cursor-not-allowed' : ''}`}
                onMouseUp={() => selectLevelUpUpgrade(upgrade)}
              >
                {getUpgradeDisplay(upgrade)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESC menu overlay */}
      {isMenuOpen && (
        <div className="absolute backdrop-blur-2xl w-screen h-screen">
          {/* Aimtrainer title at the top */}
          <div className='pt-8 absolute w-full text-9xl flex justify-center items-center'>
            aimtrainer
          </div>

          {/* Centered settings options */}
          <div className='w-full h-full flex flex-col justify-center gap-12 items-center'>
            {/* Sound control */}
            <div className='flex flex-row justify-center items-center'>
              <img src="/volume.png" alt="volume icon" style={{ width: '5vh', height: '5vh' }} />
              <div className='w-[2vw]'></div>
              <input
                style={{ backgroundSize: `${volume * 100}% 100%`, cursor: "url('/reddot.png') 32 32, auto" }}
                className="cursor-default w-[15vw] h-[2.5vh] accent-black outline-none"
                id="volume-control"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
            </div>

            {/* Toggle for shop indicator */}
            <div className="flex items-center">
              <label htmlFor="shop-indicator-toggle" className="mr-2 text-[3vh]">show shop indicator:</label>
              <input
                className="accent-black w-6 h-6"
                id="shop-indicator-toggle"
                type="checkbox"
                checked={isShopIndicatorOn}
                onChange={(e) => setIsShopIndicatorOn(e.target.checked)}
              />
            </div>
          </div>

          {/* GT2 icon at the bottom center */}
          <div className="absolute bottom-8 w-full flex justify-center">
            <a href="https://glyphteck.com/" target="_blank" rel="noopener noreferrer">
              <img src="/gt2.png" alt="GT2 icon" className="w-32" />
            </a>
          </div>
        </div>
      )}

    </main >
  );
}
