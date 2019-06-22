"use strict"

const term = require("terminal-kit").terminal

const showStatus = barContent => {
	term.saveCursor()
	term.eraseLineAfter()
	term.moveTo(1, 1)
	term.bgYellow()
	term.black()
	term(new Array(term.width + 1).join(" "))
	term.moveTo(1, 1)
	term("18SH")

	term(barContent)

	term.restoreCursor()
}

module.exports = showStatus
