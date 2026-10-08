const SUPABASE_URL = 'https://rkjttzaqwtnpyonygtcl.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LrOA_Cmzml_jyUneK5vLsA_QQC7axia'
const SIGNUPS_ENDPOINT = `${SUPABASE_URL}/rest/v1/waitlist_signups`

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const DUPLICATE_EMAIL_CODE = '23505'

// Only the origin (e.g. https://www.instagram.com), never the path or query.
function referrerOrigin() {
  if (!document.referrer) return null
  try {
    const { origin } = new URL(document.referrer)
    return origin && origin !== 'null' ? origin : null
  } catch {
    return null
  }
}

// Insert-only RLS policy with no SELECT, so the request must ask for
// return=minimal or PostgREST rejects it.
async function insertSignup(row) {
  const response = await fetch(SIGNUPS_ENDPOINT, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  })
  if (response.ok) return { ok: true }

  let code = null
  try {
    code = (await response.json())?.code ?? null
  } catch {}
  return { ok: false, status: response.status, code }
}

function initWaitlistForm(form) {
  const emailInput = form.querySelector('[data-waitlist-email]')
  const honeypotInput = form.querySelector('[data-waitlist-honeypot]')
  const submitButton = form.querySelector('[data-waitlist-submit]')
  const messageEl = form.querySelector('[data-waitlist-message]')
  const successEl = form.closest('[data-waitlist-block]')?.querySelector('[data-waitlist-success]')

  if (!emailInput || !submitButton) return

  function setMessage(text, isError) {
    if (!messageEl) return
    messageEl.textContent = text || ''
    messageEl.classList.toggle('is-error', Boolean(isError))
  }

  function showSuccess() {
    form.hidden = true
    if (successEl) successEl.hidden = false
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (honeypotInput && honeypotInput.value) {
      showSuccess()
      return
    }

    const email = emailInput.value.trim()
    if (!EMAIL_PATTERN.test(email)) {
      setMessage("that doesn't look like a valid email", true)
      emailInput.focus()
      return
    }

    submitButton.disabled = true
    setMessage('')

    let result
    try {
      result = await insertSignup({
        email,
        source: 'landing_page',
        referrer: referrerOrigin(),
      })
    } catch {
      result = { ok: false }
    }

    submitButton.disabled = false

    // A duplicate email looks exactly like a new signup, so the form
    // never reveals who is already on the list.
    if (result.ok || result.status === 409 || result.code === DUPLICATE_EMAIL_CODE) {
      showSuccess()
      return
    }

    setMessage('something went wrong, please try again', true)
  })
}

document.querySelectorAll('[data-waitlist-form]').forEach(initWaitlistForm)
