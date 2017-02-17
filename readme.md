# Alexandria Browser (React)

This is a simple React version of our application that supports SSR.

# Installation

To install please run the following commands after you have cloned and navigated to the repository.
```bash
$ npm install
```

# Usage

To run the SSR version, run the following command in your terminal window after installing then navigate to `localhost:3000`.
```bash
$ NODE_ENV=production node_modules/.bin/babel-node --presets 'react,es2015' src/server.js
```