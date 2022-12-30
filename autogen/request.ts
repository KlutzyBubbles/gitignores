import * as origHttps from 'https'
import { https } from 'follow-redirects'
import Q from 'q'
import { OutgoingHttpHeaders } from 'http'
import { Debugger } from '@klutzybubbles/nodejs-tools'

interface Keyable {
    [key: string]: any
}

export default class Requester {
    public logger: Debugger
    public hostname: string
    public userAgent: string

    constructor(logger?: Debugger, hostname?: string, userAgent?: string) {
        this.logger = logger ?? new Debugger()
        this.hostname = hostname ?? 'api.github.com'
        this.userAgent = userAgent ?? 'gitignore-autogen'
    }

    static getPath (endpoint: string, logger?: Debugger, hostname = 'api.github.com'): string {
        logger?.silly('getPath')
        if (endpoint.startsWith('https://')) { endpoint = endpoint.split('https://')[1] }
        if (endpoint.startsWith(hostname)) { endpoint = endpoint.split(hostname)[1] }
        return endpoint
    }

    static async rawRequest(
        method: string,
        path: string,
        headers?: OutgoingHttpHeaders,
        logger?: Debugger,
        token?: string,
        hostname = 'api.github.com',
        userAgent = 'gitignore-autogen'): Promise<Keyable[] | Keyable | string> {
        logger?.silly('rawRequest')
        const deferred = Q.defer()
        if (headers === undefined) {
            headers = {}
        }
        if (['PUT', 'POST', 'DELETE'].includes(method.toUpperCase())) {
            headers['Content-Length'] = 0
        }
        if (token !== undefined) {
            logger?.silly(`Authorization with token ${token}`)
            headers['Authorization'] = `token ${token}`
        }
        headers['User-Agent'] = userAgent
        var options: origHttps.RequestOptions = {
            host: hostname,
            path: path,
            port: 443,
            method: method,
            headers: headers,
            rejectUnauthorized: false
        }
        const request = https.request(options, (res) => {
            var body = ''
            res.on('data', (d: string) => {
                body += d
            })
            res.on('end', () => {
                logger?.silly('request end')
                try {
                    var json = JSON.parse(body)
                    logger?.silly('isJsonResult')
                    return deferred.resolve(json)
                } catch {
                    logger?.silly('isTextResult')
                    return deferred.resolve(body)
                }
            })
        })
        request.on('error', (e) => {
            logger?.silly('request error')
            return deferred.reject(e)
        })
        request.end()
        return await (deferred.promise as any as Promise<Keyable | string>)
    }

    public async request(method: string, path: string, token?: string): Promise<Keyable | string> {
        this.logger.silly('request')
        var headers: OutgoingHttpHeaders = {}
        return await Requester.rawRequest(method.toUpperCase(), path, headers, this.logger, token, this.hostname, this.userAgent)
    }

    public async jsonGet(path: string, token?: string): Promise<Keyable | string> {
        this.logger.silly('publicGet')
        return await this.request('GET', path, token)
    }

    public async publicGet(path: string, token?: string): Promise<Keyable | string> {
        this.logger.silly('publicGet')
        return await this.request('GET', path, token)
    }
}