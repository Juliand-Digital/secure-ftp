import * as tls from 'tls'
import * as net from 'net'
import { FTPSOptions } from '../interfaces'
import { Duplex } from 'stream'

const debug = Boolean(process.env.DEBUG)

// We are logging for debug purposes
// tslint:disable:no-console
abstract class TransferHandler {
    private static getUnSecureSocket(options: { host: string; port: number }): Duplex {
        return net.createConnection(options)
    }

    public socket: Duplex
    public message: string
    protected options: FTPSOptions

    private readonly secure: boolean

    protected constructor(secure: boolean, options: FTPSOptions) {
        this.secure = secure
        this.options = options
    }

    public getSocket(message: string): Duplex {
        const options = this.parse(message)
        const socket = this.secure ? this.getSecureSocket(options) : TransferHandler.getUnSecureSocket(options)

        socket.setEncoding('utf8')
        socket.pause()
        this.socket = socket

        return socket
    }

    public getData(message: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const socket = this.getSocket(message)

            let data = ''

            socket.on('data', (part: string) => {
                data += part
            })

            socket.on('close', () => {
                if (debug) console.log('[RECEIVED DATA]', data)
                resolve(data)
            })
            socket.on('error', reject)

            socket.resume()
        })
    }

    protected abstract parse(message: string): { host: string; port: number }

    protected getSecureSocket(options: { host: string; port: number; rejectUnauthorized?: boolean }): Duplex {
        options.rejectUnauthorized = this.options.tls.rejectUnauthorized
        return tls.connect(options)
    }
}

export default TransferHandler
