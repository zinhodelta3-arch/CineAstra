import {ApiError} from '../utils/ApiError.js';

// Adaptador real deve assinar somente objetos em origem privada e devolver HTTPS
// de um host de entrega explicitamente permitido, com validade curta.
export function unavailableStreamingProvider(){return {available:false,privateOrigin:false,deliveryHosts:[],async sign(){throw ApiError.indisponivel();}};}
