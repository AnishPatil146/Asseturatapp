'use client'

import React from 'react';

interface HUDData {
    x: number;
    y: number;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    delta?: number;
    visible: boolean;
}

export const HUDOverlay: React.FC<{ data: HUDData }> = ({ data }) => {
    if (!data.visible) return null;

    // Offset slightly so it doesn't cover the crosshair directly
    const left = data.x + 15;
    const top = data.y + 15;

    // Color logic
    const isBullish = data.close >= data.open;
    const ohlcColor = isBullish ? 'text-[#00FF88]' : 'text-[#FF3131]';

    return (
        <div 
            className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
            style={{ 
                left: `${left}px`, 
                top: `${top}px`,
                // "JARVIS-style" glassmorphism
                background: 'rgba(10, 10, 15, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}
        >
            <div className="p-3 text-xs font-mono text-gray-300 min-w-[160px]">
                <div className="mb-2 pb-1 border-b border-white/10 text-gray-400">
                    {data.time}
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>O:</span> <span className={ohlcColor}>{data.open.toFixed(2)}</span>
                    <span>H:</span> <span className={ohlcColor}>{data.high.toFixed(2)}</span>
                    <span>L:</span> <span className={ohlcColor}>{data.low.toFixed(2)}</span>
                    <span>C:</span> <span className={ohlcColor}>{data.close.toFixed(2)}</span>
                </div>
                
                <div className="mt-2 pt-1 border-t border-white/10 flex justify-between">
                    <span className="text-gray-400">Vol:</span>
                    <span className="text-white">{data.volume.toLocaleString()}</span>
                </div>
                
                {data.delta !== undefined && (
                    <div className="mt-1 flex justify-between">
                        <span className="text-gray-400">Δ:</span>
                        <span className={data.delta >= 0 ? 'text-[#00FF88]' : 'text-[#FF3131]'}>
                            {data.delta > 0 ? '+' : ''}{data.delta.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
