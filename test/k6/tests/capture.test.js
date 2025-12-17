import { check, sleep, group } from 'k6'
import { Trend } from 'k6/metrics'
import { SharedArray } from 'k6/data'
import faker from 'k6/x/faker'

import login from '../helpers/requests/login.js'
import createPokemon from '../helpers/requests/createPokemon.js'
import deletePokemon from '../helpers/requests/deletePokemon.js'

const loginDuration = new Trend('login_duration')
const createPokemonDuration = new Trend('create_pokemon_duration')
const deletePokemonDuration = new Trend('delete_pokemon_duration')

const pokemons = new SharedArray('pokemons', () => {
    return JSON.parse(open('../fixtures/pokemonList.json'))
})

export const options = {
    stages: [
        { duration: '10s', target: 30 },
        { duration: '20s', target: 30 },
        { duration: '10s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<=1000', 'p(99)<=2000'],
        http_req_failed: ['rate<0.01']
    }
}

export default function () {
    let token, captureId
    const pokemonId = pokemons[(__VU - 1) % pokemons.length].pokemonId

    group('Realiza a autenticação', () => {
        const respostaLogin = login('ash', 'pikachu123')
        check(respostaLogin, { 'status code é 200 (login)': (r) => r.status === 200 })
        loginDuration.add(respostaLogin.timings.duration)
        token = respostaLogin.json('token')
    })

    group('Realiza o registro de um Pokémon', () => {
        const respostaCadastrarPokemon = createPokemon(pokemonId, faker.strings.randomString(['M', 'F']), 5, token)
        check(respostaCadastrarPokemon, { 'status code é 201 (captura)': (r) => r.status === 201 })
        createPokemonDuration.add(respostaCadastrarPokemon.timings.duration)
        captureId = respostaCadastrarPokemon.json('capture.captureId')
    })


    group('Realiza a exclusão do Pokémon registrado', () => {
        const respostaDeletarPokemon = deletePokemon(captureId, token)
        check(respostaDeletarPokemon, { 'status code é 204 (exclusão)': (r) => r.status === 204 })
        deletePokemonDuration.add(respostaDeletarPokemon.timings.duration)
    })

    sleep(1)
}