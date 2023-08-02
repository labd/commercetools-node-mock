import { Router } from 'express'
import { PaymentRepository } from '../repositories/payment.js'
import AbstractService from './abstract.js'

export class MyPaymentService extends AbstractService {
	public repository: PaymentRepository

	constructor(parent: Router, repository: PaymentRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'me/payments'
	}
}
