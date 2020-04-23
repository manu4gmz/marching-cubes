# Marching Cubes

Este proyecto experimental tiene como fin poner en práctica el algoritmo de *Marching Cubes*. Para más información de esto puede visitar [acá](https://en.wikipedia.org/wiki/Marching_cubes). Esta idea estuvo principalmente inspirada en el video [Coding Adventure: Marching Cubes](https://www.youtube.com/watch?v=M3iI2l0ltbE) de [Sebastián Lague](https://www.youtube.com/channel/UCmtyQOKKmrMVaKuRXz02jbQ). En este video se puede apreciar visualmente lo que resumidamente voy a proceder a explicar a continuación.

**Aclaración**: Si bien el autor de ese video provee el código fuente, está echo en C# para Unity y para este proyecto se realizó de cero para implementarlo con ThreeJs.

## Breve Explicación

Básicamente es un algoritmo para representar en un cuerpo tridimensional una matriz 3D. A partir de analizar 8 vértices por vez, recorriendo toda la matriz, se van construyendo polígonos en su lugar correspondiente.

<img src="./screenshots/ref_1.png" height="300" />

Esta clasificación de 15 combinación (cabe aclarar que son más pero son simétricas o congruentes) se determina en función de si cada nodo se lo considera *activo* (representado por el círculo naranja en la imágen de referencia) y para esto el valor del mismo en la matriz debe superar una *superficie* o como se llama convencionalmente *isoSurface*.

Para lograr cuerpos más suaves adicionalmente se empleó una *interpolación* que lo que hace es dibujar los vertices, en vez de estar en el punto medio de los dos nodos, en un punto entre los dos proporcional a la diferencia de valores de los estos nodos.

## Terreno Procedural


