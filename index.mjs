#!/usr/bin/env node
import { Command } from "commander";
const program = new Command();
import { $ } from 'zx';

let stdin = "";

program
	.name("mz")
	.description("CLI built to ease the development workflow with Salesforce")
	.version("1.0.0");

program
	.command("deploy:files")
	.description("Deploy a list of files")
	.argument("[files...]", "Paths of files to deploy separated by spaces")
	.action(async (files) => {
		if (stdin) {
			files = stdin.trim().split("\n");
		} else if (files) {
			const filesString = files.join(" ");
			files = filesString
				.split(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
				.filter((str) => str && str !== " ");
		}
		console.log('Number of files: ' + files.length);
		await $({ stdio: "inherit" })`sf project deploy start -d ${files}`
	});

program
	.command("deploy:manifest")
	.description("Deplot a manifest package.xml")
	.argument("[manifest path]", "paths of manifest to deploy")
	.action(async (path) => {
		await $({ stdio: "inherit" })`sf project deploy start -x ${path}`
	});

if (process.stdin.isTTY) {
	program.parse();
} else {
	for await (const chunk of process.stdin) stdin += chunk;
	program.parse();
}
