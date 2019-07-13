"use strict"

const parser = require("./parser")
const term = require("terminal-kit").terminal
const gameState = require("./gameState")
const statusBar = require("./statusBar")
const updateDisplay = require("./display")
const usage = require("./usage")

var updateMode = false

const initialize = () => {
	term.fullscreen()
	term.nextLine(term.height - 4)
	const response = gameState.createOrLoadGame()
	if (response.mode === "load") {
		_updateGameState(gameState.getCommandHistory())
	}
	term(response.feedback)
	updateStatusBar()
}

const updateStatusBar = () => {
	statusBar(gameState.statusBarContent())
	updateDisplay(gameState.getName(), gameState.displayContent())
}

const _updateGameState = commandHistoryArray => {
	gameState.resetGameState()
	const silent = true
	if (commandHistoryArray) {
		commandHistoryArray.map(command => perform(command, silent))
	}
}

const _getGameState = () => gameState

const undo = () => {
	var commandHistoryArray = gameState.getCommandHistory()
	var undid = commandHistoryArray.pop()
	_updateGameState(commandHistoryArray)
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
					term(usage())
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

	if (!action.verb && action.comment) action.verb = "comment"

	var addToHistory = false
	let normalizedCommand = ""
	switch (action.verb) {
		case "holdings":
			term(gameState.getHoldingsTable() + "\n")
			addToHistory = false
			break
		case "values":
			term(gameState.getValuesTable() + "\n")
			addToHistory = false
			break
		case "listGames":
			echoToTerm(gameState.listGames())
			addToHistory = false
			break
		case "open":
			echoToTerm(gameState.open(action.object.toLowerCase()))
			_updateGameState(gameState.getCommandHistory())
			addToHistory = false
			break
		case "delete":
			echoToTerm(gameState.deleteGame(action.object.toLowerCase()))
			addToHistory = false
			break
		case "start":
			echoToTerm(gameState.newGame(action.object.toLowerCase()))
			addToHistory = false
			break
		case "buy":
			echoToTerm(
				gameState.buyShares(
					action.subject,
					action.object,
					action.quantity,
					action.price,
					action.source
				)
			)
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} ${action.object}`
			if (action.price) normalizedCommand += ` @${action.price}`
			if (action.source) normalizedCommand += ` from ${action.source}`
			addToHistory = true
			break
		case "sell":
			echoToTerm(
				gameState.sellShares(
					action.subject,
					action.object,
					action.quantity,
					action.price
				)
			)
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} ${action.object}`
			if (action.price) normalizedCommand += ` @${action.price}`
			addToHistory = true
			break
		case "dividend":
			echoToTerm(gameState.payDividends(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "halfdividend":
			echoToTerm(gameState.payHalfDividends(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "value":
			echoToTerm(gameState.setValue(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "give":
			echoToTerm(
				gameState.moveCash(action.subject, action.object, action.quantity)
			)
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} to ${action.object}`
			addToHistory = true
			break
		case "cash":
			echoToTerm(gameState.changeCash(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "float":
			echoToTerm(gameState.float(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "close":
			echoToTerm(gameState.close(action.object))
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "banksize":
			echoToTerm(gameState.setBankSize(action.quantity, action.object))
			normalizedCommand = `${action.verb} `
			if (action.object) normalizedCommand += `${action.object}`
			normalizedCommand += `${action.quantity}`
			addToHistory = action.quantity
			break
		case "bank":
			echoToTerm(gameState.getBankRemains())
			addToHistory = false
			break
		case "companies":
			term(gameState.getCompanyTable() + "\n")
			addToHistory = false
			break
		case "next":
			echoToTerm(gameState.nextRound(action.object))
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "rounding":
			setParameter("rounding", action.object)
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "companycredits":
			setParameter("companycredits", true)
			normalizedCommand = `${action.verb}`
			addToHistory = true
			break
		case "income":
			echoToTerm(gameState.setIncome(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "comment":
			addToHistory = true
			break
		default:
			term("^rUnrecognized command!^\n")
			addToHistory = false
	}

	if (updateMode) addToHistory = false

	if (addToHistory) {
		if (action.comment) normalizedCommand += ` # ${action.comment}`
		gameState.addToHistory(normalizedCommand.trim())
	}
	if (!updateMode) updateStatusBar()
}

const setParameter = (parameter, value) => {
	echoToTerm(gameState.setParameter(parameter, value))
}

const echoToTerm = feedback => {
	if (!updateMode) {
		term(feedback)
	}
}

module.exports = {
	initialize,
	commandPrompt,
	perform,
	_updateGameState,
	_getGameState
}
