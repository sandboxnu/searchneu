import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function findTestFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith(".test.ts")) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

const testFiles = findTestFiles("lib");
const testFilesStr = testFiles.join(" ");

if (testFiles.length === 0) {
  console.log("No test files found");
  process.exit(0);
}

console.log(`Found ${testFiles.length} test file(s):`);
testFiles.forEach((file) => console.log(`  - ${file}`));

try {
  execSync(`node --test --import tsx ${testFilesStr}`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (error) {
  process.exit(error.status || 1);
}
