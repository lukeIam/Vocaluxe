#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" ]]; then
	mkdir build;
	zip -r build/Vocaluxe_Linux_x64_Nightly.zip Output/*;
fi