/**
 * there is probably a better way to do this, but this works and has little
 *   friction.  The ideal way would involve using github packages, entercom
 *   hosting its own internal package registry, or finding whoever started the
 *   @entercom organization within npm so we could publish scoped packages.
 */

import _ from 'lodash'
import { exec as execp } from 'child-process-promise'
import { promises as fsp, readFileSync } from 'fs'
// use del.sync
// https://github.com/sindresorhus/del/issues/68
import { sync as delSync } from 'del'
import cpy from 'cpy'
import gitIsClean from 'git-is-clean'
import os from 'os'
import path from 'path'
import pjson from '../package.json'
import pLockJson from '../package-lock.json'


const log = (...args) => console.log(...args), // eslint-disable-line no-console
  logErr = (...args) => console.error(...args), // eslint-disable-line no-console
  rootDir = path.resolve(__dirname, '..'),
  nvmrcVersion = readFileSync(path.resolve(rootDir, '.nvmrc'), 'utf8')
    .trim()

if (process.version !== nvmrcVersion) {
  exitWith(
    `the node version in use '${process.version}' does not match what's in`
    + `.nvmrc (${nvmrcVersion}).  Please run 'nvm install && nvm use' to switch`
    + ' to that version.'
  )
}

if (pjson.version !== pLockJson.version) {
  exitWith(
    'your package.json and package-lock.json versions must be the same',
    `  package.json:      ${pjson.version}`,
    `  package-lock.json: ${pLockJson.version}`
  )
}

if (!pjson.version.includes('+')) {
  exitWith(
    "your package.json version must include a '+' which we use by convention to"
    + ' differentiate the unity version and the vanilla clay version'
  )
}

const npmFiles = ['package.json', 'README.md', 'LICENSE'],
  publishedFiles = pjson.files.concat(npmFiles),
  tmpDirRoot = os.tmpdir() + path.sep,
  vVersion = `v${pjson.version}`

run()

async function run() {
  try {
    let tags = (await execp('git fetch entercom --tags && git tag')).stdout

    tags = tags.split('\n')
      .filter(_.identity)
      .map(_.trim)

    if (tags.includes(vVersion)) {
      exitWith(
        `the tag '${vVersion}' already exists.  If it was published in error`
        + ' then you will have to delete the tag locally and remotely before'
        + ' publishing again.  Otherwise you will need to bump the'
        + ' package*.json versions and re-publish'
      )
    }

    if (!await gitIsClean()) {
      exitWith(
        "it looks like your git repository isn't clean per 'git-is-clean'."
        + "  This check exists to make sure you don't accidentally publish"
        + " without having committed any changes."
      )
    }

    await usingTmpDirs(async ([buildDir, publishDir]) => {
      log('copying clay-kiln to temp directories')

      await Promise.all([
        copyRootDirTo(buildDir),
        copyRootDirTo(publishDir)
      ])

      log('npm ci')
      await execp('npm ci', { cwd: buildDir })

      log('npm run prepublishOnly')
      await execp('npm run prepublishOnly', { cwd: buildDir })

      log("deleting all files which shouldn't be published")
      delSync(
        ['**'].concat(publishedFiles.map(prepend('!'))),
        { cwd: buildDir, dot: true }
      )

      log('tagging the version and pushing to the remote')
      await execp(
        `git checkout master-unity-publish && git pull`,
        { cwd: publishDir }
      )

      log('deleting all files in publishDir')
      delSync(['**', '!.git'], { cwd: publishDir, dot: true })

      log('copying files from buildDir to publishDir')
      await cpy('**', publishDir, { cwd: buildDir,  dot: true, parents: true })

      log('commiting, tagging and pushing changes')
      await execp(
        `git add . && git commit --no-verify -m '${vVersion}' && git push`,
        { cwd: publishDir }
      )
      await execp(
        `git tag '${vVersion}' && git push entercom '${vVersion}'`,
        { cwd: publishDir }
      )

      log(
        `master-unity-publish has been updated with ${vVersion} and the`
        + ' tag has been created'
      )
    })
  } catch (err) {
    logErr(err)
  }
}

function prepend(left) {
  return right => left + right
}

function copyRootDirTo(dir) {
  return cpy(
    ['**', '!node_modules'],
    `${dir}`,
    {
      cwd: rootDir,
      dot: true,
      parents: true
    }
  )
}

async function usingTmpDirs(cb) {
  let tmpDirs

  try {
    tmpDirs = [
      await fsp.mkdtemp(tmpDirRoot),
      await fsp.mkdtemp(tmpDirRoot)
    ]

    await cb(tmpDirs)
  } finally {
    log('tmpDirs: ' + JSON.stringify(tmpDirs, null, 2))
    // if (tmpDirs) {
    //   await del(tmpDirs)
    // }
  }
}

function exitWith(msg) {
  logErr(msg) // eslint-disable
  process.exit(1)
}
