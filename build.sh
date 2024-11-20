#!/bin/bash
set -xe

tsc
mkdir -p public
cp -r dist public/
cp -r assets public/
cp index.html public/
cp style.css public/