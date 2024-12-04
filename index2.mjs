#!/usr/bin/env npx zx

await $`cat package.json | grep name`

const branch = await $`git branch --show-current`

console.log(branch);

await Promise.all([
  $`sleep 1; echo 1`,
  $`sleep 2; echo 2`,
  $`sleep 3; echo 3`,
])