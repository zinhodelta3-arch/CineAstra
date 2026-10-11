import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {streamingFilmIdParam,streamingIdParam,streamingPage} from '../validators/streamingValidators.js';

export const streamingOperations=[
    {method:'get',path:'/api/streaming/my-accesses',operationId:'list_my_streaming_accesses'},
    {method:'post',path:'/api/streaming/{accessId}/play',operationId:'play_streaming_access'},
    {method:'post',path:'/api/streaming/films/{filmId}/play',operationId:'play_streaming_with_subscription'}
];
const noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
export function streamingRoutes(controller,{auth,limits}){
    const router=Router();
    router.get('/api/streaming/my-accesses',noStore,auth,allowRoles('CLIENTE'),streamingPage,controller.list);
    router.post('/api/streaming/:accessId/play',noStore,auth,allowRoles('CLIENTE'),...limits.checkout,streamingIdParam,controller.play);
    router.post('/api/streaming/films/:filmId/play',noStore,auth,allowRoles('CLIENTE'),...limits.checkout,streamingFilmIdParam,controller.playWithPlan);
    return router;
}
