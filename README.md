# Deploy locally.

cd server

./run.sh

# Deploy to Firebase

firebase login

firebase use --add

firebase init
- Hosting: Configure and deploy Firebase Hosting sites
- Use an existing project
- Select a default Firebase project for this directory: guitar-a
- What do you want to use as your public directory? : public
- Configure as a single-page app (rewrite all urls to /index.html)?: y
- File public/index.html already exists. Overwrite?: n

firebase serve

firebase deploy

go to https://guitar-a.web.app

# Upgrade Firebase CLI

curl -sL firebase.tools | upgrade=true bash

# Automate GitHub to Firebase

https://firebase.google.com/docs/hosting/github-integration

firebase init hosting:github
- For which GitHub repository would you like to set up a GitHub workflow? (format: user/repository) self-ed/guitar
- Set up the workflow to run a build script before every deploy? (y/N): n
- Set up automatic deployment to your site's live channel when a PR is merged?: y
- What is the name of the GitHub branch associated with your site's live channel? (master): master