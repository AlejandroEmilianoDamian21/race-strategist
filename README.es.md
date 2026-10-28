# Race Strategist

[English](README.md) · **Español**

Elige una carrera de F1, arma una estrategia de neumáticos, simúlala y mira dónde se gana o se pierde tiempo. Backend en NestJS y frontend en React.

## Cómo ejecutarlo

Necesitas Node.js 24 o superior.

```bash
git clone https://github.com/AlejandroEmilianoDamian21/race-strategist.git
cd race-strategist
npm install
npm run dev
```

Abre http://localhost:5173. El backend corre en http://localhost:3000.

La primera carga puede tardar hasta un minuto: la API de datos de carreras se duerme cuando nadie la usa, y mientras tanto la app muestra la pantalla "Despertando el servidor".

Tests: `npm test`.

## Supuestos de la simulación

El tiempo de carrera es la suma de todas las vueltas. Cada vuelta parte del tiempo base del circuito y suma o resta segundos:

| Parte de la vuelta  | En palabras simples                                                                                                                                                                                                                   | Por qué                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Tiempo base         | Lo que tarda una vuelta en este circuito.                                                                                                                                                                                             | Punto de partida.                                                                           |
| Ritmo del neumático | El Blando es más rápido que el Medio, y el Medio más que el Duro.                                                                                                                                                                     | La goma más blanda agarra más.                                                              |
| Desgaste            | Cada vuelta con el mismo juego suma un poco: `degradación × desgaste del circuito × vueltas con ese juego`. En la primera vuelta con gomas nuevas suma 0.                                                                             | El neumático pierde agarre al gastarse, y los circuitos más abrasivos lo gastan más rápido. |
| Combustible         | Cada vuelta es un poco más rápida: `efecto del combustible × vueltas ya corridas`.                                                                                                                                                    | El auto quema combustible y se aliviana.                                                    |
| Piloto y auto       | Un auto o piloto más lento suma segundos: `((1 − auto) + (1 − piloto)) × 10`.                                                                                                                                                         | Auto 1.0 con piloto 1.0 no suma nada; cada 0.01 por debajo suma 0.1 s por vuelta.           |
| Lluvia              | Cada neumático tiene un rango de lluvia donde rinde bien. Fuera de ese rango la vuelta es más lenta: `× 20` si llueve más de lo que el neumático aguanta (menos si se defiende bien en mojado), `× 6` si está demasiado seco para él. | Un slick bajo la lluvia pierde mucho más que una goma de lluvia en pista seca.              |
| Parada en boxes     | La última vuelta de cada stint (menos el último) suma el tiempo del pit lane + el cambio de gomas.                                                                                                                                    | Parar cuesta lo que se tarda en recorrer el pit lane y cambiar los neumáticos.              |

Ejemplo: Baréin, Norris, vuelta 10 con Medios puestos en la vuelta 1:
`91.5 − 0.4 + 0.055 × 1.35 × 9 − 0.037 × 9 + 0.3 = 91.735 s`

Lo que decidimos nosotros, porque la API da los números pero no cómo combinarlos:

- Los pesos `× 10` (piloto y auto), `× 20` y `× 6` (lluvia) son elección nuestra.
- El clima viene en 3 tramos, no vuelta por vuelta. Cada vuelta usa la lluvia de su tramo; si una vuelta no cae en ninguno, usa el último.
- El desgaste crece en línea recta. Los neumáticos reales en algún momento se caen de golpe; acá no.
- La misma estrategia da siempre el mismo resultado. No se simulan safety car, variación aleatoria de tiempos, consistencia del piloto ni sobrepasos, aunque la API manda parte de esos datos.
- Una estrategia tiene que cubrir exactamente las vueltas de la carrera y tener al menos las paradas mínimas. No se controla la regla de "usar dos compuestos distintos", porque la API no la define.

## Qué mejoraría con más tiempo

- **Caída del neumático.** Que el desgaste se acelere pasadas ciertas vueltas, para que los stints muy largos se paguen como en una carrera real.
- **Safety car.** Usar la probabilidad de safety car que la API ya manda: correr la carrera muchas veces y mostrar un rango ("entre 1:26:50 y 1:27:30") en vez de un solo número, porque parar bajo safety car cuesta menos.
- **Sugerir una estrategia.** Probar todas las combinaciones razonables y mostrar las 3 más rápidas, para que el usuario no tenga que adivinar.
- **Cargar el paso 2 por partes.** Hoy circuito, neumáticos, clima y pilotos llegan en un solo pedido, así que si falla uno falla todo el paso.
