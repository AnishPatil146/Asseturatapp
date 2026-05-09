/**
 * Liquidity Heatmap - Price Density Visualization
 * Calculates heat using Y-axis binning, volume accumulation, and an exponential time-decay factor.
 */
export class LiquidityBinning {
    public bins: Float64Array;
    public tickSize: number;
    public decayFactor: number;
    private maxPrice: number;
    private minPrice: number;
    private numBins: number;

    constructor(minPrice: number, maxPrice: number, tickSize: number, decayFactor: number = 0.99) {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.tickSize = tickSize;
        this.decayFactor = decayFactor;
        
        // Ensure bounds are aligned to tick size
        this.minPrice = Math.floor(minPrice / tickSize) * tickSize;
        this.maxPrice = Math.ceil(maxPrice / tickSize) * tickSize;

        this.numBins = Math.ceil((this.maxPrice - this.minPrice) / tickSize);
        
        // Zero-copy SharedArrayBuffer preparation (if available in the environment)
        try {
            const buffer = new SharedArrayBuffer(this.numBins * Float64Array.BYTES_PER_ELEMENT);
            this.bins = new Float64Array(buffer);
        } catch (e) {
            // Fallback if SAB is disabled or not available
            this.bins = new Float64Array(this.numBins);
        }
    }

    // Convert price to bin index
    private priceToIndex(price: number): number {
        const index = Math.floor((price - this.minPrice) / this.tickSize);
        return Math.max(0, Math.min(this.numBins - 1, index));
    }

    /**
     * Add volume to a specific price point
     */
    public addVolume(price: number, volume: number) {
        const idx = this.priceToIndex(price);
        // Using Atomics if SharedArrayBuffer is utilized in a Worker, but for local TS:
        this.bins[idx] += volume;
    }

    /**
     * Apply exponential moving decay to simulate time-decay
     * This mimics how order books clear over time and older liquidity becomes less relevant.
     */
    public applyDecay() {
        for (let i = 0; i < this.numBins; i++) {
            this.bins[i] *= this.decayFactor;
            
            // Avoid denormalized floats / memory issues
            if (this.bins[i] < 1e-6) {
                this.bins[i] = 0;
            }
        }
    }

    /**
     * Process an incoming tick or candle
     * If OHLC, spread the volume across the body/wick uniformly.
     */
    public processCandle(open: number, high: number, low: number, close: number, volume: number) {
        // Simple uniform volume distribution across the candle range
        const top = Math.max(open, close);
        const bottom = Math.min(open, close);
        
        const topIdx = this.priceToIndex(top);
        const botIdx = this.priceToIndex(bottom);
        const range = topIdx - botIdx + 1; // inclusive

        const volPerBin = volume / range;

        for (let i = botIdx; i <= topIdx; i++) {
            this.bins[i] += volPerBin;
        }

        // High/low wicks get a fraction (e.g. 10%) of the volume density
        const wickVol = (volume * 0.1) / ((this.priceToIndex(high) - this.priceToIndex(low)) || 1);
        
        const extremeHighIdx = this.priceToIndex(high);
        const extremeLowIdx = this.priceToIndex(low);
        
        for (let i = extremeLowIdx; i < botIdx; i++) {
            this.bins[i] += wickVol;
        }
        for (let i = topIdx + 1; i <= extremeHighIdx; i++) {
            this.bins[i] += wickVol;
        }
    }

    /**
     * Get the max liquidity for normalization in shaders
     */
    public getMaxLiquidity(): number {
        let max = 0;
        for (let i = 0; i < this.numBins; i++) {
            if (this.bins[i] > max) max = this.bins[i];
        }
        return max;
    }
}
