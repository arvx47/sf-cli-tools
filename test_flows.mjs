#!/usr/bin/env node

import { log } from "node:console";
import { Transform, Readable, Writable } from "node:stream";

const separadorDeComa = new Transform({
	readableObjectMode: true,

	transform(trozo, codificacion, callback) {
		this.push(trozo.toString().trim().split(","));
		callback();
	},
});

const arrayAObjeto = new Transform({
	readableObjectMode: true,
	writableObjectMode: true,

	transform(trozo, codificacion, callback) {
		const objeto = {};
		for (let i = 0; i < trozo.length; i += 2) {
			objeto[trozo[i]] = trozo[i + 1];
		}
		this.push(objeto);
		callback();
	},
});

const objetoAString = new Transform({
	writableObjectMode: true,

	transform(trozo, codificacion, callback) {
		this.push(JSON.stringify(trozo) + "\n");
		callback();
	},
});

const readableStream = new Readable({
	read() {},
});

readableStream.push("pepe");
readableStream.push("pepe2");
readableStream.push(null);

const writableStream = new Writable({
	write(chunk, encoding, callback) {
		log(chunk.toString());
		callback();
	},
});

readableStream.on("data", (data) => {
	writableStream.write(data);
});

readableStream.on("close", () => {
	writableStream.end();
});

// process.stdin
// 	.pipe(separadorDeComa)
// 	.pipe(arrayAObjeto)
// 	.pipe(objetoAString)
// 	.pipe(process.stdout);
