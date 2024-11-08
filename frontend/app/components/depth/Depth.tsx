"use client";

import { useEffect, useState } from "react";
import { getDepth, getKlines, getTicker, getTrades } from "../../utils/httpClient";

import { SignalingManager } from "../../utils/SignalingManager";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
type OrderData = [string, string];

// Enhanced Ask Table Component
export const AskTable = ({ asks }: { asks: OrderData[] }) => {
  const relevantAsks = asks.slice(0, 15).reverse();
  let currentTotal = 0;
  const asksWithTotal = relevantAsks.map(([price, quantity]) => {
    currentTotal += Number(quantity);
    return [price, quantity, currentTotal];
  });
  const maxTotal = currentTotal;
  asksWithTotal.reverse();

  return (
    <div className="space-y-1">
      {asksWithTotal.map(([price, quantity, total]) => (
        <Ask
          key={price}
          price={price}
          quantity={quantity}
          total={total}
          maxTotal={maxTotal}
        />
      ))}
    </div>
  );
};

// Enhanced Bid Table Component
export const BidTable = ({ bids }: { bids: OrderData[] }) => {
  const relevantBids = bids.slice(0, 15);
  let currentTotal = 0;
  const bidsWithTotal = relevantBids.map(([price, quantity]) => {
    currentTotal += Number(quantity);
    return [price, quantity, currentTotal];
  });
  const maxTotal = currentTotal;

  return (
    <div className="space-y-1">
      {bidsWithTotal.map(([price, quantity, total]) => (
        <Bid
          key={price}
          price={price}
          quantity={quantity}
          total={total}
          maxTotal={maxTotal}
        />
      ))}
    </div>
  );
};

// Enhanced Order Row Components
function Ask({ price, quantity, total, maxTotal }: {
  price: string;
  quantity: string;
  total: number;
  maxTotal: number;
}) {
  return (
    <div className="relative h-8 group">
      <div
        className="absolute inset-0 bg-red-500/10 transition-all duration-300"
        style={{ width: `${(total / maxTotal) * 100}%` }}
      />
      <div className="relative flex justify-between items-center h-full px-3 text-sm group-hover:bg-red-500/5">
        <span className="font-medium text-red-500">{Number(price).toFixed(2)}</span>
        <span className="text-gray-300">{Number(quantity).toFixed(4)}</span>
        <span className="text-gray-400">{total.toFixed(4)}</span>
      </div>
    </div>
  );
}

function Bid({ price, quantity, total, maxTotal }: {
  price: string;
  quantity: string;
  total: number;
  maxTotal: number;
}) {
  return (
    <div className="relative h-8 group">
      <div
        className="absolute inset-0 bg-green-500/10 transition-all duration-300"
        style={{ width: `${(total / maxTotal) * 100}%` }}
      />
      <div className="relative flex justify-between items-center h-full px-3 text-sm group-hover:bg-green-500/5">
        <span className="font-medium text-green-500">{Number(price).toFixed(2)}</span>
        <span className="text-gray-300">{Number(quantity).toFixed(4)}</span>
        <span className="text-gray-400">{total.toFixed(4)}</span>
      </div>
    </div>
  );
}
export function Depth({ market }: {market: string}) {
    const [bids, setBids] = useState<OrderData[]>();
    const [asks, setAsks] = useState<OrderData[]>();
    const [price, setPrice] = useState<string>();
    const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      let lastPrice = 0;
  
      SignalingManager.getInstance().registerCallback("depth", (data: any) => {
        setBids((originalBids) => {
          const bidsAfterUpdate = [...(originalBids || [])];
          updateOrderBook(bidsAfterUpdate, data.bids, false);
          return bidsAfterUpdate;
        });
  
        setAsks((originalAsks) => {
          const asksAfterUpdate = [...(originalAsks || [])];
          updateOrderBook(asksAfterUpdate, data.asks, true);
          return asksAfterUpdate;
        });
      }, `DEPTH-${market}`);
  
      const initializeData = async () => {
        try {
          const [depthData, tickerData, tradesData] = await Promise.all([
            getDepth(market),
            getTicker(market),
            getTrades(market)
          ]);
  
          setBids(depthData.bids.reverse());
          setAsks(depthData.asks);
          
          const newPrice = tradesData[0].price;
          setPrice(newPrice);
          setPriceChange(Number(newPrice) > Number(lastPrice) ? 'up' : 'down');
          lastPrice = Number(newPrice);
          
        } catch (error) {
          console.error('Error fetching initial data:', error);
        } finally {
          setLoading(false);
        }
      };
  
      SignalingManager.getInstance().sendMessage({
        "method": "SUBSCRIBE",
        "params": [`depth@${market}`]
      });
  
      initializeData();
  
      return () => {
        SignalingManager.getInstance().sendMessage({
          "method": "UNSUBSCRIBE",
          "params": [`depth@${market}`]
        });
        SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
      };
    }, [market]);
  
    function updateOrderBook(
      original: OrderData[],
      updates: OrderData[],
      isAsk: boolean
    ) {
      for (let i = 0; i < original.length; i++) {
        for (let j = 0; j < updates.length; j++) {
          if (original[i][0] === updates[j][0]) {
            original[i][1] = updates[j][1];
            if (Number(original[i][1]) === 0) {
              original.splice(i, 1);
            }
            break;
          }
        }
      }
  
      for (let j = 0; j < updates.length; j++) {
        if (
          Number(updates[j][1]) !== 0 &&
          !original.map((x) => x[0]).includes(updates[j][0])
        ) {
          original.push(updates[j]);
          break;
        }
      }
  
      original.sort((x, y) =>
        Number(y[0]) > Number(x[0]) ? (isAsk ? 1 : -1) : isAsk ? -1 : 1
      );
    }
  
    return (
      <Card className="bg-[#14151B] border-gray-800">
        <CardContent className="p-4">
          <TableHeader />
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {asks && <AskTable asks={asks} />}
              
              <div className="flex items-center justify-center py-4 space-x-2">
                {priceChange && (
                  <span className={`transition-colors duration-300 ${
                    priceChange === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {priceChange === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </span>
                )}
                <span className="text-xl font-bold text-white">
                  {Number(price).toFixed(2)?195.89:195.79}
                </span>
              </div>
              
              {bids && <BidTable bids={bids} />}
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  
  function TableHeader() {
    return (
      <div className="flex justify-between items-center mb-4 px-3">
        <span className="text-gray-400 text-sm font-medium">Price</span>
        <span className="text-gray-400 text-sm font-medium">Size</span>
        <span className="text-gray-400 text-sm font-medium">Total</span>
      </div>
    );
  }
