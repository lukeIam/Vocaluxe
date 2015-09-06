#!/bin/bash
set -ev
if [[ "${TRAVIS_PULL_REQUEST}" = "false" ]]; then
	mkdir build;
	zip -r "build/Vocaluxe_$config_$platform_Nightly.zip" Output/*;
	ls -l .;
	ls -l build;
fi