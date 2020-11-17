// Cache resources
// http://localhost:3000/isolated/exercise/04.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
} from '../pokemon'
import {createResource} from '../utils'

function PokemonInfo({pokemonResource}) {
  const pokemon = pokemonResource.read()
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

function createPokemonResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

// const pokemonResourceCache = {}
// function getPokemonResource(pokemonName) {
//   let pokemonResource = pokemonResourceCache[pokemonName]
//   if (!pokemonResource) {
//     pokemonResource = createPokemonResource(pokemonName)
//     pokemonResourceCache[pokemonName] = pokemonResource
//   }

//   return pokemonResource
// }

const PokemonCacheContext = React.createContext(/*getPokemonResource*/)

function PokemonCacheProvider({children, cacheTime}) {
  const pokemonResourceCache = React.useRef({})
  const clearCacheTimers = React.useRef({})
  const getPokemonResource = React.useCallback(
    pokemonName => {
      let pokemonResource = pokemonResourceCache.current[pokemonName]
      if (!pokemonResource) {
        pokemonResource = createPokemonResource(pokemonName)
        pokemonResourceCache.current[pokemonName] = pokemonResource
      }
      clearCacheTimers.current[pokemonName] = Date.now() + cacheTime

      return pokemonResource
    },
    [cacheTime],
  )

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      Object.entries(clearCacheTimers.current).forEach(([name, time]) => {
        if (time < Date.now()) {
          delete pokemonResourceCache.current[name]
        }
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [cacheTime])

  return (
    <PokemonCacheContext.Provider value={getPokemonResource}>
      {children}
    </PokemonCacheContext.Provider>
  )
}

function usePokemonResourceCache() {
  const context = React.useContext(PokemonCacheContext)
  if (!context) {
    throw new Error(
      'usePokemonResourceCache should be used with in PokemonCacheProvider',
    )
  }

  return context
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)
  const getResource = usePokemonResourceCache()

  React.useEffect(() => {
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      setPokemonResource(getResource(pokemonName))
    })
  }, [getResource, pokemonName, startTransition])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}>
        {pokemonResource ? (
          <PokemonErrorBoundary
            onReset={handleReset}
            resetKeys={[pokemonResource]}
          >
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </PokemonErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}

function AppWithCacheProvider() {
  return (
    <PokemonCacheProvider cacheTime={15000}>
      <App />
    </PokemonCacheProvider>
  )
}

export default AppWithCacheProvider
