import { HL, SessionCredentials } from 'highlighter-js/dist'

async function start() {
  let data = await fetch("/get_session")
  let json = await data.json()
  const creds: SessionCredentials = json.data.createHlServingSession.sessionCredentials
  const entityId = 'entity-id'

  let session = new HL.StreamingSession(creds);

  session.onMessage = (command: any, entityId: string, payload: any) => {
    let container = document.getElementById("container")
    if (!container) return

    let li = document.createElement("li")
    li.textContent = '[' + entityId + ' | ' + command + ']  ' + payload
    container.prepend(li);
  };

  let button = document.getElementById("sendMessageButton")

  if (button) button.addEventListener("click", async () => {
    let input = document.getElementById('sendMessageInput')
    if (!input) return
    session.infer(entityId, (input as HTMLInputElement).value)
  })

  session.connect();
}
start()
