#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" && "$TRAVIS_BRANCH" = "travisTest" ]]; then
	eval "$(ssh-agent -s)";
	chmod 600 .travis/travisKey;
	ssh-add .travis/travisKey;
	git config --global user.email "builds@travis-ci.com";
	git config --global user.name "Travis CI";
	export GIT_TAG=Nightly;
	git tag "$GIT_TAG" -a -m "Generated tag from TravisCI for the latest nightly build";
	git push -q -f https://github.com/lukeIam/Vocaluxe Nightly;
fi