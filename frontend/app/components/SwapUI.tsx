"use client";
import { useState } from "react";
import { buy, sell } from "../utils/httpClient";

export function SwapUI({ market }: { market: string }) {
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [activeTab, setActiveTab] = useState('buy');
    const [type, setType] = useState('limit');

    async function handleBuy() {
        const res = await buy(price, quantity);
        if (res) console.log(res);
    }

    async function handleSell() {
        const res = await sell(price, quantity);
        if (res) console.log(res);
    }

    return (
        <div className="w-full max-w-[380px] min-w-[320px]">
            <div className="flex flex-col h-[660px] bg-[#14151B] rounded-lg shadow-lg">
                {/* Trade Type Tabs */}
                <div className="flex flex-row h-[48px] border-b border-gray-800">
                    <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
                    <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Order Type Selection */}
                <div className="flex flex-col p-4 gap-4">
                    <div className="flex flex-row gap-6 border-b border-gray-800 pb-2">
                        <LimitButton type={type} setType={setType} />
                        <MarketButton type={type} setType={setType} />
                    </div>

                    {/* Balance Display */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Available Balance</span>
                        <span className="text-white font-medium">36.94 USDC</span>
                    </div>

                    {/* Price Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Price</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full h-12 bg-[#1E1F25] rounded-lg px-4 pr-16 text-right text-xl text-white border border-gray-700 focus:border-blue-500 focus:ring-0"
                                placeholder="0"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-gray-400">USDC</span>
                            </div>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Quantity</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full h-12 bg-[#1E1F25] rounded-lg px-4 pr-16 text-right text-xl text-white border border-gray-700 focus:border-blue-500 focus:ring-0"
                                placeholder="0"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-gray-400">SOL</span>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-sm text-gray-400">≈ 0.00 USDC</span>
                        </div>
                    </div>

                    {/* Percentage Buttons */}
                    <div className="flex justify-between gap-2 mt-2">
                        {["25%", "50%", "75%", "Max"].map((percent) => (
                            <button
                                key={percent}
                                className="flex-1 py-1 px-2 rounded-full text-sm text-gray-300 bg-[#1E1F25] hover:bg-[#2A2B31] transition-colors"
                            >
                                {percent}
                            </button>
                        ))}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={activeTab === 'buy' ? handleBuy : handleSell}
                        className={`w-full h-12 mt-4 rounded-lg font-semibold text-white transition-all ${
                            activeTab === 'buy'
                                ? 'bg-[#039E64]'
                                : 'bg-[#EF5350] '
                        }`}
                    >
                        {activeTab === 'buy' ? 'Buy' : 'Sell'}
                    </button>

                    {/* Additional Options */}
                    <div className="flex justify-between mt-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-checkbox rounded bg-[#1E1F25] border-gray-700" />
                                <span className="text-sm text-gray-400">Post Only</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-checkbox rounded bg-[#1E1F25] border-gray-700" />
                                <span className="text-sm text-gray-400">IOC</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LimitButton({ type, setType }: { type: string; setType: (type: string) => void }) {
    return (
        <button
            onClick={() => setType('limit')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
                type === 'limit'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
            }`}
        >
            Limit
        </button>
    );
}

function MarketButton({ type, setType }: { type: string; setType: (type: string) => void }) {
    return (
        <button
            onClick={() => setType('market')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
                type === 'market'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
            }`}
        >
            Market
        </button>
    );
}

function BuyButton({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
    return (
        <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 font-medium transition-colors ${
                activeTab === 'buy'
                    ? 'text-green-500 bg-green-500/5 border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-gray-200'
            }`}
        >
            Buy
        </button>
    );
}

function SellButton({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
    return (
        <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 font-medium transition-colors ${
                activeTab === 'sell'
                    ? 'text-red-500 bg-red-500/5 border-b-2 border-red-500'
                    : 'text-gray-400 hover:text-gray-200'
            }`}
        >
            Sell
        </button>
    );
}