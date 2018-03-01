'use strict';
import { success, failure, notAllowed } from './../libs/response-lib';
import * as conekta from 'conekta';
conekta.api_key = process.env.CONEKTA_API_KEY;
conekta.api_version = '2.0.0';

export async function createOxxoCharge(event, context, callback) {
  console.log(conekta);
}
