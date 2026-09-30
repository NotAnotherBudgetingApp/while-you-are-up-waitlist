import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://rkjttzaqwtnpyonygtcl.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LrOA_Cmzml_jyUneK5vLsA_QQC7axia'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const DUPLICATE_EMAIL_CODE = '23505'

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

    const { error } = await supabase.from('waitlist_signups').insert({
      email,
      source: 'landing_page',
      referrer: document.referrer || null,
    })

    submitButton.disabled = false

    if (!error) {
      showSuccess()
      return
    }

    if (error.code === DUPLICATE_EMAIL_CODE) {
      setMessage("you're already on the list", false)
      return
    }

    setMessage('something went wrong, please try again', true)
  })
}

document.querySelectorAll('[data-waitlist-form]').forEach(initWaitlistForm)
