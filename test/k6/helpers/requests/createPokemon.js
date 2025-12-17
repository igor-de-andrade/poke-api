import { BASE_URL } from '../environment.js'
import http from 'k6/http'

export default function (pokemonId, sex, level, token) {
    return http.post(`${BASE_URL}/pokemons`, 
        JSON.stringify({
            pokemonId: pokemonId,
            sex: sex,
            level: level
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
    )
}