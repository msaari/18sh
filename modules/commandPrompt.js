"use strict"

const parser = require("./parser")
const term = require("terminal-kit").terminal
const gameState = require("./gameState")
const statusBar = require("./statusBar")
const usage = require("./usage")

var updateMode = false

const initialize = () => {
	term.fullscreen()
	term.nextLine()
	const response = gameState.createOrLoadGame()
	if (response.mode === "load") {
		updateGameState(gameState.getCommandHistory())
	}
	term(response.feedback)
	updateStatusBar()
}

const updateStatusBar = () => {
	statusBar(gameState.statusBarContent())
}

const updateGameState = commandHistoryArray => {
	gameState.resetGameState()
	const silent = true
	if (commandHistoryArray) {
		commandHistoryArray.map(command => perform(command, silent))
	}
}

const undo = () => {
	var commandHistoryArray = gameState.getCommandHistory()
	var undid = commandHistoryArray.pop()
	updateGameState(commandHistoryArray)
	gameState.setCommandHistory(commandHistoryArray)
	return undid
}

const commandPrompt = () => {
	var commandHistory = gameState.getCommandHistory()

	term("> ")

	term.inputField(
		{
			history: commandHistory
		},
		(error, input) => {
			term("\n")
			if (error) {
				term("An error occurred.\n")
				throw new Error("Something bad happened!")
			}
			switch (input) {
				case "undo":
					var undid = undo()
					term(`Undid ^y"${undid}"^\n`)
					commandPrompt()
					break
				case "q":
				case "qu":
				case "qui":
				case "quit":
				case "e":
				case "ex":
				case "exi":
				case "exit":
					term("Bye!\n")
					/* eslint-disable no-process-exit */
					process.exit()
					break
				case "help":
					help()
					commandPrompt()
					break
				default:
					if (gameState.getName()) {
						perform(input)
					} else {
						term("^rNo active game!\n")
					}
					commandPrompt()
			}
		}
	)
}

/**
 * Takes in the raw command string, parses it, then performs the required
 * action by calling the gameState method that changes the game state and
 * then prints out the results to the terminal.
 *
 * @param {string} command The raw command string.
 * @param {boolean} silent If true, no output to terminal.
 *
 * @returns {void}
 */
const perform = (command, silent = false) => {
	updateMode = silent
	const action = parser(command)

	var addToHistory = false
	switch (action.verb) {
		case "holdings":
			holdings()
			addToHistory = false
			break
		case "values":
			values()
			addToHistory = false
			break
		case "listGames":
			listGames()
			addToHistory = false
			break
		case "open":
			open(action.object)
			addToHistory = false
			break
		case "delete":
			deleteGame(action.object)
			addToHistory = false
			break
		case "start":
			newGame(action.object)
			addToHistory = false
			break
		case "buy":
			buy(action.subject, action.object, action.quantity)
			addToHistory = true
			break
		case "sell":
			sell(action.subject, action.object, action.quantity)
			addToHistory = true
			break
		case "dividend":
			dividend(action.subject, action.object)
			addToHistory = true
			break
		case "value":
			value(action.subject, action.object)
			addToHistory = true
			break
		case "give":
			give(action.subject, action.quantity)
			addToHistory = true
			break
		case "take":
			take(action.subject, action.quantity)
			addToHistory = true
			break
		case "banksize":
			bankSize(action.object)
			addToHistory = true
			break
		case "bank":
			showBankRemains()
			addToHistory = false
			break
		case "companies":
			companies()
			addToHistory = false
			break
		default:
			term("^rUnrecognized command!^\n")
			addToHistory = false
	}

	if (updateMode) addToHistory = false

	if (addToHistory) {
		let normalizedCommand = ""
		if (action.subject) normalizedCommand += `${action.subject} `
		if (action.verb) normalizedCommand += `${action.verb} `
		if (action.object) normalizedCommand += `${action.object} `
		if (action.quantity) normalizedCommand += `${action.quantity}`
		gameState.addToHistory(normalizedCommand.trim())
	}
	updateStatusBar()
}

const buy = (buyer, object, count = 1) => {
	const feedback = gameState.changeSharesOwned(buyer, object, count)
	if (!updateMode) {
		term(feedback)
	}
}

const sell = (seller, object, count = 1) => {
	count *= -1
	const feedback = gameState.changeSharesOwned(seller, object, count)
	if (!updateMode) {
		term(feedback)
	}
}

const holdings = () => {
	term(gameState.getHoldingsTable() + "\n")
}

const values = () => {
	term(gameState.getValuesTable() + "\n")
}

const companies = () => {
	term(gameState.getCompanyTable() + "\n")
}

const dividend = (payingCompany, value) => {
	const feedback = gameState.payDividends(payingCompany, value)
	if (!updateMode) {
		term(feedback)
	}
}

const value = (company, value) => {
	const feedback = gameState.setValue(company, value)
	if (!updateMode) {
		term(feedback)
	}
}

const listGames = () => {
	const feedback = gameState.listGames()
	term(feedback)
}

const deleteGame = name => {
	name = name.toLowerCase()
	const feedback = gameState.deleteGame(name)
	term(feedback)
}

const newGame = name => {
	name = name.toLowerCase()
	const feedback = gameState.newGame(name)
	term(feedback)
}

const open = name => {
	name = name.toLowerCase()
	const feedback = gameState.open(name)
	console.log("ch", gameState.getCommandHistory())
	updateGameState(gameState.getCommandHistory())
	term(feedback)
}

const give = (player, quantity) => {
	const feedback = gameState.changeCash(player, quantity)
	if (!updateMode) {
		term(feedback)
	}
}

const take = (player, quantity) => {
	const feedback = gameState.changeCash(player, quantity * -1)
	if (!updateMode) {
		term(feedback)
	}
}

const bankSize = size => {
	const feedback = gameState.setBankSize(size)
	if (!updateMode) {
		term(feedback)
	}
}

const showBankRemains = () => {
	const feedback = gameState.getBankRemains()
	if (!updateMode) {
		term(feedback)
	}
}

const help = () => {
	term(usage())
}

module.exports = {
	initialize,
	commandPrompt,
	perform
}
