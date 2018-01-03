# Git-Merger

[![npm version](https://badge.fury.io/js/%40cliener%2Fgit-merger.svg)](https://badge.fury.io/js/%40cliener%2Fgit-merger)

Automates creation of diff changelog, authors and files in preparation for a
merge.

## Installation

```
$ npm i -g @cliener/git-merger
```

## Configuration

Add the repo details to your package.json:

```
  "gitMerger": {
    "owner": "cliener",
    "repo": "Git-Merger"
  }
```

## Usage

```
git-merger --from=master --to=newBranch
```

## Help

```
git-merger -h
```

## Wish list

* Automatically create merge branch.
* Initiate merge.
* If no conflicts, create a PR with authors as reviewers.
* If there are conflicts, initiate manual conflict resolution.
