#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" ]]; then
	mkdir build;
    cd Output;
	zip -r "../build/Vocaluxe_$GIT_TAG_$config_$platform.zip" *;
    cd ..;
fi