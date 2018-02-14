#!/bin/bash

#https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu

curr_dir=${pwd}

apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
echo "deb http://download.mono-project.com/repo/ubuntu stable-trusty main" | tee /etc/apt/sources.list.d/mono-official-stable.list
apt-get update

apt-get -y install autoconf automake build-essential libass-dev libfreetype6-dev \
  libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev libxcb1-dev libxcb-shm0-dev \
  libxcb-xfixes0-dev pkg-config texinfo zlib1g-dev mono-complete

mkdir ~/ffmpeg_sources

#Download and install nasm 2.13
wget http://www.nasm.us/pub/nasm/releasebuilds/2.13.01/nasm-2.13.01.tar.xz
tar -xvf nasm-2.13.01.tar.xz
cd nasm-2.13.01
./configure
make
make install

cd ~/ffmpeg_sources
wget http://www.tortall.net/projects/yasm/releases/yasm-1.3.0.tar.gz
tar xzf yasm-1.3.0.tar.gz
cd yasm-1.3.0
./configure --prefix="/usr" --bindir="$HOME/bin"
make
make install
make distclean

cd ~/ffmpeg_sources
wget http://download.videolan.org/pub/x264/snapshots/x264-snapshot-20170106-2245.tar.bz2
tar xjf x264-snapshot*.tar.bz2
cd x264-snapshot*
PATH="$HOME/bin:$PATH" ./configure --prefix="/usr" --bindir="$HOME/bin" --enable-static --disable-opencl --enable-shared
PATH="$HOME/bin:$PATH" make
make install
make distclean

cd ~/ffmpeg_sources
wget -O fdk-aac.tar.gz https://github.com/mstorsjo/fdk-aac/tarball/master
tar xzf fdk-aac.tar.gz
cd mstorsjo-fdk-aac*
autoreconf -fiv
./configure --prefix="/usr" --enable-shared
make
make install
make distclean

cd ~/ffmpeg_sources
wget http://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz
tar xzf lame-3.99.5.tar.gz
cd lame-3.99.5
./configure --prefix="/usr" --enable-nasm --enable-shared
make
make install
make distclean

cd ~/ffmpeg_sources
wget http://downloads.xiph.org/releases/opus/opus-1.1.2.tar.gz
tar xzf opus-1.1.2.tar.gz
cd opus-1.1.2
./configure --prefix="/usr" --enable-shared
make
make install
make clean

cd ~/ffmpeg_sources
wget http://storage.googleapis.com/downloads.webmproject.org/releases/webm/libvpx-1.5.0.tar.bz2
tar xjf libvpx-1.5.0.tar.bz2
cd libvpx-1.5.0
PATH="$HOME/bin:$PATH" ./configure --prefix="/usr" --disable-examples --disable-unit-tests --enable-shared
PATH="$HOME/bin:$PATH" make
make install
make clean

wget http://johnvansickle.com/ffmpeg/release-source/libass-git.tar.xz
tar xfv libass-git.tar.xz
cd libass-git
libtoolize --force
aclocal
autoheader
automake --force-missing --add-missing
autoconf
PATH="$HOME/bin:$PATH" PKG_CONFIG_PATH="/usr/lib/pkgconfig" ./configure --prefix="/usr" --enable-shared --enable-static
make
make install
cd -

wget -O fdk-aac.tar.gz https://github.com/mstorsjo/fdk-aac/tarball/master
tar xzvf fdk-aac.tar.gz
cd mstorsjo-fdk-aac*
autoreconf -fiv
./configure --prefix="/usr" --enable-shared
make
make install
cd -

cd ~/ffmpeg_sources
wget http://ffmpeg.org/releases/ffmpeg-3.2.9.tar.bz2
tar xjf ffmpeg-3.2.9.tar.bz2
cd ffmpeg-3.2.9
PATH="$HOME/bin:$PATH" PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/lib/x86_64-linux-gnu/pkgconfig" ./configure \
  --cc=gcc \
  --prefix="/usr" \
  --pkg-config-flags="--static" \
  --extra-cflags="-I/usr/include" \
  --extra-ldflags="-L/usr/lib" \
  --bindir="$HOME/bin" \
  --enable-shared \
  --enable-gpl \
  --enable-libass \
  --enable-libfdk-aac \
  --enable-libfreetype \
  --enable-libmp3lame \
  --enable-libopus \
  --enable-libtheora \
  --enable-libvorbis \
  --enable-libvpx \
  --enable-libx264 \
  --enable-version3 \
  --enable-nonfree
PATH="$HOME/bin:$PATH" make
make install
make distclean
hash -r

cd $curr_dir
