#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" ]]; then
	printf 'path: %s\n' "${PWD##*/}";
	mkdir build;
	zip -r build/Vocaluxe_Linux__x64_Nightly.zip Output/*;
fi