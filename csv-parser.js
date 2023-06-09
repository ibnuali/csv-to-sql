const fs = require("fs");
const { parse } = require("csv-parse");

const args = process.argv.slice(2);
const tableNameArgIndex = args.findIndex((arg) => arg === "--table_name");

if (tableNameArgIndex === -1 || tableNameArgIndex === args.length - 1) {
  console.error("Please provide the --table_name argument.");
  return;
}

const tableName = args[tableNameArgIndex + 1];

const csvFilePath = `./${tableName}.csv`;

if (fs.existsSync(`${tableName}.sql`)) {
  fs.unlinkSync(`${tableName}.sql`);
}

fs.readFile(csvFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the CSV file:", err);
    return;
  }

  parse(data, { cast: true }, (parseErr, csvRows) => {
    if (parseErr) {
      console.error("Error parsing the CSV:", parseErr);
      return;
    }

    const columnHeaders = csvRows[0];
    const dataRows = csvRows.slice(1);

    const insertStatements = dataRows.map((rowData) => {
      const values = rowData.map((value) => {
        if (value === 'NULL') return value.replace(/'/g, "''");
        if (typeof value === "number") return value;
        const escapedValue = value.replace(/'/g, "''");
        return `'${escapedValue}'`;
      });

      return `INSERT INTO ${tableName} (${columnHeaders.join(
        ", "
      )}) VALUES (${values.join(", ")});`;
    });

    const lastStatementIndex = insertStatements.length - 1;
    insertStatements[lastStatementIndex] = insertStatements[
      lastStatementIndex
    ].replace(/,(\s*\))/, "$1");

    fs.appendFile(
      `${tableName}.sql`,
      insertStatements.join("\n"),
      function (err) {
        if (err) throw err;
      }
    );
  });
});
