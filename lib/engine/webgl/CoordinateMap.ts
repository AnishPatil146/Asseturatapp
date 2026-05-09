export class CoordinateMap {
    // Current view boundaries in domain space
    public timeMin: number;
    public timeMax: number;
    public priceMin: number;
    public priceMax: number;

    // Viewport dimensions
    public width: number = 0;
    public height: number = 0;

    constructor() {
        this.timeMin = 0;
        this.timeMax = 100;
        this.priceMin = 0;
        this.priceMax = 100;
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public setView(timeMin: number, timeMax: number, priceMin: number, priceMax: number) {
        this.timeMin = timeMin;
        this.timeMax = timeMax;
        
        // Logarithmic / adaptive scaling
        this.priceMin = priceMin;
        this.priceMax = priceMax;
    }

    public autoScaleY(prices: Float64Array | Float32Array, startIndex: number, endIndex: number) {
        if (startIndex >= endIndex || prices.length === 0) return;

        let min = Infinity;
        let max = -Infinity;

        // O(n) within the visible range, where n is screen width in candles
        for (let i = startIndex; i < endIndex; i++) {
            const p = prices[i];
            if (p < min) min = p;
            if (p > max) max = p;
        }

        // Apply a 5% margin
        const range = max - min;
        this.priceMin = min - range * 0.05;
        this.priceMax = max + range * 0.05;
    }

    // Convert Time to Pixel (X)
    public timeToPixel(time: number): number {
        const range = this.timeMax - this.timeMin;
        if (range === 0) return 0;
        return ((time - this.timeMin) / range) * this.width;
    }

    // Convert Price to Pixel (Y) - Inverted for canvas/WebGL
    public priceToPixel(price: number): number {
        const range = this.priceMax - this.priceMin;
        if (range === 0) return 0;
        return this.height - ((price - this.priceMin) / range) * this.height;
    }

    // Convert Pixel to Time (X)
    public pixelToTime(x: number): number {
        const range = this.timeMax - this.timeMin;
        return this.timeMin + (x / this.width) * range;
    }

    // Convert Pixel to Price (Y)
    public pixelToPrice(y: number): number {
        const range = this.priceMax - this.priceMin;
        return this.priceMax - (y / this.height) * range;
    }

    // Get WebGL Transform Matrix (3x3 for 2D)
    public getTransformMatrix(): Float32Array {
        // Creates a matrix that transforms (time, price) into NDC (-1 to 1)
        const tr = new Float32Array(9);
        const tRange = this.timeMax - this.timeMin;
        const pRange = this.priceMax - this.priceMin;

        // Scaling factors
        const sx = 2.0 / tRange;
        const sy = 2.0 / pRange;

        // Translation factors
        const tx = -1.0 - (this.timeMin * sx);
        const ty = -1.0 - (this.priceMin * sy);

        // Column-major order for WebGL
        tr[0] = sx;  tr[1] = 0.0; tr[2] = 0.0;
        tr[3] = 0.0; tr[4] = sy;  tr[5] = 0.0;
        tr[6] = tx;  tr[7] = ty;  tr[8] = 1.0;

        return tr;
    }

    // Handle kinetic panning
    public pan(dx: number, dy: number) {
        // dx and dy are in pixels
        const dt = (dx / this.width) * (this.timeMax - this.timeMin);
        const dp = (dy / this.height) * (this.priceMax - this.priceMin);

        this.timeMin -= dt;
        this.timeMax -= dt;

        // Only pan Y if free-scrolling is enabled, otherwise we auto-scale
        this.priceMin += dp; // + because pixel Y is inverted relative to price
        this.priceMax += dp;
    }

    // Handle semantic zooming around a center pixel
    public zoom(scale: number, centerX: number, centerY: number) {
        const centerTime = this.pixelToTime(centerX);
        const centerPrice = this.pixelToPrice(centerY);

        const timeRange = (this.timeMax - this.timeMin) * scale;
        const priceRange = (this.priceMax - this.priceMin) * scale;

        // Determine proportion of center relative to range
        const xProp = centerX / this.width;
        const yProp = 1.0 - (centerY / this.height); // Invert Y

        this.timeMin = centerTime - timeRange * xProp;
        this.timeMax = centerTime + timeRange * (1 - xProp);

        this.priceMin = centerPrice - priceRange * yProp;
        this.priceMax = centerPrice + priceRange * (1 - yProp);
    }
}
