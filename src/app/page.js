"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // State to hold the positions of the targets
  const [targetPositions, setTargetPositions] = useState([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },]);

  // target hit counter
  const [targetHitsCount, setTargetHitsCount] = useState(0);

  // State to track the amount of gold the player has
  const [gold, setGold] = useState(0);

  // Store the timestamp of the last hit
  const [lastTargetHitTimestamp, setLastTargetHitTimestamp] = useState(0);

  // Store the time elapsed since the last hit
  const [targetHitInterval, setTargetHitInterval] = useState(0);


  //generate new random positions for the targets
  const generatePositions = () => {
    const newTargetPositions = targetPositions.map(() => {
      // Subtracting 100 to ensure the target doesn't overflow the screen
      const x = Math.random() * (window.innerWidth - 100);
      const y = Math.random() * (window.innerHeight - 100);
      return { x, y };
    });
    setTargetPositions(newTargetPositions);
  };
  useEffect(() => {
    generatePositions();
    setIsLoading(false);
  }, []);

  // Tracking time since last target hit
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastTargetHitTimestamp > 0) {
        setTargetHitInterval(Date.now() - lastTargetHitTimestamp);
      }
    }, 10); // Update every 0.01 seconds

    return () => clearInterval(interval);
  }, [lastTargetHitTimestamp]);


  // regenerate position for a single target
  const regeneratePosition = (targetID) => {
    const newTargetPositions = [...targetPositions];
    newTargetPositions[targetID] = {
      x: Math.random() * (window.innerWidth - 100),
      y: Math.random() * (window.innerHeight - 100),
    };
    setTargetPositions(newTargetPositions);
  };

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
    <main className="font-helvetica font-bold text-black h-screen w-screen bg-blue-400 overflow-hidden">
      {/* Target hit counter */}
      <div className="absolute top-[6%] left-1/2 transform -translate-x-1/2 text-center text-6xl">
        {targetHitsCount}
      </div>
      {/* Gold counter */}
      <div className="absolute top-4 left-4 text-3xl text-yellow-500">
        {gold}
      </div>
      {/* Target hit interval */}
      <div className="absolute top-12 left-4 text-3xl">
        {(targetHitInterval / 1000).toFixed(2)}s
      </div>
      {/* target spawn canvas */}
      <div className="h-screen w-screen relative" style={{ cursor: "url('/test2.png') 32 32, auto" }}>
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
