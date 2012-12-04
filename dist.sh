VER=`grep '"version".*:.*".*"' manifest.json -P -o | sed -e 's/["| ]//g' | cut -d : -f 2`
TARGET=chrome-hostadmin-$VER.zip

rm -f $TARGET
zip $TARGET hostadmin.plugin/ CodeMirror/ bootstrap/ *.js *.html *.so *.dll *.json *.png -r

echo $TARGET "DONE"
