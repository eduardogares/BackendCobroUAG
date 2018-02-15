'use strict';

import * as request from 'request';
import { success, failure, notAllowed } from './../libs/response-lib';

const accessToken = process.env.FB_MSN_ACCESS_TOKEN;

export async function webhook(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(JSON.stringify(event));
  if (event.httpMethod === 'GET') {
    // facebook app verification
    if (
      event.queryStringParameters &&
      event.queryStringParameters['hub.verify_token'] ===
        process.env.FB_VERIFY_TOKEN &&
      event.queryStringParameters['hub.challenge']
    ) {
      return callback(
        null,
        success(parseInt(event.queryStringParameters['hub.challenge']))
      );
    } else {
      return callback('Invalid token');
    }
  }
  if (event.httpMethod === 'POST') {
    const { object, entry } = JSON.parse(event.body || {});
    await Promise.all(
      entry.map(async entry => {
        console.log(JSON.stringify(entry));
        entry.messaging &&
          (await Promise.all(
            entry.messaging.map(async messagingItem => {
              console.log(JSON.stringify(messagingItem));
              if (messagingItem.optin) {
                await onReceivedAuthentication(messagingItem);
              } else if (messagingItem.postback) {
                await onReceivedPostback(messagingItem);
              } else if (messagingItem.message) {
                await onReceiveMessage(messagingItem);
              } else if (messagingItem.delivery) {
                await onReceivedDeliveryConfirmation(messagingItem);
              } else if (messagingItem.read) {
                await onReceivedMessageRead(messagingItem);
              } else if (messagingItem.account_linking) {
                await onReceivedAccountLink(messagingItem);
              } else {
                console.log(
                  'Webhook received unknown messagingItem: ',
                  messagingItem
                );
              }
            })
          ));
      })
    );
  }
  return callback(null, success({ error: false }));
}

async function onReceivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;
  var payload = event.postback.payload;
  console.log(
    "Received postback for user %d and page %d with payload '%s' " + 'at %d',
    senderID,
    recipientID,
    payload,
    timeOfPostback
  );
  var message = event.message;
  var isEcho = message ? message.is_echo : false;
  var messageId = message ? message.mid : '';
  var appId = message ? message.app_id : '';
  var metadata = message ? message.metadata : '';
  if (isEcho) {
    // Just logging message echoes to console
    console.log(
      'Received echo for message %s and app %d with metadata %s',
      messageId,
      appId,
      metadata
    );
    return;
  }
  await sendTypingOn(senderID);
  if (event.postback) {
    switch (event.postback.payload) {
      case 'INIT_CONV':
        await sendWelcomeMessage(senderID);
        break;

      case 'INIT_HOW_IT_WORKS':
        await sendHowItWorks(senderID);
        break;

      case 'INIT_HOW_IT_WORKS_2':
        await sendHowItWorks(senderID);
        break;

      default:
        console.log(`Unknown postback ${event.postback.payload}`);
        break;
    }
  }
  await sendTypingOff(senderID);
}

async function onReceiveMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;
  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;
  if (isEcho) {
    // Just logging message echoes to console
    console.log(
      'Received echo for message %s and app %d with metadata %s',
      messageId,
      appId,
      metadata
    );
    return;
  }
  console.log(
    'Received message for user %d and page %d at %d with message:',
    senderID,
    recipientID,
    timeOfMessage
  );
  if (messageText) {
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText
      .replace(/[^\w\s]/gi, '')
      .trim()
      .toLowerCase()) {
      case 'comenzar':
      case 'get started':
        await sendWelcomeMessage(senderID);
        break;
      default:
        const quotes = [
          'Para iniciar de nuevo escribe Comenzar',
          '😶',
          '😜',
          'Selecciona una opción o escribe Comenzar para iniciar de nuevo'
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        await sendTextMessage(senderID, randomQuote);
        break;
    }
  }
}

async function onReceivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log(
    'Received authentication for user %d and page %d with pass ' +
      "through param '%s' at %d",
    senderID,
    recipientID,
    passThroughParam,
    timeOfAuth
  );

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  await sendTextMessage(senderID, 'Authentication successful');
}

async function onReceivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log(
        'Received delivery confirmation for message ID: %s',
        messageID
      );
    });
  }

  console.log('All message before %d were delivered.', watermark);
}

function onReceivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log(
    'Received message read event for watermark %d and sequence ' + 'number %d',
    watermark,
    sequenceNumber
  );
}

function onReceivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log(
    'Received account link event with for user %d with status %s ' +
      'and auth code %s ',
    senderID,
    status,
    authCode
  );
}

async function sendTextMessage(recipientId, messageText) {
  return await callSendAPI({
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: 'DEVELOPER_DEFINED_METADATA'
    }
  });
}

async function sendWelcomeMessage(recipientId) {
  await sendTextMessage(recipientId, '¡Buen día!');
  await sendTypingOn(recipientId);
  await sendTextMessage(
    recipientId,
    'Desliza hacia los lados para encontrar diferentes opciones o utiliza el menú de inicio para un acceso rápido.'
  );
  return await sendHowItWorks(recipientId);
}

async function sendHowItWorks(recipientId) {
  return await callSendAPI({
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: 'compact',
          elements: [
            {
              title: 'Paso 1',
              subtitle: 'Descripción paso 1',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category1.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            },
            {
              title: 'Paso 2',
              subtitle: 'Descripción paso 2',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category2.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            },
            {
              title: 'Paso 3',
              subtitle: 'Descripción paso 3',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category3.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            },
            {
              title: 'Paso 4',
              subtitle: 'Descripción paso 4',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category4.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            }
          ],
          buttons: [
            {
              type: 'postback',
              title: 'Siguiente',
              payload: 'INIT_VALIDATE_PURCHASE_2'
            }
          ]
        }
      }
    }
  });
}

async function sendHowItWorks2(recipientId) {
  return await callSendAPI({
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: 'compact',
          elements: [
            {
              title: 'Paso 1',
              subtitle: 'Descripción paso 1',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category1.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            },
            {
              title: 'Paso 2',
              subtitle: 'Descripción paso 2',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category2.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            },
            {
              title: 'Paso 3',
              subtitle: 'Descripción paso 3',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category3.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            },
            {
              title: 'Paso 4',
              subtitle: 'Descripción paso 4',
              image_url:
                'https://s3.amazonaws.com/boletomovil/messenger/category4.png',
              buttons: [],
              default_action: {
                type: 'web_url',
                url: 'https://boletomovil.com',
                messenger_extensions: false,
                webview_height_ratio: 'TALL'
              }
            }
          ],
          buttons: [
            {
              type: 'postback',
              title: 'Volver',
              payload: 'INIT_VALIDATE_PURCHASE'
            }
          ]
        }
      }
    }
  });
}

async function sendTypingOn(recipientId) {
  console.log('Turning typing indicator on');

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_on'
  };

  await callSendAPI(messageData);
}

async function sendTypingOff(recipientId) {
  console.log('Turning typing indicator off');

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_off'
  };

  await callSendAPI(messageData);
}

async function callSendAPI(messageData) {
  try {
    const response = await new Promise((resolve, reject) => {
      request(
        {
          uri: 'https://graph.facebook.com/v2.6/me/messages',
          qs: { access_token: process.env.FB_MSN_ACCESS_TOKEN },
          method: 'POST',
          json: messageData
        },
        (error, response, body) => {
          if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            if (messageId) {
              console.log(
                'Successfully sent message with id %s to recipient %s',
                messageId,
                recipientId
              );
            } else {
              console.log(
                'Successfully called Send API for recipient %s',
                recipientId
              );
            }
            resolve(response);
          } else {
            console.error(
              'Failed calling Send API',
              response.statusCode,
              response.statusMessage,
              body.error
            );
            reject(body.error);
          }
        }
      );
    });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
}
