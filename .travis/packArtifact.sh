#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" ]]; then
	mkdir build;
	zip -r "build/Vocaluxe_$GIT_TAG_$config_$platform.zip" Output/*;
	ls -l .;
	ls -l build;
fi