class DeveloperError extends Error {
    constructor(name, message, file, functionName, lineOfCode) {
        super(message);
        this.name = name;
        this.file = file;
        this.functionName = functionName;
        this.lineOfCode = lineOfCode;

        this.printError();
    }

    printError() {
        let newLine = "\n";
        console.error(this.name + newLine + this.message + newLine + this.file + newLine + this.functionName + newLine + this.lineOfCode);
    }
}

module.exports = { DeveloperError };