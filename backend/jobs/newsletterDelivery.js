import {report} from '../utils/telemetry.js';

export function createNewsletterDeliveryJob(service,{intervalMs=10000}={}){
    let timer,stopped=false,running=Promise.resolve();
    const run=()=>{running=(async()=>{
        try{const result=await service.runBatch();if(result.sent)report('newsletter_delivery_sent',{count:result.sent});if(result.failed)report('newsletter_delivery_retry_pending',{count:result.failed});}
        catch{report('newsletter_delivery_failed');}
        finally{if(!stopped){timer=setTimeout(run,intervalMs);timer.unref();}}
    })();};
    return {start:run,async close(){stopped=true;clearTimeout(timer);await running;}};
}
