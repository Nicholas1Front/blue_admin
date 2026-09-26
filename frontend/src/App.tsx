import {login} from "./modules/auth/auth.api";

function App(){
  async function handleTest(){
    try{
      const result = await login({
        email : "admin@gmail.com",
        password : "1234567"
      });

      console.log("Login realizado", result)
    }catch(err){
      console.error("Login falhou", err)
    }
  }

  return (
    <main>
      <button onClick = {handleTest}>
        Testar login
      </button>
    </main>
  )
}

export default App