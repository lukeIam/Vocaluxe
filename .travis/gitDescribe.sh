#!/bin/bash
set -ev

my_dir="$(dirname "$0")";

if [[ "${TRAVIS_PULL_REQUEST}" = "false" ]]; then
	export VersionTag=$(mono "$my_dir/githubDescribe.exe" "Vocaluxe" "Vocaluxe" "$TRAVIS_COMMIT" "$GITHUB_KEY");
else
    export VersionTag="0.0.0-na-PR_$TRAVIS_PULL_REQUEST_SHA"
fi

echo $VersionTag