import React from 'react';

interface DealerProps {
  message?: string;
}

const Dealer: React.FC<DealerProps> = ({ message }) => {
  return (
    <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
      <div className="relative">
        {/* Dealer Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-red-800 to-red-950 border-4 border-yellow-500 shadow-2xl flex items-center justify-center overflow-hidden">
           <img 
             src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dealer&clothing=suit&accessories=glasses" 
             alt="Dealer" 
             className="w-full h-full object-cover"
           />
        </div>
        <div className="absolute -bottom-2 bg-black/80 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/50 whitespace-nowrap left-1/2 -translate-x-1/2">
          DEALER
        </div>
      </div>
      
      {/* Dealer Speech Bubble */}
      {message && (
        <div className="absolute top-20 w-48 bg-white text-black text-xs p-2 rounded-xl shadow-lg rounded-t-none animate-in fade-in slide-in-from-top-2">
           {message}
        </div>
      )}
    </div>
  );
};

export default Dealer;
