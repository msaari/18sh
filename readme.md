# 18SH – an 18xx shell

![Travis build status](https://img.shields.io/travis/msaari/18sh.svg?style=flat-square)

18SH is designed as a replacement for the spreadsheets used to calcualte end of
game scores in 18xx games. Spreadsheets are fine, especially if they're well
designed with formulas to avoid entering the same data twice, but I wanted to
try how an interactive shell would work.

18SH follows semantic versioning; the biggest catch is that save file
compatibility is only guaranteed within major versions.

## Installing

Clone from Github or download the files. The GitHub `master` is the current
state of development and not always stable. For stable releases, get the
[tagged release packages](https://github.com/msaari/18sh/releases). Then
install the Node modules with

	npm install

and you're ready to go. 18SH requires [Node.js](https://nodejs.org/en/download/).

## Usage

Run 18SH with Node:

	node 18sh.js

If there isn't an active game in the Configstore storage, a new game will be
created and assigned a name. If you quit and then restart 18SH, it will
continue with the same game. You can also switch between two games.

Shares can be bought by issuing the right commands (see below for a list),
company values can be set and with the command

	values

you'll finally see the end results.

## Commands

### BUY
	<player|company> buys <company> <count>

There's no need to introduce player or company names: just use any
abbreviations you like, as long as you always refer to the same player or
company with the same abbreviation. The names are case insensitive (and always
converted to upper case anyway).

Companies can also buy shares.

You can abbreviate the command to `b`, `bu` or `buy` and switch `<company>`
and `<count>` if desired.

All of these commands have Mikko buy two LNWR shares:

	Mikko buys LNWR 2
	Mikko buy 2 LNWR
	Mikko b 2 LNWR

### SELL
	<player|company> sells <company> <count>

The opposite of buying shares. The same principles apply to `sell`: you can
abbreviate the command and switch `<company>` and `<count>` if you wish.

If you try to sell more than you have, 18SH will sell to zero.

### GIVE
	<player|company> give <amount>

Gives the specified amount of cash to the player or company. Company must be
floated before its cash can be handled (see `float` below).

### TAKE
	<player|company> take <amount>

Takes the specified amount of cash from the player or company. Company must be
floated before its cash can be handled (see `float` below).

### DIVIDENDS
	<company> dividends <number|previous>

This command has the company distribute `<number>` as a dividend. Use the
per-share value, not the total dividend: if there are ten shares as usual and
the total sum is £200, the command is

	GER dividends 20

as the per-share dividend is £20. This command can be abbreviated up to `d`
and it also has an alias, `pays`. These are all identical to the command above:

	GER d 20
	GER pays 20
	GER pay 20
	GER pa 20
	GER p 20

You can also use `previous` to re-distribute the previous dividend. This can be
shortened:

	GER dividend previous
	GER pays prev
	GER d pr

### HALF DIVIDENDS
	<company> halfdividends <number>

Distributes half dividends where half the sum is paid to the company and the
rest is distributed to shares, rounded up for the benefit of the shareholders.
The `<number>` is not the per-share dividend, but the total sum to distribute.
Thus if you do

	NYC halfdividends 290

NYC will retain 140 and each NYC share is paid 15.

### FLOAT
	<company> float <number>

Starts up a company and sets its cash to `<number>`. This needs to be done
first if you want to track company cash, because otherwise `<company> give
<sum>` will not work correctly but will instead assume `<company>` is a player.

	NYC float 630

### VALUE
	<company> value <number>

This sets the company share price value to `<number>`. This is required so that
18SH can report the final values for players. Again, all of these are
equivalent:

	SECR value 67
	SECR val 67
	SECR v 67

### BANKSIZE
	banksize <number>

Sets the game bank size to the specified value. Once this is set, the status
bar will show the money remaining in the bank (calculated as bank size minus
the cash players have).

### BANK
	bank

Shows the remaining cash in bank.

### HOLDINGS
	holdings

This command prints out a list of share and cash holdings for all players.

### VALUES
	values

This command prints out a list of player net worth values. All share holdings
are multiplied by the share values and the cash holdings are added to that. In
order for this command to work, the values need to be set using `value`.

### COMPANIES
	companies

This command prints out a list of companies with their share values and the
share ownership.

### UNDO
	undo

Undoes the previous game state altering command (commands that just show the
game state like `holdings` or `values` are not considered for `undo`). 18SH has
a history of commands entered, and `undo` simply removes the last command from
the list and then resets the game state to that.

### OPEN
	open <game-name>

Opens the specified game and closes the current game (game state is saved to
the file after each command, so nothing is lost).

### LIST
	list

Lists all the games that are saved at the moment.

### DELETE
	delete <game-name>

Deletes the saved game with a given name. This is permanent and cannot be
undone.

### HELP
	help

A list of these commands.

### QUIT
	quit

Alias `exit`. Exits the 18SH shell. The game state is automatically saved after
every command in the local configstore (`~/.config/configstore/18sh.json`).

## BGG thread

For discussion about 18SH, see [the BoardGameGeek 18SH thread](https://boardgamegeek.com/thread/2225619/18sh-command-line-replacement-spreadsheets).

## Changelog

See [changelog.md](changelog.md) in the repo.

## License

Copyright 2019 [Mikko Saari](https://github.com/msaari/) mikko@mikkosaari.fi

See [license information](LICENSE).