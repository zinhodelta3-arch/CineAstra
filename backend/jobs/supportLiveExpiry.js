import {report} from '../utils/telemetry.js';

export function createSupportLiveExpiry(service,{intervalMs=60000}={}){
    let timer,stopped=false,running=Promise.resolve();
    const run=()=>{running=(async()=>{
        try{const result=await service.expireBatch();if(result.expired)report('support_live_expired',{count:result.expired});}
        catch{report('support_live_expiry_failed');}
        finally{if(!stopped){timer=setTimeout(run,intervalMs);timer.unref();}}
    })();};
    return {start:run,async close(){stopped=true;clearTimeout(timer);await running;}};
}
