const BodyParserPlugin = require('../lib/parser')
const qs = require('qs')
const multipart = require('parse-multipart')
const noop = async () => { }

describe('JSON Body', () => {
  let ctx = null
  let plugin = null 
  beforeEach(() => {
    ctx = {
      event: {
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      },
      logger: console
    }
    plugin = new BodyParserPlugin()
  })
  it ('should parse valid JSON', async () => {
    ctx.event.body = JSON.stringify({ hello: "world" })
    await plugin.request(ctx, noop)
    expect(ctx.event.body).toMatchObject({
      hello: "world"
    })
  })
  it ('should throw HTTP error 422 for invalid JSON', async () => {
    let error = null
    try {
      ctx.event.body = 'INVALID JSON'
      await plugin.request(ctx, noop)
    } catch (err) {
      error = err
    }
    expect(error).toBeTruthy()
    expect(error.status).toBe(422)
    expect(error.message).toEqual('Unprocessable Entity: Invalid JSON')
  })
}) 

describe('Form Body', () => {
  let ctx = null
  let plugin = null 
  beforeEach(() => {
    ctx = {
      event: {
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      },
      logger: console
    }
    plugin = new BodyParserPlugin()
  })
  it ('should parse valid form encoding', async () => {
    ctx.event.body = qs.stringify({ a: 'b' })
    await plugin.request(ctx, noop)
    expect(ctx.event.body).toMatchObject({
      a: 'b'
    })
  })
  it ('should throw HTTP error 422 for invalid form encoding', async () => {
    // TODO: I don't know how to make qs.parse actually throw error :)
    // let error = null
    // try {
    //   ctx.event.body = 'INVALID FORM URLENCODING'
    //   await plugin.request(ctx, noop)
    // } catch (err) {
    //   error = err
    // }
    // console.log("BODY", ctx.event.body)
    // expect(error).toBeTruthy()
    // expect(error.status).toBe(422)
    // expect(error.message).toEqual('Unprocessable Entity: Invalid Form URL Encoding')
  })
}) 

describe('Multipart Body', () => {
  let ctx = null
  let plugin = null 
  beforeEach(() => {
    ctx = {
      event: {
        headers: {
          'content-type': "multipart/form-data; boundary=----WebKitFormBoundaryvef1fLxmoUdYZWXp"
        },
        isBase64Encoded: true
      },
      logger: console
    }
    plugin = new BodyParserPlugin()
  })
  it ('should parse valid multipart encoding', async () => {
    ctx.event.body = multipart.DemoData().toString('base64')
    await plugin.request(ctx, noop)
    expect(ctx.event.body.length).toBe(2)
    expect(ctx.event.body[0]).toMatchObject({
      filename: 'A.txt',
      type: 'text/plain'
    })
    expect(ctx.event.body[1]).toMatchObject({
      filename: 'B.txt',
      type: 'text/plain'
    })
  })
}) 

describe('Unknown Body', () => {
  let ctx = null
  let plugin = null 
  beforeEach(() => {
    ctx = {
      event: {
        headers: {
          
        }
      },
      logger: console
    }
    plugin = new BodyParserPlugin()
  })
  it ('should noop and not throw with invalid content type', async () => {
    ctx.event.headers['content-type'] = 'some/unknown/type'
    ctx.event.body = "Unknown body type"
    await plugin.request(ctx, noop)
    expect(ctx.event.body).toEqual("Unknown body type")
  })
  it ('should noop for content type that is not supported', async () => {
    ctx.event.headers['content-type'] = 'text/plain'
    ctx.event.body = "Plain text"
    await plugin.request(ctx, noop)
    expect(ctx.event.body).toEqual("Plain text")
  })
}) 


