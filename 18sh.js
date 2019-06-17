"use strict"

const term = require("terminal-kit").terminal
const gameState = require("./modules/gameState.js")

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
					var undid = gameState.undo()
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
				default:
					if (gameState.getName()) {
						gameState.perform(input)
					} else {
						term("^rNo active game!\n")
					}
					commandPrompt()
			}
		}
	)
}

gameState.initialize()
commandPrompt()
