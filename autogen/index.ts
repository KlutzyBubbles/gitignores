import Requester from './request'
import { logger as loggerCollection, Debugger } from '@klutzybubbles/nodejs-tools'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { remove } from 'winston'
dotenv.config()

const logger = loggerCollection.getCurrentLogger('index');

interface Repository {
    id: number,
    node_id: string,
    name: string,
    full_name: string,
    private: boolean,
    owner: {
      login: string,
      id: number,
      node_id: string,
      avatar_url: string,
      gravatar_id: string,
      url: string,
      html_url: string,
      followers_url: string,
      following_url: string,
      gists_url: string,
      starred_url: string,
      subscriptions_url: string,
      organizations_url: string,
      repos_url: string,
      events_url: string,
      received_events_url: string,
      type: string,
      site_admin: boolean
    },
    html_url: string,
    description: string,
    fork: boolean,
    url: string,
    forks_url: string,
    keys_url: string,
    collaborators_url: string,
    teams_url: string,
    hooks_url: string,
    issue_events_url: string,
    events_url: string,
    assignees_url: string,
    branches_url: string,
    tags_url: string,
    blobs_url: string,
    git_tags_url: string,
    git_refs_url: string,
    trees_url: string,
    statuses_url: string,
    languages_url: string,
    stargazers_url: string,
    contributors_url: string,
    subscribers_url: string,
    subscription_url: string,
    commits_url: string,
    git_commits_url: string,
    comments_url: string,
    issue_comment_url: string,
    contents_url: string,
    compare_url: string,
    merges_url: string,
    archive_url: string,
    downloads_url: string,
    issues_url: string,
    pulls_url: string,
    milestones_url: string,
    notifications_url: string,
    labels_url: string,
    releases_url: string,
    deployments_url: string,
    created_at: string,
    updated_at: string,
    pushed_at: string,
    git_url: string,
    ssh_url: string,
    clone_url: string,
    svn_url: string,
    homepage: null,
    size: number,
    stargazers_count: number,
    watchers_count: number,
    language: string,
    has_issues: boolean,
    has_projects: boolean,
    has_downloads: boolean,
    has_wiki: boolean,
    has_pages: boolean,
    has_discussions: boolean,
    forks_count: number,
    mirror_url: null,
    archived: boolean,
    disabled: boolean,
    open_issues_count: number,
    license: {
      key: string,
      name: string,
      spdx_id: string,
      url: string,
      node_id: string
    },
    allow_forking: boolean,
    is_template: boolean,
    web_commit_signoff_required: boolean,
    topics: string[],
    visibility: string,
    forks: number,
    open_issues: number,
    watchers: number,
    default_branch: string
  }
/*
TODO LIST

Get sub folders
Combine types

*/

(async() => {
    var debug = new Debugger()
    debug.level = debug.getLevelFromName('silly')
    debug.linkLogger(logger)

    // debug.silly('silly log')
    // debug.debug('debug log')
    // debug.info('info log')
    // debug.warn('warn log')
    // debug.error('error log')
    // debug.fatal('fatal log')
    // return

    var username = 'KlutzyBubbles'

    var request = new Requester(debug, undefined, username.toLowerCase())

    var dir = path.join(process.cwd(), username)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    
    var args = process.argv.slice(2);

    var clearDir = args.length > 0 ? args[0] : undefined

    if (clearDir) {
        logger.debug('clearDir flag on')
        removeAllFromDir(dir)
    }

    var repos: any = await request.publicGet(`/users/${username}/repos`, process.env.GITHUB_TOKEN)

    //logger.info(typeof repos)
    //logger.inf (repos)

    for (var repo of repos as Repository[]) {
        try {
            var fileJson: any = await request.publicGet(`/repos/${username}/${repo.name}/contents/.gitignore`, process.env.GITHUB_TOKEN)
            if (Object.prototype.hasOwnProperty.call(fileJson, 'message')) {
                // Is not found or error
                logger.info(`${repo.name} doesnt have a root gitignore`)
            } else {
                var rawHostname = 'raw.githubusercontent.com'
                var file: any = await Requester.rawRequest('GET', Requester.getPath(fileJson.download_url, debug, rawHostname), {}, debug, process.env.GITHUB_TOKEN, rawHostname, username.toLowerCase())
                
                if (!fs.existsSync(path.join(dir, repo.language))) {
                    fs.mkdirSync(path.join(dir, repo.language), { recursive: true })
                }
                fs.writeFileSync(path.join(dir, repo.language, `${repo.name}.gitignore`), file)
                logger.info(`Saved for ${repo.name}`)
            }
        } catch (e) {
            logger.warn(`Cannot process gitignore for ${repo.name} (could not exist also)`)
        }
    }
    // logger.silly(repos)
    // console.log(repos)
})()

async function removeAllFromDir(dir: string) {
    fs.readdir(dir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                removeAllFromDir(path.join(dir, file))
            } else {
                fs.unlink(path.join(dir, file), (err) => {
                    if (err) throw err;
                });
            }
        }
    });
}