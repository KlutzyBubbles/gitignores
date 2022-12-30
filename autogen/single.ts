import Requester from './request'
import { logger as loggerCollection, Debugger } from '@klutzybubbles/nodejs-tools'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { remove } from 'winston'
dotenv.config()

const logger = loggerCollection.getCurrentLogger('index');

(async() => {
    var debug = new Debugger()
    debug.level = debug.getLevelFromName('silly')
    debug.linkLogger(logger)

    var username = 'KlutzyBubbles'

    var request = new Requester(debug, undefined, username.toLowerCase())

    var dir = path.join(process.cwd(), username)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    var args = process.argv.slice(2);

    if (args.length < 2) {
        logger.error('Too little arguments')
        return
    }

    var repoName = args[0]
    var language = args[1]
    
    
    try {
        var fileJson: any = await request.publicGet(`/repos/${username}/${repoName}/contents/.gitignore`, process.env.GITHUB_TOKEN)
        if (Object.prototype.hasOwnProperty.call(fileJson, 'message')) {
            // Is not found or error
            logger.info(`${repoName} doesnt have a root gitignore`)
        } else {
            var rawHostname = 'raw.githubusercontent.com'
            var file: any = await Requester.rawRequest('GET', Requester.getPath(fileJson.download_url, debug, rawHostname), {}, debug, process.env.GITHUB_TOKEN, rawHostname, username.toLowerCase())
            
            if (!fs.existsSync(path.join(dir, language))) {
                fs.mkdirSync(path.join(dir, language), { recursive: true })
            }
            fs.writeFileSync(path.join(dir, language, `${repoName}.gitignore`), file)
            logger.info(`Saved for ${repoName}`)
        }
    } catch (e) {
        logger.warn(`Cannot process gitignore for ${repoName} (could not exist also)`)
    }
})()
