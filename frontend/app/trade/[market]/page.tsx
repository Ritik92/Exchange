"use client";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUI";
import { TradeView } from "@/app/components/TradeView";
import { Depth } from "@/app/components/depth/Depth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams } from "next/navigation";

export default function Page() {
    const { market } = useParams();
    return <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1">
            <MarketBar market={market as string} />
            <div className="flex flex-row h-[920px] border-y border-slate-800">
                <div className=" flex-1 ">
                    <TradeView market={market as string} />
                </div>
                <div className="flex flex-col  h-1/2 w-1/4  overflow-auto pb-6  ">
                <ScrollArea className="hide-scrollbar">
                <Depth market={market as string} /> 
                </ScrollArea>
                    
                </div>
            </div>
        </div>
        <div className="w-[10px] flex-col border-slate-800 border-l"></div>
        <div>
            <div className="flex flex-col w-[250px]">
                <SwapUI market={market as string} />
            </div>
        </div>
    </div>
}