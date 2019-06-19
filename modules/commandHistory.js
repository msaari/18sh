"use strict"

const Configstore = require("configstore")

/* eslint-disable no-process-env */
const configstoreName = process.env.NODE_ENV === "test" ? "18sh-test" : "18sh"
const conf = new Configstore(configstoreName)

const getCommandHistory = gameState => {
	var commandHistory = conf.get(gameState.gameName)
	if (!commandHistory) commandHistory = new Array()
	return commandHistory
}

const addCommandToHistory = (command, gameState) => {
	var commandHistory = getCommandHistory(gameState)
	commandHistory.push(command)
	saveCommandHistory(commandHistory, gameState)
}

const saveCommandHistory = (commandHistory, gameState) => {
	conf.set(gameState.gameName, commandHistory)
}

const getPreviousDividend = (company, gameState) => {
	const commandHistory = getCommandHistory(gameState)
	const commandStart = `${company} dividend `
	let dividend = commandHistory.reduce((accumulator, command) => {
		if (command.substr(0, commandStart.length) === commandStart) {
			accumulator = command.replace(commandStart, "")
		}
		return accumulator
	}, 0)
	return dividend
}

module.exports = {
	getPreviousDividend,
	getCommandHistory,
	saveCommandHistory,
	addCommandToHistory
}
