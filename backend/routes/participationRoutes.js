import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {invitationBody,proposalBody,consentBody,participantParams,participantPage,competenceQuery} from '../validators/participationValidators.js';

export const participationOperations=[
  {method:'get',path:'/api/subscriptions/{subscriptionId}/participants',operationId:'list_subscription_participants'},
  {method:'get',path:'/api/subscriptions/{subscriptionId}/participants/history',operationId:'subscription_participant_history'},
  {method:'post',path:'/api/subscriptions/{subscriptionId}/invitations',operationId:'invite_subscription_participant'},
  {method:'get',path:'/api/subscription-invitations/me',operationId:'list_my_subscription_invitations'},
  {method:'post',path:'/api/subscription-invitations/{invitationId}/accept',operationId:'accept_subscription_invitation'},
  {method:'post',path:'/api/subscription-invitations/{invitationId}/decline',operationId:'decline_subscription_invitation'},
  {method:'post',path:'/api/subscriptions/{subscriptionId}/participants/me/leave',operationId:'leave_subscription'},
  {method:'post',path:'/api/subscriptions/{subscriptionId}/participants/{userId}/suspend',operationId:'suspend_subscription_participant'},
  {method:'post',path:'/api/subscriptions/{subscriptionId}/participants/{userId}/resume',operationId:'resume_subscription_participant'},
  {method:'post',path:'/api/subscriptions/{subscriptionId}/division-proposals',operationId:'propose_subscription_division'},
  {method:'get',path:'/api/subscriptions/{subscriptionId}/division-proposals/pending',operationId:'get_pending_subscription_division'},
  {method:'post',path:'/api/subscriptions/{subscriptionId}/division-proposals/{proposalId}/consent',operationId:'consent_subscription_division'},
  {method:'get',path:'/api/subscriptions/{subscriptionId}/next-cycle',operationId:'preview_subscription_next_cycle'},
  {method:'get',path:'/api/subscriptions/{subscriptionId}/charges',operationId:'list_own_subscription_charges'}
];
const noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
export function participationRoutes(controller,{auth,limits}){
  const r=Router(),client=[noStore,auth,allowRoles('CLIENTE')],write=[...client,...limits.checkout];
  r.get('/api/subscriptions/:subscriptionId/participants',...client,participantParams,controller.members);
  r.get('/api/subscriptions/:subscriptionId/participants/history',...client,participantParams,participantPage,controller.history);
  r.post('/api/subscriptions/:subscriptionId/invitations',...write,participantParams,validateBody(invitationBody),controller.invite);
  r.get('/api/subscription-invitations/me',...client,participantPage,controller.myInvitations);
  r.post('/api/subscription-invitations/:invitationId/accept',...write,participantParams,controller.accept);
  r.post('/api/subscription-invitations/:invitationId/decline',...write,participantParams,controller.decline);
  r.post('/api/subscriptions/:subscriptionId/participants/me/leave',...write,participantParams,controller.leave);
  r.post('/api/subscriptions/:subscriptionId/participants/:userId/suspend',...write,participantParams,controller.suspend);
  r.post('/api/subscriptions/:subscriptionId/participants/:userId/resume',...write,participantParams,controller.resume);
  r.post('/api/subscriptions/:subscriptionId/division-proposals',...write,participantParams,validateBody(proposalBody),controller.propose);
  r.get('/api/subscriptions/:subscriptionId/division-proposals/pending',...client,participantParams,controller.pendingDivision);
  r.post('/api/subscriptions/:subscriptionId/division-proposals/:proposalId/consent',...write,participantParams,validateBody(consentBody),controller.consent);
  r.get('/api/subscriptions/:subscriptionId/next-cycle',...client,participantParams,controller.preview);
  r.get('/api/subscriptions/:subscriptionId/charges',...client,participantParams,competenceQuery,controller.charges);
  return r;
}
