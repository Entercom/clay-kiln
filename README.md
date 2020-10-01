# Kiln

<img src="http://i.imgur.com/RleQNNh.png?1" alt="illustration of a kiln" style="float: left;width: 150px;padding-right: 20px;" />

🔥 Editing tools for Clay 🔥

## Notes for Unity

### Versioning

This package is non-compliant with semver since I think it will be helpful to
label which version of vanilla clay-kiln our unity version was based off of.
This relies on unity only ever pinning versions which works for our use-case.
So the version format then is\
{vanilla clay-kiln version}+{unity version}\
e.g.\
8.16.1+1\

every time a change is introduced to the branch `master-unity`, the unity
version should bump

### publishing

The process for publishing a new version is to

1. merge all changes into the branch `master-unity` which are intended to go
   into the new version
2. create a new commit in the branch 'master-unity' where you bump
   the {unity version} in both package.json and package-lock.json
3. run `node -r esm scripts/unity-publish`
   - I also exposed this via `npm run unity-publish` but I suggest you run it
     directly to avoid all the npm error noise in case anything goes wrong.
   - Be aware this script assumes a remote named `entercom` exists in your repo
     and that you have access to push to it.
   - If you have any questions about this script or it doesn't work to your
     expectations, please let me (Phil) know.

## Below is the rest of the vanilla clay-kiln readme

[![CircleCI](https://circleci.com/gh/clay/clay-kiln.svg?style=svg)](https://circleci.com/gh/clay/clay-kiln) [![Coverage Status](https://coveralls.io/repos/nymag/clay-kiln/badge.svg?branch=master&service=github&t=C3xeVy)](https://coveralls.io/github/nymag/clay-kiln?branch=master)

Powering [New York Magazine](http://nymag.com/), [Vulture](http://www.vulture.com/), [The Cut](http://www,thecut.com/), [Grub Street](http://www.grubstreet.com/).
Created by New York Media.

## Installation

```
npm install --save clay-kiln
```

Kiln comes with compiled scripts and styles, most of which will be automatically inlined by the template.

The logged-in scripts must be copied (from `dist/clay-kiln-edit.js` and `dist/clay-kiln-view.js`) into your publicly-served assets directory, as they'll be linked by `<script src="[site assetPath]/js/clay-kiln-edit.js">` and `<script src="[site assetPath]/js/clay-kiln-view.js">`.

This allows your end users' browsers to cache the (fairly weighty) Kiln application code, speeding up page loads across your sites.

## Usage

As Kiln itself is a component, it must be included in your layouts and have some data, e.g. `allow: true` (a convention we use for components that don't otherwise have data in them). Add an instance of Kiln to your bootstraps:

```yaml
components:
  clay-kiln:
    instances:
      general:
        allow: true
```

Then create a _non-editable_ component list in your layout (preferably near the end), and add a reference to your Kiln instance:

```yaml
components:
  layout:
    instances:
      article:
        kilnInternals:
          -
            _ref: /_components/clay-kiln/instances/general
```

Make sure you add that component list to your layout template, and double check that it isn't editable:

```handlebars
<div class="kiln-internals">{{ > component-list kilnInternals }}</div>
```
