import { BASE_URL } from '../environment.js'
import http from 'k6/http'

export default function (captureId, token) {
    return http.del(`${BASE_URL}/pokemons/${captureId}`,
        null,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    )
}