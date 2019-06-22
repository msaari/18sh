"use strict"

const expect = require("chai").expect
const gameState = require("../modules/gameState")

const Configstore = require("configstore")
const conf = new Configstore("18sh-test")

describe("GameState", () => {
	describe("setName and getName", () => {
		it("should return the set name", () => {
			const name = "test-name"
			gameState._setName(name)
			expect(gameState.getName()).to.deep.equal(name)
		})
	})

	describe("createOrLoadGame", () => {
		conf.clear()
		it("should create a new game", () => {
			const response = gameState.createOrLoadGame()
			expect(response.feedback).to.have.string("Your game name is")
			expect(response.mode).to.equal("create")
		})
		it("should continue an existing game", () => {
			const response = gameState.createOrLoadGame()
			expect(response.feedback).to.have.string("Continuing game")
			expect(response.mode).to.equal("load")
		})
	})

	console.log("gameState logging", gameState.gameName)
	describe("changeSharesOwned", () => {
		const actor = "MIKKO"
		const company = "LSWR"
		const quantity = 3

		it("should increase the share count", () => {
			let feedback = gameState.changeSharesOwned(actor, company, quantity)
			let sharesOwned = gameState.getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(quantity)
			expect(feedback).to.have.string(
				`${actor} buys ${company} and now has ${quantity}.`
			)
		})

		it("should decrease the share count", () => {
			const sellQuantity = -2
			const newTotal = quantity + sellQuantity
			let feedback = gameState.changeSharesOwned(actor, company, sellQuantity)
			let sharesOwned = gameState.getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(newTotal)
			expect(feedback).to.have.string(
				`${actor} sells ${company} and now has ${newTotal}.`
			)
		})

		it("should handle overselling", () => {
			const sellQuantity = -2
			const newTotal = quantity + sellQuantity
			let feedback = gameState.changeSharesOwned(actor, company, sellQuantity)
			let sharesOwned = gameState.getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(0)
			expect(feedback).to.have.string(
				`${actor} only has ${newTotal}, selling all.`
			)
		})
	})

	describe("dividend", () => {
		it("should pay correct dividends", () => {
			gameState.changeSharesOwned("MIKKO", "CR", 4)
			gameState.changeSharesOwned("NOOA", "CR", 2)

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")

			expect(gameState._getCash("MIKKO")).to.equal(40)
			expect(gameState._getCash("NOOA")).to.equal(20)
		})

		it("should repay previous dividends correctly", () => {
			gameState.addToHistory("CR value 100")
			gameState.addToHistory("NBR value 100")
			gameState.addToHistory("NBR dividend 15")

			gameState.payDividends("CR", "PREV")
			gameState.addToHistory("CR dividend PREV")

			expect(gameState._getCash("MIKKO")).to.equal(80)
			expect(gameState._getCash("NOOA")).to.equal(40)

			gameState.payDividends("CR", "PREV")

			expect(gameState._getCash("MIKKO")).to.equal(120)
			expect(gameState._getCash("NOOA")).to.equal(60)
		})

		it("should handle non-number values correctly (ie. 0)", () => {
			gameState.payDividends("CR", "NOT_A_NUMBER")

			expect(gameState._getCash("MIKKO")).to.equal(120)
			expect(gameState._getCash("NOOA")).to.equal(60)
		})
	})

	describe("setValue and getValue", () => {
		it("should set the value correctly", () => {
			const company = "LNWR"
			const value = 134
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.have.string(`${company} value set to ^y${value}`)
			expect(gameState._getValue(company)).to.equal(value)
			expect(gameState._getValue()[company]).to.equal(value)
		})

		it("should handle non-numeric values correctly", () => {
			const company = "LNWR"
			const value = "word"
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.have.string("Value is not a number")
		})

		it("should return 0 for non-existing company", () => {
			const company = "NON_EXISTING_COMPANY"
			expect(gameState._getValue(company)).to.equal(0)
		})
	})

	describe("newGame, listGames, open and deleteGame", () => {
		const gameName1 = "whoops-incident"
		const gameName2 = "rusty-trains"
		it("should create a new game", () => {
			let feedback = gameState.newGame(gameName1)
			expect(feedback).to.have.string(
				`Game ^y'${gameName1}'^ generated and active.`
			)
			expect(gameState.getName()).to.equal(gameName1)

			/* Add to history to save the game. */
			gameState.addToHistory("MIKKO buys CR")
		})

		it("should not create a duplicate game", () => {
			let feedback = gameState.newGame(gameName1)
			expect(feedback).to.have.string(
				`^rGame ^y'${gameName1}'^ already exists!`
			)
		})

		it("should list all games", () => {
			gameState.newGame(gameName2)
			gameState.addToHistory("NOOA buys GER")

			let feedback = gameState.listGames()
			expect(feedback).to.have.string(gameName1)
			expect(feedback).to.have.string(gameName2)
		})

		it("should open the correct game", () => {
			let feedback = gameState.open(gameName1)
			expect(feedback).to.have.string(`Opened game ^y'${gameName1}'^`)
			expect(gameState.getName()).to.equal(gameName1)
		})

		it("should not open a non-existing game", () => {
			const notAGameName = "attractive-milkshake"
			let feedback = gameState.open(notAGameName)
			expect(feedback).to.have.string(
				`Game ^y'${notAGameName}'^ doesn't exist.`
			)
		})

		it("should be able to delete a non-active game", () => {
			gameState.open(gameName1)
			let feedback = gameState.deleteGame(gameName2)
			expect(feedback).to.have.string(`Deleted ^y'${gameName2}'^`)
		})

		it("should be able to delete the active game", () => {
			gameState.open(gameName1)
			let feedback = gameState.deleteGame(gameName1)
			expect(feedback).to.have.string(`Deleted ^y'${gameName1}'^`)
			expect(feedback).to.have.string(
				`Deleted the active game, no game active at the moment.`
			)
			expect(gameState.getName()).to.be.null
		})

		it("should not delete a non-existing game", () => {
			const notAGameName = "attractive-milkshake"
			let feedback = gameState.deleteGame(notAGameName)
			expect(feedback).to.have.string(
				`^rGame ^y'${notAGameName}'^r doesn't exist.`
			)
		})
	})

	describe("getHoldingsTable", () => {
		it("should create a correct holdings table", () => {
			conf.clear()
			gameState.resetGameState()

			gameState.changeSharesOwned("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.changeSharesOwned("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.changeSharesOwned("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.changeSharesOwned("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")

			const table = gameState.getHoldingsTable()
			expect(table[0]).to.deep.equal(["Player", "Cash", "CR", "NBR"])
			expect(table[1]).to.deep.equal(["MIKKO", 40, 4, 2])
			expect(table[2]).to.deep.equal(["NOOA", 20, 2, 0])
			expect(table[3]).to.deep.equal(["ANNI", 0, 0, 1])
		})
	})

	describe("getValuesTable", () => {
		it("should create a correct values table", () => {
			conf.clear()
			gameState.resetGameState()

			gameState.changeSharesOwned("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.changeSharesOwned("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.changeSharesOwned("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.changeSharesOwned("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")

			gameState.setValue("CR", 100)
			gameState.addToHistory("CR value 100")

			const table = gameState.getValuesTable()
			expect(table[0]).to.deep.equal(["Player", "Cash", "CR", "NBR", "Total"])
			expect(table[1]).to.deep.equal(["MIKKO", 40, 400, 0, 440])
			expect(table[2]).to.deep.equal(["NOOA", 20, 200, 0, 220])
			expect(table[3]).to.deep.equal(["ANNI", 0, 0, 0, 0])
		})
	})

	describe("statusBarContent and calculatePlayerValue", () => {
		it("should return correct content for status bar", () => {
			const statusBar = gameState.statusBarContent()

			const players = gameState._getPlayers()
			players.forEach(player => {
				const value = gameState._calculatePlayerValue(player)
				expect(statusBar).to.include(`${player} $${value}`)
			})
		})
	})

	describe("give and take cash", () => {
		it("should handle cash addition correctly", () => {
			const cashBefore = gameState._getCash("MIKKO")
			let cashChange = 10
			gameState.changeCash("MIKKO", cashChange)
			expect(gameState._getCash("MIKKO")).to.equal(cashBefore + cashChange)
		})

		it("should handle cash substraction correctly", () => {
			const cashBefore = gameState._getCash("MIKKO")
			let cashChange = -10
			gameState.changeCash("MIKKO", cashChange)
			expect(gameState._getCash("MIKKO")).to.equal(cashBefore + cashChange)
		})
	})
})
