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
