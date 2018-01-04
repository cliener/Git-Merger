#!/usr/bin/env node

"use strict";

const { gitMerger, ...packageJSON } = require(process.cwd() + "/package.json");
// Check config has been provided
if (!gitMerger) {
  console.log(`Couldn't find the gitMerger config. Check your package.json.
Documentation: https://github.com/cliener/Git-Merger`);
  return;
}
const config = { ...gitMerger };
const rootFolder = process.cwd();
const isWin = /^win/.test(process.platform);
const { exec } = require("child_process");
const GitHubApi = require("github");

const argv = require("yargs")
  .usage("Usage: $0 --from=[fromBranch] --to=[toBranch]")
  .alias("f", "from")
  .alias("t", "to")
  .nargs("f", 1)
  .describe("f", "Base branch")
  .describe("t", "Destination branch")
  .describe("d", "Debug flag to print out more info.")
  .demandOption(["f", "t"])
  .help("h")
  .alias("h", "help")
  .version().argv;

const isDebug = argv.d;
const fromBranch = argv.from;
const toBranch = argv.to;
let successCount = 0;
const REQUIRED_CHECKS = 3;

const execWithDebug = (...args) => {
  if (isDebug) {
    console.log("Command", args[0]);
  }
  return exec.apply(null, args);
};

const handleCommandLine = (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    console.log("Fail! Oh no!");
    console.log(`stderr: ${stderr}`);
    if (isDebug) {
      console.log(err);
    }
    return false;
  }
  // return the *entire* stdout (buffered) (if anything)
  stdout && console.log(`stdout: ${stdout}`);
  return true;
};

const createExecCallback = ({ onSuccess = () => {} }) => (...args) => {
  const isSuccess = !!handleCommandLine.apply(null, args);
  if (isSuccess) {
    onSuccess();
  }
};

const postFileGenerationsCallback = () => {
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
  //execWithDebug(`git merge --no-ff ${fromBranch}`, handleCommandLine);
};

const logSuccess = msg => {
  console.log(msg);
  successCount++;
  if (successCount === REQUIRED_CHECKS) {
    postFileGenerationsCallback();
  }
};

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
execWithDebug(
  `git log --oneline --format="%h %d %s (%cr) %an <%ae> on %cd" --abbrev-commit --date=relative --no-merges ${
    toBranch
  }..${fromBranch} > changelog.txt`,
  createExecCallback({
    onSuccess: () => logSuccess("Created changelog.txt")
  })
);

// List of people making changes
/* Dragons ahead - or worse exec() uses DOS shell */
execWithDebug(
  `git log --oneline --format='%an --abbrev-commit --date=relative --no-merges ${
    toBranch
  }..${fromBranch} | sort ${isWin ? "" : "-u"} > authors.txt`,
  createExecCallback({
    onSuccess: () => logSuccess("Created authors.txt")
  })
);

// Modified files by commit
execWithDebug(
  `git log --name-only --pretty=short --graph ${toBranch}..${
    fromBranch
  } > files.txt`,
  createExecCallback({
    onSuccess: () => logSuccess("Created files.txt")
  })
);
