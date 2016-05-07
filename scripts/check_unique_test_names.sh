#!/usr/bin/env bash
set -e
# set -x

text=$(git grep "\<test('[^']*'" test | \
    sed -e "s/:[^']*'/ /" -e "s/'.*$//" | \
    cut -d' ' -f2- | \
    sort | \
    uniq -d\
)

if [ -z "$text" ]; then
    exit 0
fi

while read -r line; do
    git --no-pager grep "$line"
done <<< "$text"

echo "Found duplicate test names. This is not allowed"
exit 1
