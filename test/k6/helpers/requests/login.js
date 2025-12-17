import { BASE_URL } from '../environment.js'
import http from 'k6/http'

export default function (login, password) {
    return http.post(`${BASE_URL}/auth/login`, 
        JSON.stringify({
            login: login,
            password: password
        }),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
}