'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RendererContext } from '@/lib/engine/webgl/RendererContext';
import { CoordinateMap } from '@/lib/engine/webgl/CoordinateMap';
import { HUDOverlay } from './HUDOverlay';

export default function ChartController() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Engine state
    const engineRef = useRef<{
        renderer: RendererContext | null;
        coords: CoordinateMap;
        rafId: number;
        isDragging: boolean;
        lastMouse: { x: number, y: number };
    }>({
        renderer: null,
        coords: new CoordinateMap(),
        rafId: 0,
        isDragging: false,
        lastMouse: { x: 0, y: 0 }
    });

    const [hudData, setHudData] = useState<{
        x: number; y: number; time: string; open: number; high: number; low: number; close: number; volume: number; visible: boolean; delta?: number;
    }>({
        x: 0, y: 0, time: '', open: 0, high: 0, low: 0, close: 0, volume: 0, visible: false
    });

    // Initialize WebGL
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        try {
            const renderer = new RendererContext(canvasRef.current);
            engineRef.current.renderer = renderer;
            
            // Set initial mock view
            engineRef.current.coords.setView(0, 100, 40000, 60000);

            // Resize Observer
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    renderer.resize(width, height);
                    engineRef.current.coords.resize(width, height);
                }
            });
            
            resizeObserver.observe(containerRef.current);

            // Render loop
            const render = () => {
                if (!engineRef.current.renderer) return;
                
                engineRef.current.renderer.clear();
                
                // In a real implementation:
                // 1. Get current transform matrix from coords
                // 2. renderer.renderCandles(...)
                // 3. Render indicators / heatmap layers
                
                engineRef.current.rafId = requestAnimationFrame(render);
            };
            
            render();

            return () => {
                resizeObserver.disconnect();
                cancelAnimationFrame(engineRef.current.rafId);
            };
        } catch (e) {
            console.error("Failed to initialize Assetura Pro Engine", e);
        }
    }, []);

    // Interaction Handlers
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        engineRef.current.isDragging = true;
        engineRef.current.lastMouse = { x: e.clientX, y: e.clientY };
        canvasRef.current?.setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const engine = engineRef.current;
        
        // Handle Panning
        if (engine.isDragging) {
            const dx = engine.lastMouse.x - e.clientX;
            const dy = engine.lastMouse.y - e.clientY;
            
            engine.coords.pan(dx, dy);
            engine.lastMouse = { x: e.clientX, y: e.clientY };
        }

        // Handle HUD update
        if (canvasRef.current && !engine.isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const timeVal = engine.coords.pixelToTime(x);
            const priceVal = engine.coords.pixelToPrice(y);

            // In reality, map `timeVal` to nearest candle index and get exact OHLC
            setHudData({
                x, y,
                time: new Date(Date.now() - (100 - timeVal) * 60000).toLocaleTimeString(),
                open: priceVal * 0.99,
                high: priceVal * 1.01,
                low: priceVal * 0.98,
                close: priceVal,
                volume: Math.floor(Math.random() * 10000),
                delta: Math.floor(Math.random() * 200) - 100,
                visible: true
            });
        }
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        engineRef.current.isDragging = false;
        canvasRef.current?.releasePointerCapture(e.pointerId);
    }, []);

    const handlePointerLeave = useCallback(() => {
        setHudData(prev => ({ ...prev, visible: false }));
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Semantic zooming around cursor
        const scale = e.deltaY > 0 ? 1.1 : 0.9;
        
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            engineRef.current.coords.zoom(scale, x, y);
        }
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-full bg-[#000000] overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }} // Crucial for custom kinetic panning
        >
            {/* Primary WebGL Layer */}
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 cursor-crosshair"
            />
            
            {/* HUD Overlay */}
            <HUDOverlay data={hudData} />
            
            {/* Future Additions: 
                - WebWorker communication for analytical offloading
                - SVG Layer for specific drawing tools that don't need WebGL 
            */}
        </div>
    );
}
