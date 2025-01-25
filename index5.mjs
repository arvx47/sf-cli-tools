import { Readable, Writable, Transform } from "stream";
import { createReadStream, createWriteStream } from "fs";
import Papa from "papaparse";
import pl from "nodejs-polars";
import { log } from "console";

const createCSVInputStream = (filePath, options) => {
	var isFirstChunk = true;
	var columnNames = [];

	const csvReadStream = new Readable({
		objectMode: true,
		read() {},
	});

	const fileReadStream = createReadStream(filePath);

	let count = 0;

	Papa.parse(fileReadStream, {
		header: options.header,
		dynamicTyping: true,
		step(results) {
			if (isFirstChunk) {
				if (options.header === true) {
					columnNames = results.meta.fields || [];
				} else {
					columnNames = results.data;
				}
				isFirstChunk = false;
				return;
			}
			const df = pl.DataFrame([results.data], {
				columns: columnNames,
				index: [count++],
			});
			csvReadStream.push(df);
		},
		complete(result) {
			csvReadStream.push(null);
			return null;
		},
		error(err) {
			csvReadStream.emit("error", err);
		},
	});

	return csvReadStream;
};

const createCSVOutputStream = (filePath, options) => {
	const fileWritableStream = createWriteStream(filePath);
	let isFirstRow = true;
	const csvWriteStream = new Writable({
		objectMode: true,
		write(chunk, encoding, callback) {
			// if (chunk instanceof pl.DataFrame) {
			if (isFirstRow) {
				isFirstRow = false;
				fileWritableStream.write(toCsvStr(chunk, true));
				callback();
			} else {
				fileWritableStream.write(toCsvStr(chunk, false));
				callback();
			}
			// } else if (chunk instanceof pl.Series) {
			// 	fileWritableStream.write(toCsvStr(chunk, false));
			// 	callback();
			// } else {
			// 	this.emit(
			// 		"error",
			// 		new Error(
			// 			"ValueError: Intermediate chunk must be either a Series or DataFrame"
			// 		)
			// 	);
			// }
		},
	});
	csvWriteStream.on("finish", function () {
		fileWritableStream.end();
	});
	return csvWriteStream;
};

const createCsvTransformStream = (func) => {
	const transformStream = new Transform({
		objectMode: true,
		transform(chunk, encoding, callback) {
			const outputChunk = func(chunk);
			transformStream.push(outputChunk);
			callback();
		},
	});
	return transformStream;
};

const updateString = (df, idx) => {
	let s = "";

	df.columns.forEach((k) => {
		s += `${df.get(k).iloc(idx)},`;
	});

	return s;
};

const toCsvStr = (df, header) => {
	let csvString = "";

	if (header) {
		csvString = df.columns.join(",") + "\n";
		log(csvString)
		return csvString;
	}

	const rows = df.rows();

	for (var i = 0; i < rows.length; i++) {
		const row = rows[i].join(",") + "\n";
		csvString += row;
	}

	return csvString;
};

const streamCsvTransformer = (inputFilePath, outputFilePath, transformer) => {
	const header = true;

	const csvInputStream = createCSVInputStream(inputFilePath, { header });
	const csvTransformStream = createCsvTransformStream(transformer);
	const csvOutputStream = createCSVOutputStream(outputFilePath, { header });

	csvInputStream
		.pipe(csvTransformStream)
		.pipe(csvOutputStream)
		.on("error", function (err) {
			console.error("An error occurred while transforming the CSV file");
			console.error(err);
		});
};

streamCsvTransformer(
	"./tmp/Base.Assessments.Answer.csv",
	"./tmp/Assessments2.csv",
	(df) => {
		// toCsvStr(df, true);
		// df.rename({
		// 	Name: "TPY_Disabled__c",
		// });
		return df;
	}
);
