// Money is integer cents throughout; round halves away from zero for nonnegative prices.
const MAX_CENTS=9_999_999_999n;
export function cents(value){
    if(typeof value!=='string'||!/^(0|[1-9]\d{0,7})\.\d{2}$/.test(value))throw new TypeError('Valor monetário inválido');
    const [major,minor]=value.split('.');return BigInt(major)*100n+BigInt(minor);
}
export function money(value){if(typeof value!=='bigint'||value<0n||value>MAX_CENTS)throw new RangeError('Valor monetário fora do limite');return `${value/100n}.${String(value%100n).padStart(2,'0')}`;}
export function roundDiv(n,d){if(n<0n||d<=0n)throw new RangeError('Cálculo inválido');return (n+d/2n)/d;}
export function percent(value,bps){if(!Number.isInteger(bps)||bps<0||bps>10000)throw new RangeError('Percentual inválido');return roundDiv(value*BigInt(bps),10000n);}
export function basePrice(cost,markupBps){return cost+percent(cost,markupBps);}
export function marginBps(price,cost){if(cost===0n)return null;return Number((price-cost)*10000n/cost);}
export function ordinaryQuote({cost,base,discountBps,capBps,minMarginBps}){
    const applied=Math.min(discountBps,capBps),unfloored=base-percent(base,applied),final=unfloored<cost?cost:unfloored;
    return {price:final,discountBps:applied,discountCapped:discountBps>capBps,belowMargin:cost>0n&&(final-cost)*10000n<cost*BigInt(minMarginBps),floorApplied:unfloored<cost};
}
export function ticketQuote({cost,base,publicDiscountBps=0,privateDiscountBps=0,halfEligible=false,capBps,minMarginBps,halfProjectionBps=5000}){
    const publicBps=Math.min(publicDiscountBps,capBps),publicPrice=base-percent(base,publicBps);
    const ordinary=ordinaryQuote({cost,base,discountBps:publicBps+privateDiscountBps,capBps,minMarginBps});
    const half=roundDiv(publicPrice,2n);
    const legalHalf=halfEligible&&half<=ordinary.price;
    const price=legalHalf?half:ordinary.price;
    // Projection at reference occupancy: public full price for other tickets and legal half for the configured share.
    const projectedPerTicket=roundDiv(ordinary.price*BigInt(10000-halfProjectionBps)+half*BigInt(halfProjectionBps),10000n);
    return {price,publicPrice,halfPrice:half,benefit:legalHalf?'MEIA':ordinary.discountBps?'DESCONTO':'INTEIRA',discountBps:legalHalf?0:ordinary.discountBps,discountCapped:ordinary.discountCapped,belowCost:price<cost,belowMargin:cost>0n&&(price-cost)*10000n<cost*BigInt(minMarginBps),projectedBelowMargin:cost>0n&&(projectedPerTicket-cost)*10000n<cost*BigInt(minMarginBps)};
}
export function addMoney(...values){return values.reduce((a,b)=>a+b,0n);}
