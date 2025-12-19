# Poke API

### Trabalho de conclusão da disciplina de Automação de Testes de Performance

Foi implementado o teste `test/k6/tests/capture.test.js`. Este teste tem como objetivo avaliar a performance do fluxo de login, cadastro de pokémon (captura) e exclusão de pokémon capturado.  
Abaixo serão listados os conceitos aplicados no teste.

1. **Thresholds**:  
Foram incluídos dois tipos de *thresholds* no teste. Um para avaliar o tempo de duração das requisições em dois percentis diferentes e outro para avaliar o percentual de falhas nas requisições.

```js
thresholds: {
    http_req_duration: ['p(95)<=1000', 'p(99)<=2000'],
    http_req_failed: ['rate<0.01']
}
```


2. **Checks**:  
Cada requisição conta com um *check* para avaliar o status code retornado pela requisição. No exemplo abaixo, podemos ver o *check* aplicado na requisição de login.

```js
import { check, sleep, group } from 'k6'
...
check(respostaLogin, { 'status code é 200 (login)': (r) => r.status === 200 })
```


3. **Helpers**:  
Foram utilizados *helpers* para modularizar as requisições executadas no teste, imaginando que eventualmente elas poderiam ser reaproveitadas em outros testes/flows.

```js
import login from '../helpers/requests/login.js'
import createPokemon from '../helpers/requests/createPokemon.js'
import deletePokemon from '../helpers/requests/deletePokemon.js'
...
const respostaLogin = login('ash', 'pikachu123')
```


4. **Trends**:  
Para incluir métricas personalizadas, avaliando o tempo de cada requisição individualmente, foram utilizadas as *trends*.

```js
import { Trend } from 'k6/metrics'
...
const loginDuration = new Trend('login_duration')
const createPokemonDuration = new Trend('create_pokemon_duration')
const deletePokemonDuration = new Trend('delete_pokemon_duration')
...
loginDuration.add(respostaLogin.timings.duration)
```


5. **Faker**:  
A biblioteca *Faker* foi usada para geração do sexo do pokémon de forma dinâmica.

```js
import faker from 'k6/x/faker'
...
const respostaCadastrarPokemon = createPokemon(pokemonId, faker.strings.randomString(['M', 'F']), 5, token)
```


6. **Variáveis de ambiente**:  
Para gerenciamento de *variáveis de ambiente*, foi criado o arquivo `environment.js`. Este arquivo é importado nos helpers que passam a utilizar a BASE_URL na URI.

```js
// Arquivo environment.js
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

...

// Arquivo createPokemon.js
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
```

7. **Stages**:  
Foram utilizados *stages* para reproduzir um average-load test (teste de carga média) na aplicação.

```js
  stages: [
      { duration: '10s', target: 30 },
      { duration: '20s', target: 30 },
      { duration: '10s', target: 0 }
  ],
```

8. **Reaproveitamento de resposta**:  
O *reaproveitamento de resposta* foi importante para o fluxo executado. Após cadastrar o pokémon, obtenho o seu ID na resposta e utilizo na requisição de exclusão.

```js
captureId = respostaCadastrarPokemon.json('capture.captureId')
...
const respostaDeletarPokemon = deletePokemon(captureId, token)
```

9. **Uso de token para autenticação**:  
O *uso de token para autenticação* também foi indispensável, pois as requisições de cadastro e exclusão de pokémon precisam que o token seja enviado no cabeçalho `Authorization`.

```js
token = respostaLogin.json('token')
...
const respostaDeletarPokemon = deletePokemon(captureId, token)
```

10. **Data-Driven Testing**:  
Para cadastrar pokémons de diferentes espécies, foi utilizada uma massa de dados externa, presente no arquivo `pokemonList.json`.
Para efetuar a leitura do arquivo, usei o módulo `SharedArray` do k6.

```js
import { SharedArray } from 'k6/data'
...
const pokemons = new SharedArray('pokemons', () => {
    return JSON.parse(open('../fixtures/pokemonList.json'))
})
...
const pokemonId = pokemons[(__VU - 1) % pokemons.length].pokemonId
```

11. **Groups**:  
Foram utilizados *groups* para segregar as etapas do teste, separando um grupo para cada bloco de ações relacionado a uma requisição, facilitando a leitura e manutenção do teste.

```js
import { check, sleep, group } from 'k6'
...
group('Realiza a autenticação', () => {
    const respostaLogin = login('ash', 'pikachu123')
    check(respostaLogin, { 'status code é 200 (login)': (r) => r.status === 200 })
    loginDuration.add(respostaLogin.timings.duration)
    token = respostaLogin.json('token')
})
```

