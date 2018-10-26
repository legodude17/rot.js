echo "Beginning Build and Publish..."
echo "Removing package.json"

rm package.json

echo "Starting JS build"
echo "Copying package-js.json to package.json"

cp package-js.json package.json

echo "Running rollup"

./node_modules/.bin/rollup -c

echo "Finding files..."

npm pack --dry-run

echo "Proceed? (^C to quit)"

read

echo "Publishing"

npm publish

echo "Finishing JS build"
echo "Removing package.json"

rm package.json

echo "Starting ES build"
echo "Copying package-es.json to package.json"

cp package-es.json package.json

echo "Finding files..."

npm pack --dry-run

echo "Proceed? (^C to quit)"

read

echo "Publishing"

npm publish

echo "Finishing ES build"
echo "Removing package.json"

rm package.json

echo "Replacing original package.json"
echo "Copying package-base.json to package.json"

cp package-base.json package.json

echo "Done"

exit 0
