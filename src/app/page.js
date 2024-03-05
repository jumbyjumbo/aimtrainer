"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // target positions
  const [targetPositions, setTargetPositions] = useState([{ x: 0, y: 0 }]);

  // target hit counter
  const [targetHitsCount, setTargetHitsCount] = useState(0);

  // State to track the amount of gold the player has
  const [gold, setGold] = useState(0);

  // Store the timestamp of the last hit
  const [lastTargetHitTimestamp, setLastTargetHitTimestamp] = useState(0);

  // Store the time elapsed since the last hit
  const [targetHitInterval, setTargetHitInterval] = useState(0);


  //generate new random positions for the targets
  const generatePosition = () => ({
    x: Math.random() * (window.innerWidth - 100),
    y: Math.random() * (window.innerHeight - 100),
  });


  useEffect(() => {
    setIsLoading(false);
  }, []);

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
    // Add event listener for the 'keydown' event
    const handleKeyPress = (event) => {
      if (event.key === 't' || event.key === 'T') {
        addTarget();
      }
      if (event.key === 'g' || event.key === 'G') {
        removeTarget();
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

  // Tracking time since last target hit
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastTargetHitTimestamp > 0) {
        setTargetHitInterval(1000 - (Date.now() - lastTargetHitTimestamp));
      }
    }, 10); // Update every 0.01 seconds

    return () => clearInterval(interval);
  }, [lastTargetHitTimestamp]);

  // reward function
  const calculateGoldEarned = (timeDifference) => {
    return timeDifference > 800 || timeDifference < 10
      ? 1
      : Math.floor(1.3 ** ((1000 - timeDifference) * 0.01));
  };

  // gold reward based on speed
  const targetHitGoldReward = () => {
    const currentTime = Date.now();
    const timeDifference = lastTargetHitTimestamp > 0 ? currentTime - lastTargetHitTimestamp : 0;
    setLastTargetHitTimestamp(currentTime);
    setTargetHitInterval(0);
    const goldEarned = calculateGoldEarned(timeDifference);
    setGold((prevGold) => prevGold + goldEarned);
  };

  // when u hit a target
  const onTargetHit = (targetID) => {
    regeneratePosition(targetID);
    setTargetHitsCount(prevCount => prevCount + 1);
    targetHitGoldReward();
  };

  // loading screen
  if (isLoading) {
    return <div className="font-helvetica font-bold text-black h-screen w-screen bg-blue-400 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-6xl">
        AIM TRAINER
      </div>
    </div>;
  }

  // Main game screen
  return (
    <main className="text-2xl md:text-6xl font-helvetica font-bold text-white h-screen w-screen bg-blue-400 overflow-hidden" style={{ cursor: "url('/reddot.png') 32 32, auto" }}>
      {/* Target hit counter */}
      <div className="absolute top-[6%] left-1/2 transform -translate-x-1/2 text-center text-4xl md:text-8xl">
        {targetHitsCount}
      </div>
      {/* Gold counter */}
      <div className=" absolute top-[6%] left-4">
        {gold}
      </div>
      {/* Target hit interval */}
      {targetHitInterval > 0 && (
        <div className="absolute top-[12%] left-4">
          {(targetHitInterval / 1000).toFixed(2)}s
        </div>
      )}
      {/* target spawn canvas */}
      <div className="h-screen w-screen relative">
        {/* Render each target */}
        {targetPositions.map((targetPosition, targetID) => (
          <div
            key={targetID}
            onMouseDown={() => onTargetHit(targetID)} // Regenerate position for this target on hit
            className="absolute w-24 h-24 bg-red-600 rounded-full border-[3px] border-black"
            style={{
              left: `${targetPosition.x}px`,
              top: `${targetPosition.y}px`,
            }}
          />
        ))}
      </div>
    </main>
  );
}
