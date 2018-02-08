'use strict';

import request = require('request');
import { success, failure, notAllowed } from './../libs/response-lib';
import * as moment from 'moment';
import 'moment-timezone';

export async function alarmHandler(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(JSON.stringify(event));
  try {
    if (event.Records) {
      await Promise.all(
        event.Records.map(async record => {
          const { Trigger: trigger } = JSON.parse(record.Sns.Message || {});
          const env = process.env.NODE_ENV || 'dev';
          let {
            MetricName: metricName,
            Threshold: threshold,
            Period: period
          } = trigger;
          let { value: functionName } = trigger.Dimensions[0];
          const config = {
            url: process.env.SLACK_PURCHASE_ALERT_WEBHOOK_URL,
            method: 'POST',
            followAllRedirects: true,
            body: JSON.stringify({
              text: `*------SISTEMA------*\n*Ambiente:* ${env}\n*Fecha de Alerta:* ${moment()
                .tz('America/Mexico_City')
                .format(
                  'YYYY/MM/DD HH:mm:ss'
                )}\n*Función:* ${functionName}\n*Alerta:* ${metricName}\n*Límite superado:* ${threshold}\n*Periodo (segundos):* ${period}-----------------`
            })
          };
          console.log(JSON.stringify(config));
          const response: { http: any; body: string } = await new Promise<any>(
            (resolve, reject) => {
              request(config, (error, http, body) => {
                if (error) {
                  console.log('Error sending Slack notification:');
                  reject(error);
                }
                resolve({ http, body });
              });
            }
          );
          const headers = response.http.headers;
          const statusCode = response.http.statusCode;
          console.log('Slack alert sent successfully:');
          console.log('headers: ', headers);
          console.log('statusCode: ', statusCode);
          console.log('body: ', response.body);
          return callback(null, success({ error: false }));
        })
      );
    }
  } catch (error) {
    console.log('Error: ', error);
    return callback(null, success({ error: false }));
  }
}

export async function logHandler(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(JSON.stringify(event));
  return callback(null, success({ error: false }));
}
