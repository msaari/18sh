# Changelog for 18SH

## TODO
- SR/OR markers in the log to get values by SR/OR (maybe).
- Fix tests so that individual tests don't depend on other tests.
- Add more tests and more error handling to better survive wrong instructions
like buying too many shares.
- Add a command to remove companies from play.
- This one's really big so might take a while, but: it would be nice to make a
web-accessible version that would still have the command line interface, but
which could also offer a second view, so you could set up a second screen that
would show the player and company cash totals in BIG, easy-to-see numbers.

## 2.0.0 – 2019-07-08
- Removed: `give` and `take` have been replaced by `cash`.
- Added: `cash` can be used to adjust player cash. `Mikko cash 100` adds money
and `Mikko cash -100` subtracts money.
- Changed: `give` is now used to move money between participants.
- Changed: `buy` can now specify a price and a source. Price will adjust cash
and if source is specified, the source sells the share and gets the money.
- Changed: `sell` can also specify a price to give the money.
- Removed: Doing `CR dividend prev` is no longer possible. It was a bit
complicated and actually not very helpful in practise, so I dropped it.

## 1.2.0 – 2019-06-29
- Added: Companies can now have cash as well. Company cash will appear in the
status bar, on a separate row with a different background color.
- Added: Companies can own shares and get paid dividends.
- Added: New command `halfdividend` pays half dividends, rounded to the favour
of shareholders.
- Fixed: Status bar works better if gets long enough to cover multiple lines.
- Fixed: No more `COMPANY pays PLAYER $0 for undefined shares.` notices.

## 1.1.1 – 2019-06-23
- Removed: One console.log() that was left in the code.

## 1.1.0 – 2019-06-23
- Added: Instead of sum, dividends can be now paid as `prev` to repeat the
previous dividend payment for the company.
- Added: Automated tests.
- Added: Player cash can be adjusted with `give` and `take`.
- Added: Bank size can be set with `banksize 4000` and the remaining bank
checked with `bank`.
- Added: Status bar shows total cash in play. Once the bank size is set, the
status bar shows instead the remaining bank size.
- Added: `help` command.
- Added: `companies` shows a list of companies with their share values and
share ownership.
- Changed: The status bar now shows players with the format "NAME: $CASH
($VALUE)" instead of "NAME: $VALUE".

## 1.0.0 - 2019-06-17
- First released version!