#/bin/bash

VER=`grep '"version".*:.*".*"' manifest.json -P -o | sed -e 's/["| ]//g' | cut -d : -f 2`
TARGET=chrome-hostadmin-$VER

CHROME_PROVIDERS="container/chrome/ core/ icons/ npapi/"

# clean
rm -f $TARGET.zip
rm -f $TARGET.crx


# build for store
zip -r $TARGET.zip $CHROME_PROVIDERS manifest.json -x 'npapi/src/*' '**/.*'

echo $TARGET.zip "DONE"

if [ "$1" != "crx" ];then
	exit
fi

# build crx useless ....
TMP=`mktemp -d`
PLUGINDIR="$TMP/plugin"
mkdir -p $PLUGINDIR

unzip -d $PLUGINDIR/$TARGET $TARGET.zip

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -e "$CHROME" ]
then
	CHROME='google-chrome' # ubuntu
fi

"$CHROME" --pack-extension=$PLUGINDIR/$TARGET

cp $PLUGINDIR/$TARGET.crx .

echo $TARGET.crx "DONE"
