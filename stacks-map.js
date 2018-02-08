'use strict';
const { stacksMap } = require('serverless-plugin-split-stacks');
stacksMap['AWS::Logs::LogGroup'] = {
  destination: 'Filters',
  allowSuffix: true
};
console.log(stacksMap);
