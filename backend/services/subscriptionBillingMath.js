import {cents,money,roundDiv} from './pricingMath.js';

const dayMs=86400000;
export function daysLate(due,today){const a=Date.parse(`${due}T00:00:00Z`),b=Date.parse(`${today}T00:00:00Z`);if(!Number.isFinite(a)||!Number.isFinite(b))throw new TypeError('Data inválida');return Math.max(0,Math.floor((b-a)/dayMs));}
export function dueAfterCycle(end){const t=Date.parse(`${end}T00:00:00Z`);if(!Number.isFinite(t))throw new TypeError('Ciclo inválido');return new Date(t+dayMs).toISOString().slice(0,10);}
export function competenceOf(date){return `${date.slice(0,7)}-01`;}
export function cycleEnd(due,period){const date=new Date(`${due}T00:00:00Z`);if(!Number.isFinite(date.getTime()))throw new TypeError('Ciclo inválido');const day=date.getUTCDate(),year=date.getUTCFullYear(),month=date.getUTCMonth();const next=new Date(Date.UTC(year+(period==='ANUAL'?1:0),month+(period==='MENSAL'?1:0),1));const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();return new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth(),Math.min(day,last))-dayMs).toISOString().slice(0,10);}
export function signedCents(value){if(typeof value!=='string'||!/^[-]?(0|[1-9]\d{0,7})\.\d{2}$/.test(value))throw new TypeError('Valor inválido');return value.startsWith('-')?-cents(value.slice(1)):cents(value);}
export function signedMoney(value){return value<0n?`-${money(-value)}`:money(value);}
export function chargeTotal(row){const total=cents(row.valor_devido)+cents(row.valor_multa_aplicada??'0.00')+cents(row.juros_mora??'0.00')+signedCents(row.correcao_ipca??'0.00');if(total<=0n)throw new RangeError('Cobrança sem valor positivo');return money(total);}
export function lateCharges(base,days,indexStart,indexEnd){
  if(!Number.isInteger(days)||days<0||indexStart<=0n||indexEnd<=0n)throw new TypeError('Encargo inválido');
  const principal=cents(base),fine=days?roundDiv(principal*2n,100n):0n;
  const interest=roundDiv(principal*BigInt(days),3000n);
  const diff=indexEnd-indexStart;
  const correction=diff>=0n?roundDiv(principal*diff,indexStart):-roundDiv(principal*(-diff),indexStart);
  return {fine:money(fine),interest:money(interest),correction:signedMoney(correction)};
}
