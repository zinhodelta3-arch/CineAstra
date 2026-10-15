const SCALE=10000000000000n;
const parseIndex=value=>{if(typeof value!=='string'||!/^\d{1,8}(\.\d{1,13})?$/.test(value))throw new TypeError('Índice IPCA inválido');const [whole,fraction='']=value.split('.');const parsed=BigInt(whole)*SCALE+BigInt(fraction.padEnd(13,'0'));if(parsed<=0n)throw new TypeError('Índice IPCA inválido');return parsed;};
export function createIbgeIpcaProvider({fetcher=fetch}={}){
  const cache=new Map();
  return {async index(period){
    if(!/^\d{4}(0[1-9]|1[0-2])$/.test(period))throw new TypeError('Período IPCA inválido');
    if(cache.has(period))return cache.get(period);
    const url=`https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/2266/p/${period}/d/v2266%2013`;
    const response=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error('IBGE indisponível');
    const body=await response.json();const row=Array.isArray(body)?body.find(item=>item.D1C==='1'&&item.D2C==='2266'&&item.D3C===period):null;
    if(!row)throw new Error('IPCA ainda não publicado');
    const index=parseIndex(row.V);cache.set(period,index);return index;
  }};
}
