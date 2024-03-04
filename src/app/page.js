"use client"
import React, { useState, useEffect } from 'react';

export default function Home() {
  // State to hold the positions of the targets
  const [targetPositions, setTargetPositions] = useState([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]);
  // target hit counter
  const [targetHitsCount, setTargetHitsCount] = useState(0);

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

  //set the initial positions of the targets
  useEffect(() => {
    generatePositions();
  }, []);

  // regenerate position for a single target
  const regeneratePosition = (targetID) => {
    const newTargetPositions = [...targetPositions];
    newTargetPositions[targetID] = {
      x: Math.random() * (window.innerWidth - 100),
      y: Math.random() * (window.innerHeight - 100),
    };
    setTargetPositions(newTargetPositions);
  };

  // on target hit
  const onTargetHit = (targetID) => {
    regeneratePosition(targetID);
    // Increment the number of hits
    setTargetHitsCount((prevHitsCount) => prevHitsCount + 1);
  };

  return (
    <main className="h-screen w-screen bg-blue-400 overflow-hidden">
      <div className="absolute top-[6%] left-1/2 transform -translate-x-1/2 text-center text-6xl font-bold">
        {targetHitsCount}
      </div>
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
