import { HL, SessionCredentials, HlEavt, HlText } from 'highlighter-js/dist'

async function start() {
  let data = await fetch("/get_session")
  let json = await data.json()
  const creds: SessionCredentials = json.data.createHlServingSession.sessionCredentials
  const entityId = crypto.randomUUID();

  let session = new HL.StreamingSession(creds);

  session.onMessage = (command: string, entityId: string, payload: HlEavt[] | HlText) => {
    let container = document.getElementById("container")
    if (!container) return
    let div = document.createElement("div")
    if ("length" in payload) {
      for (let eavt of payload) {
        let span = document.createElement("span")
        span.innerText = eavt.attribute_name + ": " + eavt.attribute_enum_value + " "
        div.appendChild(span)
      }
    }

    container.append(div);
  };

  let button = document.getElementById("sendMessageButton")

  if (button) button.addEventListener("click", async () => {
    let input = document.getElementById('sendMessageInput')
    if (!input) return
    session.inferText(entityId, (input as HTMLInputElement).value, 0)
  })

  session.connect();
}
start()
