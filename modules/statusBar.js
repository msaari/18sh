"use strict"

const term = require("terminal-kit").terminal

const showStatus = barContent => {
	const barContentArray = barContent.split("\t")
	let barContentString = "18SH"

	barContent = ""
	barContentArray.forEach(item => {
		const newString = "    " + item.trim()
		if (barContentString.length + newString.length > term.width) {
			barContent += barContentString + "\n"
			barContentString = newString.trim()
		} else {
			barContentString += "    " + item.trim()
		}
	})
	barContent += barContentString

	term.saveCursor()
	term.eraseLineAfter()

	let lines = Math.ceil(barContent.length / term.width)
	for (let line = 1; line <= lines; line += 1) {
		term.moveTo(1, line)
		term.bgYellow()
		term.black()
		term(new Array(term.width + 1).join(" "))
	}

	term.moveTo(1, 1)
	term(barContent)
	term.restoreCursor()
}

module.exports = showStatus
