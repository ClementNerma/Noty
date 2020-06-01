#!/bin/bash

# Choose a temporary directory
TMPDIR="/tmp/ace-update-$(date +%s%N).tmp"

# Make the script exit on error
set -oeE pipefail
trap "printf '\nerror: Script failed: see failed command above.\n' && _trap" ERR

# Handle errors
function _trap() {
    if [ ! -z "$TMPDIR" ]; then
        echo Cleaning up temporary directory...
        rm -rf "$TMPDIR"
        echo Done.
    fi
}

# Show current step
function _step() {
	CURRENT_STEP=$((CURRENT_STEP + 1))
	echo -e "\e[92m>>> Step ${CURRENT_STEP}/${TOTAL_STEPS}: $*\e[0m"
}

# Fail
function _fail() {
    echo -e "\e[91m$*\e[0m"
    exit 1
}

# Get the total number of steps
REALPATH=$(realpath "$0")
TOTAL_STEPS=$(grep -c "^[\s\t]*_step" "$REALPATH")
CURRENT_STEP=0

# Beginning of the tool!
echo
echo -e "\e[92m=================================\e[0m"
echo -e "\e[92m======= ACE.JS DOWNLOADER =======\e[0m"
echo -e "\e[92m=================================\e[0m"

_step "Checking if required tools are installed..."

[ ! -x /bin/cat ] && _fail "Command 'cat' was not found in '/bin/cat'"
[ ! -x /bin/ls ] && _fail "Command 'ls' was not found in '/bin/ls'"
[ ! -x /bin/sed ] && _fail "Command 'sed' was not found in '/bin/sed'"
[ ! -x /bin/rm ] && _fail "Command 'rm' was not found in '/bin/rm'"
[ ! -x /usr/bin/curl ] && _fail "Command 'curl' was not found in '/usr/bin/curl'"
[ ! -x /usr/bin/node ] && _fail "Command 'node' (Node.js) was not found in '/usr/bin/node'"

_step "Ensuring target directory exists..."

if [ -z "$1" ] || [ -z "$2" ]; then
    _fail "Please a destination directory for both Ace.js typings and the generated bundle.\n\
           Usage: ace-update.bash <typings-dir> <bundle-dir>"
fi

if [ ! -d "$1" ]; then
    _fail "Provided path '$1' is not a directory."
fi

if [ ! -d "$2" ]; then
    _fail "Provided path '$2' is not a directory."
fi

_step "Creating a temporary directory..."
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"

_step "Fetching TypeScript declaration file..."
curl "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/ace/index.d.ts" -o "$1/ace-bundle.d.ts"

_step "Downloading latest Ace.js build..."
DWPATH="$TMPDIR/ace-builds-master.tar.gz"
curl -L "https://github.com/ajaxorg/ace-builds/archive/master.tar.gz" -o "$DWPATH"

_step "Extracting downloaded archive..."
EXTRACTPATH="$TMPDIR/ace-builds-master"
mkdir "$EXTRACTPATH"
tar -x -f "$DWPATH" -C "$EXTRACTPATH" "ace-builds-master/src-min-noconflict"

_step "Creating bundle: adding core library"
EXTRACTEDPATH="$EXTRACTPATH/ace-builds-master"
SRCDIR="$EXTRACTEDPATH/src-min-noconflict"
BUNDLEPATH="$2/ace-bundle.min.js"
cat "$SRCDIR/ace.js" > "$BUNDLEPATH"

_step "Creating bundle: adding custom One Dark theme..."
(cat << END
ace.define('ace/theme/one_dark', ['require', 'exports', 'module', 'ace/lib/dom'], function (e, t, n) {
  ;(t.isDark = !0), (t.cssClass = 'ace-one-dark')
  t.cssText =
    '.ace-one-dark .ace_gutter{background:#282c34;color:#6a6f7a}.ace-one-dark .ace_print-margin{width:1px;background:#e8e8e8}.ace-one-dark{background-color:#282c34;color:#abb2bf}.ace-one-dark .ace_cursor{color:#528bff}.ace-one-dark .ace_marker-layer .ace_selection{background:#3d4350}.ace-one-dark.ace_multiselect .ace_selection.ace_start{box-shadow:0 0 3px 0 #282c34;border-radius:2px}.ace-one-dark .ace_marker-layer .ace_step{background:#c6dbae}.ace-one-dark .ace_marker-layer .ace_bracket{margin:-1px 0 0 -1px;border:1px solid #747369}.ace-one-dark .ace_marker-layer .ace_active-line{background:rgba(76,87,103,.19)}.ace-one-dark .ace_gutter-active-line{background-color:rgba(76,87,103,.19)}.ace-one-dark .ace_marker-layer .ace_selected-word{border:1px solid #3d4350}.ace-one-dark .ace_fold{background-color:#61afef;border-color:#abb2bf}.ace-one-dark .ace_keyword{color:#c678dd}.ace-one-dark .ace_keyword.ace_operator{color:#abb2bf}.ace-one-dark .ace_keyword.ace_other.ace_unit{color:#d19a66}.ace-one-dark .ace_constant{color:#d19a66}.ace-one-dark .ace_constant.ace_numeric{color:#d19a66}.ace-one-dark .ace_constant.ace_character.ace_escape{color:#56b6c2}.ace-one-dark .ace_support.ace_function{color:#56b6c2}.ace-one-dark .ace_support.ace_class{color:#e5c07b}.ace-one-dark .ace_storage{color:#c678dd}.ace-one-dark .ace_invalid.ace_illegal{color:#fff;background-color:#f2777a}.ace-one-dark .ace_invalid.ace_deprecated{color:#272b33;background-color:#d27b53}.ace-one-dark .ace_string{color:#98c379}.ace-one-dark .ace_string.ace_regexp{color:#56b6c2}.ace-one-dark .ace_comment{font-style:italic;color:#5c6370}.ace-one-dark .ace_variable{color:#e06c75}.ace-one-dark .ace_meta.ace_selector{color:#c678dd}.ace-one-dark .ace_entity.ace_other.ace_attribute-name{color:#d19a66}.ace-one-dark .ace_entity.ace_name.ace_function{color:#61afef}.ace-one-dark .ace_entity.ace_name.ace_tag{color:#e06c75}.ace-one-dark .ace_markup.ace_list{color:#e06c75}'
  var r = e('../lib/dom')
  r.importCssString(t.cssText, t.cssClass)
})
;(function () {
  ace.require(['ace/theme/one_dark'], function (m) {
    if (typeof module == 'object' && typeof exports == 'object' && module) {
      module.exports = m
    }
  })
})();
END
) >> "$BUNDLEPATH"

_step "Creating bundle: adding support for languages..."
cat "$SRCDIR/mode-"* >> "$BUNDLEPATH"

_step "Creating bundle: saving list of supported languages..."
detected_modes=$(ls "$SRCDIR/mode-"* -1 | sed -E 's/^.*\/mode-(.*)\.js$/    "\1",/')
echo -e "export const aceBundleModes: string[] = [\n$detected_modes\n];" > "$1/ace-bundle-languages.ts"

_step "Compressing the bundle..."
current_dir=$(pwd)
cd "$2"
node -e "var fs = require('fs'); \
         var zlib = require('zlib'); \
         var bundle = fs.readFileSync('ace-bundle.min.js');\
         fs.writeFileSync('ace-bundle.gz', zlib.deflateSync(bundle, { level: 9 }));"
cd "$current_dir"
rm "$BUNDLEPATH"

_step "Cleaning up temporary directory..."
[ ! -z "$TMPDIR" ] && rm -rf "$TMPDIR"

# Done!
echo
echo "Success!"
echo "You can find the bundle in:"
echo "> $1"
echo
