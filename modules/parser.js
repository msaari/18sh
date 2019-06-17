"use strict"

const parse = command => {
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
					quantity: 0
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
					quantity: 0
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
					quantity: 0
				}
				break
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0
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
					quantity: 0
				}
				break
			case "delete":
				result = {
					verb: "delete",
					object,
					subject: null,
					quantity: 0
				}
				break
			case "start":
				result = {
					verb: "start",
					object,
					subject: null,
					quantity: 0
				}
				break
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0
				}
		}
	}
	if (parts.length > 2) {
		let subject = parts[0].toUpperCase()
		let verb = parts[1]
		let object = parts[2].toUpperCase()
		let quantity = parts[3] ? parts[3] : 1
		if (isNaN(parseInt(quantity)) && !isNaN(parseInt(object))) {
			let temp = quantity
			quantity = object
			object = temp.toUpperCase()
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
					quantity
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
					quantity
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
					quantity: 0
				}
				break
			case "v":
			case "va":
			case "val":
			case "valu":
			case "value":
				result = {
					verb: "value",
					object,
					subject,
					quantity: 0
				}
				break
			default:
				result = {
					verb: null,
					object: null,
					subject: null,
					quantity: 0
				}
		}
	}

	return result
}

module.exports = parse
