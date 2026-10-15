import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createParticipationController(service){return {
  members:async(req,res)=>success(res,await service.members(req.params.subscriptionId,context(req))),
  history:async(req,res)=>success(res,await service.history(req.params.subscriptionId,req.participantPage,context(req))),
  invite:async(req,res)=>success(res,await service.invite(req.params.subscriptionId,req.input.userId,context(req)),201),
  myInvitations:async(req,res)=>success(res,await service.myInvitations(req.participantPage,context(req))),
  accept:async(req,res)=>success(res,await service.decide(req.params.invitationId,true,context(req))),
  decline:async(req,res)=>success(res,await service.decide(req.params.invitationId,false,context(req))),
  leave:async(req,res)=>success(res,await service.changeMember(req.params.subscriptionId,req.usuario.id,'SAIU',context(req))),
  suspend:async(req,res)=>success(res,await service.changeMember(req.params.subscriptionId,req.params.userId,'SUSPENSO',context(req))),
  resume:async(req,res)=>success(res,await service.changeMember(req.params.subscriptionId,req.params.userId,'ATIVO',context(req))),
  propose:async(req,res)=>success(res,await service.propose(req.params.subscriptionId,req.input.divisionMode,context(req)),201),
  pendingDivision:async(req,res)=>success(res,await service.pendingDivision(req.params.subscriptionId,context(req))),
  consent:async(req,res)=>success(res,await service.consent(req.params.subscriptionId,req.params.proposalId,req.input.accept,context(req))),
  preview:async(req,res)=>success(res,await service.preview(req.params.subscriptionId,context(req))),
  charges:async(req,res)=>success(res,await service.currentCharges(req.params.subscriptionId,req.competence,context(req)))
};}
