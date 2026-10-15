import {report} from '../utils/telemetry.js';

export function createCheckoutExpiry(checkout,{intervalMs=30000}={}){
    let timer,stopped=false,running=Promise.resolve();
    const run=()=>{
        running=(async()=>{
            try{await checkout.expireBatch(25);}
            catch{report('checkout_expiry_failed');}
            finally{if(!stopped){timer=setTimeout(run,intervalMs);timer.unref();}}
        })();
    };
    return {start:run,async close(){stopped=true;clearTimeout(timer);await running;}};
}
