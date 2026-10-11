import {report} from '../utils/telemetry.js';
export function createSubscriptionBillingJob(billing,{intervalMs=3600000}={}){
  let timer,stopped=false,running=Promise.resolve(),cursor='0';
  const run=()=>{running=(async()=>{
    try{const result=await billing.runOnce({cursor});cursor=result.nextCursor;}
    catch{report('subscription_billing_failed');}
    finally{if(!stopped){timer=setTimeout(run,intervalMs);timer.unref();}}
  })();};
  return {start:run,async close(){stopped=true;clearTimeout(timer);await running;}};
}
