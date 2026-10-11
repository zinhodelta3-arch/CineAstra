import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {query,financialQuery,auditQuery,httpQuery} from '../validators/reportValidators.js';
export const reportOperations=[
    {method:'get',path:'/api/admin/reports/finance',operationId:'admin_financial_report',action:'finance'},
    {method:'get',path:'/api/admin/reports/social-allocation',operationId:'admin_social_allocation',action:'social'},
    {method:'get',path:'/api/admin/audit-logs',operationId:'admin_audit_log',action:'audit'},
    {method:'get',path:'/api/admin/http-logs',operationId:'admin_http_log',action:'http'}
];
export function reportRoutes(controller,{auth}){const r=Router();for(const item of reportOperations)r.get(item.path,(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('ADMIN'),query(['finance','social'].includes(item.action)?financialQuery:item.action==='audit'?auditQuery:httpQuery,'reportQuery'),controller[item.action]);return r;}
