#!/usr/bin/env node

"use strict";

const packageJson = require(process.cwd() + "/package.json");

// Check config has been provided
if (!packageJson.gitMerger) {
  console.log(`Couldn't find the gitMerger config. Check your package.json.
Documentation: https://github.com/cliener/Git-Merger`);
  return;
}

const config = packageJson.gitMerger;
const { exec } = require("child_process");
const GitHubApi = require("github");

const handleCommandLine = (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    console.log("Fail! Oh no!");
    console.log(`stderr: ${stderr}`);
    return;
  }
  // the *entire* stdout (buffered)
  console.log(`stdout: ${stdout}`);
};

const fromBranch = process.argv[2];
const toBranch = process.argv[3];

// If params are provided, manual time
if (!fromBranch || !toBranch) {
  console.log("Usage: node gitMerge fromBranch toBranch");
  return;
}

console.log("Connecting to GitHub…");
const github = new GitHubApi({
  host: "api.github.com",
  protocol: "https",
  rejectUnauthorized: false,
  debug: true
});

console.log("Connected");

console.log(`Merging from ${fromBranch} to ${toBranch}`);

// Create Changelog
exec(
  `git log --oneline --format='%h %d %s (%cr) %an <%ae> on %cd' --abbrev-commit --date=relative --no-merges ${
    toBranch
  } ..${fromBranch} > changelog.txt`,
  handleCommandLine
);
console.log("Created changelog.txt");

// List of people making changes
exec(
  `git log --oneline --format='%an' --abbrev-commit --date=relative --no-merges ${
    toBranch
  }..${fromBranch} | sort -u > authors.txt`,
  handleCommandLine
);
console.log("Created authors.txt");

// Modified files by commit
exec(
  `git log --name-only --pretty=short --graph ${toBranch}..${
    fromBranch
  } > files.txt`,
  handleCommandLine
);
console.log("Created files.txt");

console.log(
  "1. Check the list of authors in authors.txt and plan a merge with everyone present. Add each of them as reviewers."
);

console.log(`2. Create branch Chores/Merge_${fromBranch}_to_${toBranch}`);

/*
// Attempt to create a branch via the GitHub API
// Paused because the API is unfriendly and documentation unhelpful
// Meanwhile: https://stackoverflow.com/questions/9506181/github-api-create-branch
// Need authentication happening before this can go too far
github.repos.getBranch({
  owner: config.owner,
  repo: config.repo,
  branch: fromBranch,
})
.catch(err => {
  console.log(`Failed to get branch ${fromBranch}. API returned ${err.message}`)
})
.then(({branch: data}) => {
  console.log("Branch retrieved");

  github.gitdata.createReference({
    owner: config.owner,
    repo: config.repo,
    ref: `refs/heads/Chores/Merge_${fromBranch}_to_${toBranch}`,
    sha: branch.commit.sha
  })
  .catch(err =>
    console.log(`Failed to create new branch. API returned ${err.message}`))
  .then(
    console.log("Created branch")
  );
})*/

console.log("3. Initialise merge:");
console.log(`git merge --no-ff ${fromBranch}`);
//exec(`git merge --no-ff ${fromBranch}`, handleCommandLine);
