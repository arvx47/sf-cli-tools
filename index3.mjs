#!/usr/bin/env npx zx
import * as dfd from "danfojs-node";
import { $ } from "zx";

const TARGET_ORG = "DEV4";
const SOURCE_ORG = "RC";

const definitionName = "Assessments";
let sourceObjectName = "Assessment__c";
let targetObjectName = "TPY_Assessment_Definition__c";
let mainCsvFileName = `./tmp/${definitionName}.csv`;
let uploadCsvFileName = `./tmp/${definitionName}_upload.csv`;
let queryFields = [
	"Allow_Multiple_Care_Plans__c",
	"Capture_Consent_Signature__c",
	"Create_HAP_by_default__c",
	"Detail_Section_Description__c",
	"Detail_Section_Title__c",
	"Evaluate_Reminder__c",
	"Id",
	"Instances_Scope__c",
	"Is_Pdf_Visible__c",
	"Name",
	"Program_to_Link__c",
	"Service_to_Link__c",
	"Total_Score__c",
	"Update_program_status__c",
];

const query = `SELECT ${queryFields.join(", ")} FROM ${sourceObjectName}`;

await $({
	stdio: "inherit",
})`sf data export bulk --query ${query} --output-file ${mainCsvFileName} --target-org ${SOURCE_ORG} --wait 5`;

const df = await dfd.readCSV(mainCsvFileName, { delimiter: "," });

df.rename(
	{
		Allow_Multiple_Care_Plans__c: "TPY_Allow_Multiple_Care_Plans__c",
		Capture_Consent_Signature__c: "TPY_Capture_Consent_Signature__c",
		Create_HAP_by_default__c: "TPY_Generate_Empty_Care_Plan__c",
		Detail_Section_Description__c: "TPY_Detail_Section_Content__c",
		Detail_Section_Title__c: "TPY_Detail_Section_Title__c",
		Evaluate_Reminder__c: "TPY_Evaluate_Reminder__c",
		Id: "TPY_HC_Migration_Id__c",
		Instances_Scope__c: "TPY_Instances_Scope__c",
		Is_Pdf_Visible__c: "TPY_Is_PDF_Visible__c",
		// Name: "Name",
		Program_to_Link__c: "TPY_Programs_to_Link__c",
		Service_to_Link__c: "TPY_Service_to_Link__c",
		Total_Score__c: "TPY_Total_Score__c",
		Update_program_status__c: "TPY_Update_Program_Status__c",
	},
	{ inplace: true }
);

df["TPY_Detail_Section_Content__c"].dropDuplicates().print();

dfd.toCSV(df, { filePath: uploadCsvFileName });

// await $({ stdio: "inherit" })`sf data upsert bulk --sobject ${targetObjectName} --file ${uploadCsvFileName} --external-id 'TPY_HC_Migration_Id__c' --target-org ${TARGET_ORG} --wait 5`;

// df.addColumn(
// 	"test_column__c",
// 	df["Total_Score__c"].apply((x) => 2),
// 	{ inplace: true }
// );

// df.print();

// df2.head().print();
