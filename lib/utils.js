import colors from "colors";

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function consoleLog(message) {
	console.log(colors.bgBlue.black(message));
}

function consoleError(message) {
	console.log(colors.bgRed.black(message));
}

function consoleCheck(message) {
	console.log(colors.bgGreen.black(message));
}

function consoleWarn(message) {
    console.log(colors.bgYellow.black(message));
}

export default {
    timeout,
    consoleLog,
    consoleError,
    consoleCheck,
    consoleWarn,
};
