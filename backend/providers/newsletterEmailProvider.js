import {ApiError} from '../utils/ApiError.js';

export function unavailableNewsletterEmailProvider(){return {
    name:null,available:false,
    async assertAvailable(){throw ApiError.indisponivel();},
    async sendConfirmation(){throw ApiError.indisponivel();},
    async sendAuthorization(){throw ApiError.indisponivel();},
    async sendCampaign(){throw ApiError.indisponivel();},
    async verifyBounce(){throw ApiError.indisponivel();}
};}
