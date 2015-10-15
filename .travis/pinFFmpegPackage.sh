#!/bin/bash
set -ev

sudo mkdir -p /etc/apt/preferences.d/ 
sudo touch /etc/apt/preferences.d/ffmpeg
sudo bash -c 'echo "Package: ffmpeg" >> /etc/apt/preferences.d/ffmpeg'
sudo bash -c 'echo "Pin: origin ppa.launchpad.net" >> /etc/apt/preferences.d/ffmpeg'
sudo bash -c 'echo "Pin-Priority: 1000" >> /etc/apt/preferences.d/ffmpeg'
sudo bash -c 'echo "" >> /etc/apt/preferences.d/ffmpeg'