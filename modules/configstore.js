"use strict"

const Configstore = require("configstore")
/* eslint-disable no-process-env */
const configstoreName = process.env.NODE_ENV === "test" ? "18sh-test" : "18sh"
const conf = new Configstore(configstoreName)
const nameGenerator = require("./generateName")

const open = name => {
	let feedback = ""
	let success = false
	name = name.toLowerCase()
	if (conf.has(name)) {
		success = true
		feedback = `Opened game ^y'${name}'^\n`
		conf.set("currentGameName", name)
	} else {
		feedback = `Game ^y'${name}'^ doesn't exist.\n`
	}
	return {
		feedback,
		success
	}
}

const listGames = () => {
	let feedback = ""
	Object.keys(conf.all).forEach(key => {
		if (key === "currentGameName") return
		feedback += `${key}\n`
	})
	return feedback
}

const deleteGame = name => {
	let feedback = ""
	let success = false
	if (conf.has(name)) {
		conf.delete(name)
		feedback = `Deleted ^y'${name}'^\n`
		if (conf.get("currentGameName") === name) {
			conf.delete("currentGameName")
			success = true
			feedback += `Deleted the active game, no game active at the moment.\n`
		}
	} else {
		feedback = `^rGame ^y'${name}'^r doesn't exist.\n`
	}
	return {
		feedback,
		success
	}
}

const newGame = gameName => {
	let feedback = ""
	let success = false
	if (conf.has(gameName)) {
		feedback = `^rGame ^y'${gameName}'^ already exists!\n`
	} else {
		success = true
		conf.set("currentGameName", gameName)
		feedback = `Game ^y'${gameName}'^ generated and active.\n`
	}
	return {
		feedback,
		success
	}
}

const createOrLoadGame = () => {
	let currentGameName = conf.get("currentGameName")
	let feedback = ""
	let mode = ""
	if (!currentGameName) {
		currentGameName = nameGenerator.generateName()
		conf.set("currentGameName", currentGameName)
		mode = "create"
		feedback = `Your game name is ^y'${currentGameName}'^\n`
	} else if (currentGameName) {
		feedback = `Continuing game ^y'${currentGameName}'^\n`
		mode = "load"
	}
	return {
		currentGameName,
		feedback,
		mode
	}
}

const getCommandHistory = gameState => {
	var commandHistory = conf.get(gameState.gameName)
	if (!commandHistory) commandHistory = new Array()
	if (!commandHistory.length) commandHistory = new Array()
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

const _getPreviousDividend = (company, gameState, mode) => {
	if (mode !== "dividend" && mode !== "halfdividend") mode = "dividend"
	const commandHistory = getCommandHistory(gameState)
	const commandStart = `${company} ${mode} `
	let dividend = commandHistory.reduce((accumulator, command) => {
		if (command.substr(0, commandStart.length) === commandStart) {
			let dividend = command.replace(commandStart, "")
			if (dividend !== "PREV") accumulator = dividend
		}
		return accumulator
	}, 0)
	return dividend
}

const getPreviousDividend = (company, gameState) =>
	_getPreviousDividend(company, gameState, "dividend")

const getPreviousHalfDividend = (company, gameState) =>
	_getPreviousDividend(company, gameState, "halfdividend")

module.exports = {
	open,
	listGames,
	deleteGame,
	newGame,
	createOrLoadGame,
	getPreviousDividend,
	getPreviousHalfDividend,
	getCommandHistory,
	saveCommandHistory,
	addCommandToHistory
}
