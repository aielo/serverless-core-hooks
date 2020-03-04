#!/usr/bin/env sh

set -e

# Only provision once
MARKER="/usr/local/etc/vagrant_provision"
if [ -f $MARKER ]; then
  exit 0
fi

# APT dependencies
apt-get update -y
apt-get install git vim curl wget tree -y

# Workaround to avoid symlink issues on Windows hosts
MODULES_DIR="/home/vagrant/serverless-core-hooks/node_modules"
su - vagrant << WINHOSTFIX
printf '\nexport NODE_PATH="\$NODE_PATH:$MODULES_DIR"' >> ~/.bashrc
printf '\nexport PATH="\$PATH:$MODULES_DIR/.bin"\n' >> ~/.bashrc
echo '--*.modules-folder "$MODULES_DIR"' >> /vagrant/.yarnrc
WINHOSTFIX

# VS Code settings (only if they do not exist; no replacement)
VSCODE_DIR="/vagrant/.vscode"
su - vagrant << VSCODE
  [ ! -d $VSCODE_DIR ] && cp -r /vagrant/resources$VSCODE_DIR $VSCODE_DIR
VSCODE

# Node.js and (npm) dependencies
su - vagrant << NODE
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
source ~/.nvm/nvm.sh
nvm install v12.16.0
npm install np yarn -g
cd /vagrant; yarn install
NODE

# Misc
su - vagrant << MISC
git config --global credential.helper 'cache --timeout=604800'
echo 'cd /vagrant' >> ~/.bashrc
MISC

# Creates the marker file so we don't provision again
echo Provisioned at $("date") >> $MARKER
