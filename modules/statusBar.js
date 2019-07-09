"use strict"

const term = require("terminal-kit").terminal

const showStatus = barContent => {
	const playerBarContentArray = barContent.players.split("\t")
	const companyBarContentArray = barContent.companies.split("\t")
	let barContentString = "18SH"

	if (barContent.round) barContentString += "    " + barContent.round

	term.saveCursor()

	let playerBarContent = ""
	playerBarContentArray.forEach(item => {
		const newString = "    " + item.trim()
		if (barContentString.length + newString.length > term.width) {
			playerBarContent += barContentString + "\n"
			barContentString = newString.trim()
		} else {
			barContentString += "    " + item.trim()
		}
	})
	playerBarContent += barContentString

	let playerLines = Math.ceil(playerBarContent.length / term.width)
	term.moveTo(1, 1)
	for (let line = 1; line <= playerLines; line += 1) {
		term.bgGreen()
		term.black()
		term(new Array(term.width + 1).join(" "))
		term.nextLine()
	}

	term.moveTo(1, 1)
	term(playerBarContent)

	barContentString = ""
	let companyBarContent = ""
	companyBarContentArray.forEach(item => {
		const newString = item.trim() + "    "
		if (barContentString.length + newString.length > term.width) {
			companyBarContent += barContentString + "\n"
			barContentString = newString.trim()
		} else {
			barContentString += item.trim() + "    "
		}
	})
	companyBarContent += barContentString

	term.moveTo(1, playerLines + 1)
	let companyLines = Math.ceil(companyBarContent.length / term.width)
	for (let line = 1; line <= companyLines; line += 1) {
		term.bgYellow()
		term.black()
		term(new Array(term.width + 1).join(" "))
		term.nextLine()
	}

	term.moveTo(1, playerLines + 1)
	term(companyBarContent)

	term.restoreCursor()
}

module.exports = showStatus
