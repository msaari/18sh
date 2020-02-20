"use strict"

const parse = command => {
	const commentSplit = command.split("#", 2)
	let comment = null
	if (commentSplit.length > 1) {
		command = commentSplit[0].trim()
		comment = commentSplit[1].trim()
	}
	const parts = command.split(" ")
	let result = {}
	if (parts.length == 1) {
		switch (parts[0]) {
			case "h":
			case "ho":
			case "hol":
			case "hold":
			case "holdi":
			case "holdin":
			case "holding":
			case "holdings":
				result = {
					verb: "holdings",
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "v":
			case "va":
			case "val":
			case "valu":
			case "value":
			case "values":
				result = {
					verb: "values",
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "l":
			case "li":
			case "lis":
			case "list":
				result = {
					verb: "listGames",
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "b":
			case "ba":
			case "ban":
			case "bank":
				result = {
					verb: "bank",
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "c":
			case "co":
			case "com":
			case "comp":
			case "compa":
			case "compan":
			case "compani":
			case "companie":
			case "companies":
				result = {
					verb: "companies",
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "companycredits":
				result = {
					verb: "companycredits",
					object: true,
					subject: null,
					quantity: 0,
					comment
				}
				break
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
		}
	}
	if (parts.length == 2) {
		let verb = parts[0]
		let object = parts[1].toUpperCase()
		switch (verb) {
			case "o":
			case "op":
			case "ope":
			case "open":
				result = {
					verb: "open",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "delete":
				result = {
					verb: "delete",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "start":
				result = {
					verb: "start",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "b":
			case "ba":
			case "ban":
			case "bank":
			case "banks":
			case "banksi":
			case "banksiz":
			case "banksize": {
				let quantity = 0
				if (isNaN(parseInt(object))) {
					if (!isNaN(parseInt(object.substr(1)))) {
						quantity = parseInt(object.substr(1))
						object = object.substr(0, 1)
					}
				} else {
					quantity = parseInt(object)
					object = null
				}
				result = {
					verb: "banksize",
					object,
					subject: null,
					quantity,
					comment
				}
				break
			}
			case "close":
				result = {
					verb: "close",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "n":
			case "ne":
			case "nex":
			case "next":
				result = {
					verb: "next",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "rounding":
				result = {
					verb: "rounding",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			case "remove":
				result = {
					verb: "remove",
					object,
					subject: null,
					quantity: 0,
					comment
				}
				break
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
		}
	}
	if (parts.length === 3) {
		let subject = parts[0].toUpperCase()
		let verb = parts[1]
		let object = null
		let quantity = 1
		if (isNaN(parseInt(parts[2]))) {
			object = parts[2].toUpperCase()
		} else {
			quantity = parseInt(parts[2])
		}
		switch (verb) {
			case "b":
			case "bu":
			case "buy":
			case "buys":
				result = {
					verb: "buy",
					object,
					subject,
					quantity,
					price: 0,
					source: null,
					comment
				}
				break
			case "s":
			case "se":
			case "sell":
			case "sells":
				result = {
					verb: "sell",
					object,
					subject,
					quantity,
					price: 0,
					comment
				}
				break
			case "d":
			case "di":
			case "div":
			case "divi":
			case "divid":
			case "divide":
			case "dividen":
			case "dividend":
			case "dividends":
			case "p":
			case "pa":
			case "pay":
			case "pays":
				result = {
					verb: "dividend",
					object,
					subject,
					quantity,
					comment
				}
				break
			case "h":
			case "ha":
			case "hal":
			case "half":
			case "halfd":
			case "halfdi":
			case "halfdiv":
			case "halfdivi":
			case "halfdivid":
			case "halfdivide":
			case "halfdividen":
			case "halfdividend":
			case "halfdividends":
				result = {
					verb: "halfdividend",
					object,
					subject,
					quantity,
					comment
				}
				break
			case "v":
			case "va":
			case "val":
			case "valu":
			case "value":
				if (isNaN(parseInt(object)) && quantity === 1) {
					object = null
					quantity = NaN
				}
				result = {
					verb: "value",
					object,
					subject,
					quantity,
					comment
				}
				break
			case "f":
			case "fl":
			case "flo":
			case "floa":
			case "float":
				result = {
					verb: "float",
					object,
					subject,
					quantity,
					comment
				}
				break
			case "c":
			case "ca":
			case "cas":
			case "cash":
				result = {
					verb: "cash",
					object,
					subject,
					quantity,
					comment
				}
				break
			case "set":
				result = {
					verb: "set",
					object,
					subject,
					quantity,
					comment
				}
				break
			case "income":
				result = {
					verb: "income",
					object,
					subject,
					quantity,
					comment
				}
				break
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
		}
	}
	if (parts.length > 3) {
		let subject = parts[0].toUpperCase()
		let verb = parts[1]
		switch (verb) {
			case "b":
			case "bu":
			case "buy":
			case "buys": {
				let quantity = 1
				let object = null
				let price = 0
				let source = null
				let argNumber = 2
				let verb = "buy"
				if (isNaN(parseInt(parts[argNumber]))) {
					object = parts[argNumber].toUpperCase()
					argNumber += 1
				} else {
					quantity = parseInt(parts[argNumber])
					object = parts[argNumber + 1].toUpperCase()
					argNumber += 2
				}
				if (typeof parts[argNumber] !== "undefined") {
					if (parts[argNumber].substring(0, 1) === "@") {
						price = parseInt(parts[argNumber].substring(1))
					} else {
						price = parseInt(parts[argNumber])
					}
				}
				argNumber += 1
				if (
					typeof parts[argNumber] !== "undefined" &&
					parts[argNumber].toUpperCase() === "FROM"
				)
					argNumber += 1
				if (typeof parts[argNumber] !== "undefined") {
					source = parts[argNumber].toUpperCase()
				}

				result = {
					verb,
					object,
					subject,
					quantity,
					price,
					source,
					comment
				}
				break
			}
			case "s":
			case "se":
			case "sell":
			case "sells": {
				let verb = "sell"
				let quantity = 1
				let object = null
				let price = 0
				let argNumber = 2
				if (isNaN(parseInt(parts[argNumber]))) {
					object = parts[argNumber].toUpperCase()
					argNumber += 1
				} else {
					quantity = parseInt(parts[argNumber])
					object = parts[argNumber + 1].toUpperCase()
					argNumber += 2
				}
				if (typeof parts[argNumber] !== "undefined") {
					if (parts[argNumber].substring(0, 1) === "@") {
						price = parseInt(parts[argNumber].substring(1))
					} else {
						price = parseInt(parts[argNumber])
					}
				}

				result = {
					verb,
					object,
					subject,
					quantity,
					price,
					comment
				}
				break
			}
			case "g":
			case "gi":
			case "giv":
			case "give": {
				let verb = "give"
				let quantity = parseInt(parts[2])
				let argNumber = 3
				if (parts[argNumber].toUpperCase() === "TO") {
					argNumber += 1
				}
				let object = parts[argNumber].toUpperCase()

				result = {
					verb,
					object,
					subject,
					quantity,
					comment
				}
				break
			}
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0,
					comment
				}
		}
	}

	return result
}

module.exports = parse
