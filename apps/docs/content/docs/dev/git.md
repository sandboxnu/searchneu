---
title: Github and Git Etiquette
icon: BookMarked
description: So we never have another quarter million line PR
---

### About

This section provides a brief overview of what is expected when using GitHub and Git with Search to ensure a clean, legible history. Generally speaking, version control should always be the second thing a developer goes to if they have questions about changes in the codebase (the first beingn the codebase itself). Therefore, it's important that all developers learn how to maintain our repositories and manage their own branches/commits responsibly.

### Starting A Ticket

To start a ticket, go to said ticket and assign yourself to it on GitHub. Tickets can be found [here](https://github.com/orgs/sandboxnu/projects/23/views/2) or by going to the projects tab in the SearchNEU repository. From their, create a branch for the ticket (can be done within the ticket itself, GitHub does this automatically) and follow the given instructions to open your branch locally (usually involves fetching and checking out the branch).

### Working On A Ticket

As you develop your ticket, try to commit frequently to prevent any of your hard work from being lost. Ideally, each commit you produce is atomic; i.e, the changes in each commit are standalone. If you end up having another commit for the same change, you can use `git commit --amend -m "new message"` to add your changes to the previous commit (instead of `-m "message"` you can also use the `--no-edit` flag if you don't want to change the commit message). If you forget to do this, though, don't worry! Below, we'll explain how to you can use an interactive rebase to combine/redo commits to make everything PR-ready. What we DON'T want is one giant, mega-commit you label "stuff" and force the poor PR-reviewer to have to go through and parse out. Tbh, we'll probably just kick it back to you and ask you to be more thorough in explaining each of your changes.

### Coming Back To A Ticket

If you're able to complete a ticket in one sitting, great! However, for most of us this is a bit of an ideal. When you do need to step away from a ticket, be sure to commit your latest changes if you're able and push them to your remote branch. Then, when you come back, it's possible that someone else has squashed and merged a PR into main, making the commit you merged off of no longer the latest version. To resolve this, first `git pull` in your local main branch to get up-to-date with the remote. 

Then, __DO NOT MERGE MAIN INTO YOUR BRANCH__. Crazy, I know, but merging can lead to incredibly messy version history that we don't want to see in GitHub; remember, GitHub history in of itself is a form of documentation, and should be kept as clean as possible. Instead, call `git rebase main` while in your branch. This, in a nutshell, moves your branch to the latest commit in main without the need for a merge commit; it quite literally rewrites history, moving commits around to keep everything as linear (and clean!) as possible


### Finishing Up A Ticket

Huzzah! You finally finished the brutal ticket that's taken a small piece of your sanity with it. To ensure your ticket is PR-ready, there's a couple of things you need to do. First, make sure that you update the documentation page to include (if necessary) the changes you made in your ticket. Then, make sure your branch is up-to-date with main (as explained earlier) and ensure that each one of your changes is an individual, atomic commit with a GOOD (not "stuff", or "fix", or "work") commit message that in a single sentence encapsulates what the change is. The best way to do this, if you haven't already with `git commit --amend`, is with `git rebase -i main`. This will both make your branch up-to-date with main, and enable you to go through and edit each of your commits.

`git rebase -i` is an insanely powerful tool; the -i flag is to make your rebase session interactive, enabling you to have full control over how you want your commits to look. To keep the docs a bit shorter, and to ensure you have access to the best information, please review [this](https://hackernoon.com/beginners-guide-to-interactive-rebasing-346a3f9c3a6d) guide on how to perform interactive rebasing. 

Okay; now that everything is ready, push your changes and put up a PR. When writing a PR message, please keep it precise AND concise; it should be like a little synopsis for your code. And BOOM! You're all done! Move your ticket to the "in review" column and ping your reviewers that the PR is up. 