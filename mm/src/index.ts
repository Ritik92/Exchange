import axios from "axios";

interface Order {
    orderId: string;
    market: string;
    price: number;
    quantity: number;
    side: "buy" | "sell";
    userId: string;
}

interface MarketConfig {
    basePrice: number;
    volatility: number;
    minOrderCount: number;
    maxOrderCount: number;
    baseQuantity: number;
    quantityVolatility: number;
    priceDecimals: number;
    quantityDecimals: number;
    quantityUpdateInterval: number;  // milliseconds
    orderCountUpdateInterval: number // milliseconds
}

const BASE_URL = "http://localhost:3000";
const MARKET = "TATA_INR";
const USER_ID = "5";

const marketConfig: MarketConfig = {
    basePrice: 194,
    volatility: 0.002,
    minOrderCount: 60,
    maxOrderCount: 100,        // Increased max for more variation
    baseQuantity: 5,
    quantityVolatility: 0.8,
    priceDecimals: 1,
    quantityDecimals: 2,
    quantityUpdateInterval: 1000,    // 3 seconds
    orderCountUpdateInterval: 3000  // 12 seconds
};

class OrderBookSimulator {
    private lastPrice: number;
    private priceHistory: number[] = [];
    private targetOrderCount: number;
    private lastQuantityUpdate: number = Date.now();
    private lastOrderCountUpdate: number = Date.now();
    private quantityMultiplier: number = 1;
    private marketTrend: number = 0; // -1: downtrend, 0: neutral, 1: uptrend

    constructor(private config: MarketConfig) {
        this.lastPrice = config.basePrice;
        this.targetOrderCount = this.config.minOrderCount;
        this.updateMarketTrend();
    }

    private updateMarketTrend() {
        // Randomly change market trend every ~30 seconds
        if (Math.random() < 0.03) {
            this.marketTrend = Math.floor(Math.random() * 3) - 1;
        }
    }

    private updateQuantityMultiplier() {
        const now = Date.now();
        if (now - this.lastQuantityUpdate >= this.config.quantityUpdateInterval) {
            // More dramatic quantity changes
            const baseChange = (Math.random() - 0.5) * 0.4; // ±20% change
            const trendEffect = this.marketTrend * 0.1; // Market trend influence
            this.quantityMultiplier = Math.max(0.5, Math.min(2, 
                this.quantityMultiplier * (1 + baseChange + trendEffect)
            ));
            this.lastQuantityUpdate = now;
        }
    }

    private updateTargetOrderCount() {
        const now = Date.now();
        if (now - this.lastOrderCountUpdate >= this.config.orderCountUpdateInterval) {
            // More variation in order count
            const range = this.config.maxOrderCount - this.config.minOrderCount;
            const randomFactor = Math.pow(Math.random(), 2); // Bias towards lower numbers
            this.targetOrderCount = Math.floor(
                this.config.minOrderCount + range * randomFactor
            );
            this.lastOrderCountUpdate = now;
        }
    }

    private generateQuantity(priceLevel: number): number {
        this.updateQuantityMultiplier();
        
        // Base quantity with level decay
        const levelFactor = Math.exp(-priceLevel * 0.08);
        
        // Time-based waves (faster cycles)
        const timeFactor = (
            Math.sin(Date.now() / 5000) * 0.3 + 
            Math.sin(Date.now() / 12000) * 0.2 +
            1
        );
        
        // More volatile random factor
        const randomFactor = Math.pow(Math.random(), 0.5) * 1.5;
        
        // Apply current market trend
        const trendFactor = 1 + (this.marketTrend * 0.1);
        
        const quantity = this.config.baseQuantity * 
            levelFactor * 
            timeFactor * 
            randomFactor * 
            this.quantityMultiplier *
            trendFactor;
        
        return Number(Math.max(0.1, quantity).toFixed(this.config.quantityDecimals));
    }

    private calculatePriceLevel(basePrice: number, level: number, side: "buy" | "sell"): number {
        const direction = side === "buy" ? -1 : 1;
        
        // Dynamic price steps based on market trend
        const trendFactor = 1 + (this.marketTrend * direction * 0.1);
        
        let priceStep: number;
        if (level < 10) {
            priceStep = basePrice * 0.0001 * (level + 1) * trendFactor;
        } else if (level < 20) {
            priceStep = basePrice * 0.0002 * (level + 1) * trendFactor;
        } else {
            priceStep = basePrice * 0.0003 * (level + 1) * trendFactor;
        }
        
        return Number((basePrice + direction * priceStep).toFixed(this.config.priceDecimals));
    }

    private shouldCancelOrder(order: Order, currentPrice: number, totalOrders: number): boolean {
        if (totalOrders <= this.config.minOrderCount) {
            return false;
        }

        const priceDeviation = Math.abs(order.price - currentPrice) / currentPrice;
        
        // Time-based cancellation (more frequent)
        const timeBased = Math.random() < 0.05;
        
        // Distance-based cancellation
        const distanceBased = priceDeviation > 0.08;
        
        // Count-based cancellation
        const countBased = totalOrders > this.targetOrderCount && Math.random() < 0.15;
        
        // Trend-based cancellation
        const trendBased = (this.marketTrend === 1 && order.side === "sell" && Math.random() < 0.1) ||
                          (this.marketTrend === -1 && order.side === "buy" && Math.random() < 0.1);
        
        return timeBased || distanceBased || countBased || trendBased;
    }

    async simulateOrderBook() {
        try {
            this.updateMarketTrend();
            this.updateTargetOrderCount();
            const currentPrice = this.updatePrice();

            const response = await axios.get(`${BASE_URL}/api/v1/order/open?userId=${USER_ID}&market=${MARKET}`);
            const openOrders: Order[] = response.data;

            const bids = openOrders.filter(o => o.side === "buy");
            const asks = openOrders.filter(o => o.side === "sell");

            const cancelPromises: Promise<any>[] = openOrders
                .filter(order => this.shouldCancelOrder(order, currentPrice, 
                    order.side === "buy" ? bids.length : asks.length))
                .map(order => 
                    axios.delete(`${BASE_URL}/api/v1/order`, {
                        data: { orderId: order.orderId, market: MARKET }
                    })
                );

            await Promise.all(cancelPromises);

            const requiredBids = Math.max(0, this.targetOrderCount - bids.length);
            const requiredAsks = Math.max(0, this.targetOrderCount - asks.length);

            const newOrderPromises: Promise<any>[] = [];

            for (let i = 0; i < Math.max(requiredBids, requiredAsks); i++) {
                if (i < requiredBids) {
                    const price = this.calculatePriceLevel(currentPrice, i, "buy");
                    newOrderPromises.push(
                        axios.post(`${BASE_URL}/api/v1/order`, {
                            market: MARKET,
                            price: price.toString(),
                            quantity: this.generateQuantity(i).toString(),
                            side: "buy",
                            userId: USER_ID
                        })
                    );
                }

                if (i < requiredAsks) {
                    const price = this.calculatePriceLevel(currentPrice, i, "sell");
                    newOrderPromises.push(
                        axios.post(`${BASE_URL}/api/v1/order`, {
                            market: MARKET,
                            price: price.toString(),
                            quantity: this.generateQuantity(i).toString(),
                            side: "sell",
                            userId: USER_ID
                        })
                    );
                }
            }

            await Promise.all(newOrderPromises);

            // Shorter update interval for more frequent changes
            const nextUpdateTime = 500 + Math.random() * 300;
            await new Promise(resolve => setTimeout(resolve, nextUpdateTime));
            this.simulateOrderBook();

        } catch (error) {
            console.error("Error in order book simulation:", error);
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.simulateOrderBook();
        }
    }

    private updatePrice(): number {
        const trendEffect = this.marketTrend * this.config.volatility;
        const randomFactor = (Math.random() - 0.5) * 2;
        const meanReversion = (this.config.basePrice - this.lastPrice) * 0.1;
        const priceChange = (this.lastPrice * this.config.volatility * randomFactor) + 
                           meanReversion + trendEffect;
        
        this.lastPrice = Math.max(0, this.lastPrice + priceChange);
        this.priceHistory.push(this.lastPrice);
        if (this.priceHistory.length > 100) this.priceHistory.shift();
        
        return this.lastPrice;
    }
}

// Start the simulation
const simulator = new OrderBookSimulator(marketConfig);
simulator.simulateOrderBook();