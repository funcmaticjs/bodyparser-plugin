const createError = require('http-errors')
const contentType = require('content-type')
const qs = require('qs')
const multipart = require('parse-multipart')

class BodyParserPlugin {

  constructor(options) {
    options = options || { }
  }

  async request(ctx, next) {
    const event = ctx.event
    if (!event.body) { 
      event.body = null 
      return await next()
    }
    let header =  event.headers['Content-Type'] || event.headers['content-type']
    if (!header) {
      return await next()
    }
    let content = { type: 'UNKNOWN', parameters: { } }
    try { 
      content = contentType.parse(header)
    } catch (err) {
      console.warn(`Failed to parse content type: ${err.message} ${header}`)
      return await next()
    }
    switch(content.type) {
      case 'application/json':
        event.body = parseJSON(ctx, content.parameters)
        break
      case 'application/x-www-form-urlencoded':
        event.body = parseURLEncoded(ctx, content.parameters)
        break
      case 'multipart/form-data':
        event.body = parseMultipart(ctx, content.parameters)
      default:
        // no op
        break
    }
    return await next()
  }
}

function parseJSON(ctx) {
  try {
    return JSON.parse(ctx.event.body)
  } catch (err) {
    ctx.logger.error(`Unprocessable Entity: Invalid JSON`)
    ctx.logger.debug(ctx.event.body)
    throw createError(422, `Unprocessable Entity: Invalid JSON`)  
  }
}

function parseURLEncoded(ctx) {
  try {
    return qs.parse(ctx.event.body)
  } catch (err) {
    ctx.logger.error(`Unprocessable Entity: Invalid Form URL Encoding`)
    ctx.logger.debug(ctx.event.body)
    throw createError(422, `Unprocessable Entity: Invalid Form URL Encoding`)  
  }
} 

// Parsed format: 
// [ 
//   { 
//     filename: 'A.txt',
//     type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> 
//   },
//   ...
// ]
// https://github.com/freesoftwarefactory/parse-multipart
function parseMultipart(ctx, parameters) {
  try {
    return multipart.Parse(new Buffer(ctx.event.body, 'base64'), parameters.boundary)
  } catch (err) {
    ctx.logger.error(`Unprocessable Entity: Invalid Multipart Encoding`)
    ctx.logger.debug(ctx.event.body)
    throw createError(422, `Unprocessable Entity: Invalid Multipart Encoding`)  
  }
}

module.exports = BodyParserPlugin