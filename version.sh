#!/bin/sh

echo "Beginning Build and Publish..."
echo "Removing package.json"

rm package.json

echo "Starting JS version"
echo "Copying package-js.json to package.json"

cp package-js.json package.json

echo "Running version"

npm version $1

echo "Finishing JS version"
echo "Removing package.json"

rm package.json

echo "Starting ES version"
echo "Copying package-es.json to package.json"

cp package-es.json package.json

echo "Running version"

npm version $1

echo "Finishing ES version"
echo "Removing package.json"

rm package.json

echo "Replacing original package.json"
echo "Copying package-base.json to package.json"

cp package-base.json package.json

echo "Versioning base"
echo "Running version to VERSION"

npm version $1 > VERSION

echo "Done"

exit 0
