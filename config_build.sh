#!/bin/bash

# Build config for the build script, build.sh. Look there for more info.

APP_NAME=hostadmin
CHROME_PROVIDERS="chrome/content chrome/locale chrome/skin"
CLEAN_UP=1
ROOT_DIRS="defaults/ modules/"
BEFORE_BUILD=
AFTER_BUILD="mv hostadmin.xpi hostadmin-`grep '<em:version>\(.*\)<\/em:version>' install.rdf  |grep '(\d+\.?)+' -Po`.xpi"
