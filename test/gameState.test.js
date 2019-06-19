"use strict"

const expect = require("chai").expect
const gameState = require("../modules/gameState")

const Configstore = require("configstore")
const conf = new Configstore("18sh-test")

describe("GameState", () => {
	describe("setName and getName", () => {
		it("should return the set name", () => {
			const name = "test-name"
			gameState.setName(name)
			expect(gameState.getName()).to.deep.equal(name)
		})
	})

	describe("createOrLoadGame", () => {
		conf.clear()
		it("should create a new game", () => {
			expect(gameState.createOrLoadGame()).to.have.string("Your game name is")
		})
		it("should continue an existing game", () => {
			expect(gameState.createOrLoadGame()).to.have.string("Continuing game")
		})
	})

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

			expect(gameState.getCash("MIKKO")).to.equal(40)
			expect(gameState.getCash("NOOA")).to.equal(20)
		})

		it("should repay previous dividends correctly", () => {
			gameState.payDividends("CR", "PREV")

			expect(gameState.getCash("MIKKO")).to.equal(80)
			expect(gameState.getCash("NOOA")).to.equal(40)
		})
	})

	describe("setValue and getValue", () => {
		it("should set the value correctly", () => {
			const company = "LNWR"
			const value = 134
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.include.string(`${company} value set to ^y${value}`)
			expect(gameState.getValue(company)).to.equal(value)
			expect(gameState.getValue()[company]).to.equal(value)
		})

		it("should handle non-numeric values correctly", () => {
			const company = "LNWR"
			const value = "word"
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.include.string("Value is not a number")
		})
	})

	describe("newGame, listGames, open and deleteGame", () => {
		const gameName1 = "whoops-incident"
		const gameName2 = "rusty-trains"
		it("should create a new game", () => {
			let feedback = gameState.newGame(gameName1)
			expect(feedback).to.include.string(
				`Game ^y'${gameName1}'^ generated and active.`
			)
			expect(gameState.getName()).to.equal(gameName1)

			/* Add to history to save the game. */
			gameState.addToHistory("MIKKO buys CR")
		})

		it("should not create a duplicate game", () => {
			let feedback = gameState.newGame(gameName1)
			expect(feedback).to.include.string(
				`^rGame ^y'${gameName1}'^ already exists!`
			)
		})

		it("should list all games", () => {
			gameState.newGame(gameName2)
			gameState.addToHistory("NOOA buys GER")

			let feedback = gameState.listGames()
			expect(feedback).to.include.string(gameName1)
			expect(feedback).to.include.string(gameName2)
		})

		it("should open the correct game", () => {
			let feedback = gameState.open(gameName1)
			expect(feedback).to.include.string(`Opened game ^y'${gameName1}'^`)
			expect(gameState.getName()).to.equal(gameName1)
		})

		it("should not open a non-existing game", () => {
			const notAGameName = "attractive-milkshake"
			let feedback = gameState.open(notAGameName)
			expect(feedback).to.include.string(
				`Game ^y'${notAGameName}'^ doesn't exist.`
			)
		})

		it("should be able to delete a non-active game", () => {
			gameState.open(gameName1)
			let feedback = gameState.deleteGame(gameName2)
			expect(feedback).to.include.string(`Deleted ^y'${gameName2}'^`)
		})

		it("should be able to delete the active game", () => {
			gameState.open(gameName1)
			let feedback = gameState.deleteGame(gameName1)
			expect(feedback).to.include.string(`Deleted ^y'${gameName1}'^`)
			expect(feedback).to.include.string(
				`Deleted the active game, no game active at the moment.`
			)
			expect(gameState.getName()).to.be.null
		})
	})
})
