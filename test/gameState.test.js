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

	describe("setValue", () => {
		it("should set the value correctly", () => {
			const company = "LNWR"
			const value = 134
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.include.string(`${company} value set to ^y${value}`)
		})

		it("should handle non-numeric values correctly", () => {
			const company = "LNWR"
			const value = "word"
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.include.string("Value is not a number")
		})
	})
})
