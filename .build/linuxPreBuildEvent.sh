#!/bin/bash
PROJECT=$1
cd $PROJECT
arch=$2
if [ -z "$VersionTag" ]; then
    version=$(git describe --long)
else
    version=$VersionTag
fi
shortVersion=${version%%-*}
shortVersionClean=$(echo $shortVersion | sed -e 's/alpha/0/' -e 's/beta/1/' -e 's/rc/2/' -e 's/[[:alpha:]]//g')

case ${shortVersion##*.} in
alpha*)
    releaseType='Alpha'
    ;;
beta*)
    releaseType='Beta'
    ;;
rc*)
    releaseType='RC'
    ;;
*)
    releaseType='Release'
    ;;
esac

versionName=$(grep -oP "\"${shortVersionClean%.*}.\" *: *\"\K([^\"]+)(?=\")" ../.build/versionNames.json)
fullVersionName="Vocaluxe $([ "$versionName" == "" ] && echo "" || echo "'$versionName' ")$shortVersion ($arch) $([ "$releaseType" == "Release" ] && echo "" || echo "$releaseType ")($version)"

sed -i -e s/GITVERSION/"$version"/ $PROJECT/Properties/AssemblyInfo.cs
sed -i -e s/SHORTVERSION/"$shortVersionClean"/ $PROJECT/Properties/AssemblyInfo.cs
sed -i -e s/FULLVERSION/"$fullVersionName"/ $PROJECT/Properties/AssemblyInfo.cs
