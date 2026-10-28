# Race Strategist

**English** · [Español](README.es.md)

Pick an F1 race, build a tyre strategy, simulate it and see where the time goes. NestJS backend + React frontend.

## How to run it

You need Node.js 24 or newer.

```bash
git clone https://github.com/AlejandroEmilianoDamian21/race-strategist.git
cd race-strategist
npm install
npm run dev
```

Open http://localhost:5173. The backend runs on http://localhost:3000.

The first load can take up to a minute: the race data API sleeps when nobody uses it, and the app shows a "waking up the server" screen meanwhile.

Tests: `npm test`.

## Simulation assumptions

The race time is the sum of every lap. Each lap starts from the circuit's base time and adds or removes seconds:

| Part of the lap | In plain words                                                                                                                                                                                        | Why                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Base time       | How long a lap of this circuit takes.                                                                                                                                                                 | Starting point.                                                               |
| Tyre pace       | Soft is faster than Medium, Medium faster than Hard.                                                                                                                                                  | Softer rubber grips more.                                                     |
| Tyre wear       | Each lap on the same set adds a bit: `degradation × circuit wear × laps on the set`. On the first lap of a new set it adds 0.                                                                         | Tyres lose grip as they wear, and rough circuits wear them faster.            |
| Fuel            | Each lap is a bit faster: `fuel effect × laps already run`.                                                                                                                                           | The car burns fuel and gets lighter.                                          |
| Driver and car  | Slower car or driver adds seconds: `((1 − car) + (1 − driver)) × 10`.                                                                                                                                 | A 1.0 car with a 1.0 driver adds nothing; each 0.01 below adds 0.1 s per lap. |
| Rain            | Each tyre has a rain range where it works well. Outside it, the lap gets slower: `× 20` if it rains more than the tyre handles (less if the tyre copes well with wet), `× 6` if it is too dry for it. | A slick in the rain loses much more than a rain tyre on a dry track.          |
| Pit stop        | The last lap of each stint (except the last one) adds pit lane time + tyre change time.                                                                                                               | Stopping costs the time to drive through the pit lane and change tyres.       |

Example: Bahrain, Norris, lap 10 on Mediums that started on lap 1:
`91.5 − 0.4 + 0.055 × 1.35 × 9 − 0.037 × 9 + 0.3 = 91.735 s`

Things we decided ourselves, because the API gives the numbers but not how to combine them:

- The weights `× 10` (driver and car), `× 20` and `× 6` (rain) are our choice.
- The weather comes in 3 segments, not lap by lap. Every lap uses the rain of its segment; if a lap falls outside all of them, it uses the last one.
- Tyre wear grows in a straight line. Real tyres fall off suddenly at some point; here they do not.
- The result is always the same for the same strategy. Safety car, random lap-time variation, driver consistency and overtaking are not simulated, even though the API sends some of that data.
- A strategy must cover exactly the race laps and have at least the minimum pit stops. The "use two different compounds" rule is not checked, because the API does not define it.

## What I would improve with more time

- **Tyre cliff.** Make wear speed up after a number of laps, so very long stints are punished like in real races.
- **Safety car.** Use the safety car probability the API already sends: run the race many times and show a range ("between 1:26:50 and 1:27:30") instead of one number, since a pit stop under safety car is cheaper.
- **Suggest a strategy.** Try every reasonable combination and show the 3 fastest, so the user does not have to guess.
- **Load step 2 by parts.** Today the circuit, tyres, weather and drivers arrive in one request, so if one fails the whole step fails.
