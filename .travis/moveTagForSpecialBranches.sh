#!/bin/bash
set -ev

export GIT_TAG="$TRAVIS_TAG";

if [[ "${TRAVIS_PULL_REQUEST}" = "false" && -z "$TRAVIS_TAG" ]]; then	
	if [[ "$TRAVIS_BRANCH" = "travis" ]]; then	
		export GIT_TAG="Nightly";
	else		
		exit 0;
	fi
	git config --global user.email "build@vocaluxe.de";
	git config --global user.name "Vocaluxe_Automatic_Build";
	git tag "$GIT_TAG" -f;	
	git push -q -f "https://$GITHUB_KEY:x-oauth-basic@github.com/lukeIam/Vocaluxe.git" "$GIT_TAG";
fi