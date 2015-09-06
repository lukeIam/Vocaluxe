#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" && "$TRAVIS_BRANCH" = "travisTest" ]]; then
	eval "$(ssh-agent -s)";
	chmod 600 .travis/travisKey;
	ssh-add .travis/travisKey;
	git config --global user.email "builds@travis-ci.com";
	git config --global user.name "Travis CI";
	export GIT_TAG=Nightly;
	git tag "$GIT_TAG" -f -a -m "Latest Vocaluxe nightly build (Generated by Travis CI on $(date +"%Y-%m-%d_%H-%M-%S"))";
	git push -q -f git@github.com:lukeIam/Vocaluxe.git Nightly;
fi