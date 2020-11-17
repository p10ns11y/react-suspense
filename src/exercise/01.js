// Simple Data-fetching
// http://localhost:3000/isolated/exercise/01.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonErrorBoundary,
  PokemonInfoFallback,
  PokemonDataView,
} from '../pokemon'

import {createResource as createResource2} from '../utils'

// let pokemon
// let error

function createResource(promise) {
  let status = 'pending'
  let result = promise.then(
    resolved => {
      result = resolved
      status = 'success'
    },
    rejected => {
      result = rejected
      status = 'error'
    },
  )

  return {
    read() {
      if (status === 'pending') throw result
      if (status === 'error') throw result
      if (status === 'success') return result
      throw new Error('This should be impossible')
    },
  }
}

// const pokemonPromise = fetchPokemon('pikachuu')
// const resource = createResource(fetchPokemon('pikachu'))
const resource = createResource2(fetchPokemon('pikachu'))

// pokemonPromise.then(
//   response => (pokemon = response),
//   e => (error = e),
// )

function PokemonInfo() {
  const pokemon = resource.read()
  // if (error) {
  //   throw error
  // }

  // if (!pokemon) {
  //   throw pokemonPromise
  // }

  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

function App() {
  return (
    <div className="pokemon-info-app">
      <div className="pokemon-info">
        <React.Suspense fallback={<PokemonInfoFallback />}>
          <PokemonErrorBoundary>
            <PokemonInfo />
          </PokemonErrorBoundary>
        </React.Suspense>
      </div>
    </div>
  )
}

export default App
