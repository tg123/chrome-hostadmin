rm -rf dist
mkdir dist


cp manifest.json dist
cp background.html popup.html dist
cp hostadmin.js jquery-1.7.1.min.js dist
cp tick-icon.png h.png dist

cp npapi/hostadmin.amd64.so dist
cp npapi/hostadmin.x86.so dist
cp npapi/Release/hostadmin.dll dist

google-chrome --pack-extension=dist --pack-extension-key=chrome-hostadmin.pem
