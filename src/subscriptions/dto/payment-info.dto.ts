export class PaymentInfoDto  {
    method: { type: String, enum: ['credit', 'debit', 'none'], default: 'none' };
    transactionId: { type: String }
}