#!/bin/bash

curr_dir=${pwd}

cd /tmp
wget https://github.com/lukeIam/VocaluxeDependencies/raw/ffmpegLinuxTest/zips/dependencies/ffmpeg20170106.zip
unzip ffmpeg20170106.zip -d /usr
rm -f ffmpeg20170106.zip

cd $curr_dir