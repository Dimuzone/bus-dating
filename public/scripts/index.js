const {
  firebase, db, timediff, normstn, patch,
  main, section, div, h2, button, span, strong
} = window

const login = document.getElementById('login')
const welcome = document.getElementById('welcome')
const page = document.querySelector('.page.-home')

const state = {
  user: null,
  tab: 'recents',
  recents: [],
  saves: [],
  messages: []
}

const switchtab = (state, newtab) =>
  ({ ...state, tab: newtab })

;(async function main () {
  let cache = window.localStorage.getItem('recents')
  cache = cache ? cache.split(',') : []

  for (const recent of cache) {
    const [id, route, name, before, after] = recent.split('-')
    state.recents.push({ id, route, name, before, after })
  }

  render(state)

  const col = await db.collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(3)
    .get()
  for (const doc of col.docs) {
    state.messages.push(doc.data())
  }
  render(state)
})()

// login/logout button
login.onclick = async function () {
  const signin = firebase.auth().currentUser
  if (signin) {
    welcome.innerText = ''
    await firebase.auth().signOut()
    window.location.href = 'index.html'
  } else {
    window.location.href = 'login.html'
  }
}

firebase.auth().onAuthStateChanged(async user => {
  // if user isn't logged in, we don't need to do anything extra
  if (!user) return

  // set button text
  login.innerText = 'Logout'

  const doc = await db.collection('users').doc(user.uid).get()
  const userdata = doc.data()
  state.user = userdata
  state.saves = userdata.saves
  render(state)
})

function render (state) {
  const { user, tab, recents, saves, messages } = state
  const name = user ? user.name.split(' ')[0] : ''
  patch(page, main({ class: 'page -home' }, [
    user
      ? span({ class: 'greeting' },
          ['Hi, ', strong(name), '!'])
      : '',
    section({ class: 'section -stations' }, [
      h2({ class: 'section-title' },
        (user ? '' : 'Recent ') + 'Stations'),
      div({ class: 'section-tabs' }, [
        button({
          class: 'section-tab' + (tab === 'recents' ? ' -select' : ''),
          onclick: _ => render(switchtab(state, 'recents'))
        }, [
          span({ class: 'icon -tab material-icons' },
            tab === 'recents' ? 'watch_later' : 'access_time'),
          'History'
        ]),
        button({
          class: 'section-tab' + (tab === 'saves' ? ' -select' : ''),
          onclick: _ => render(switchtab(state, 'saves'))
        }, [
          span({ class: 'icon -tab material-icons' },
            tab === 'saves' ? 'star' : 'star_outline'),
          'Saved'
        ])
      ]),
      tab === 'recents'
        ? recents.length
            ? div({ class: 'section-options' }, recents.map(renderStation))
            : span({ class: 'section-notice' },
              'When you view a station, it will appear here.')
        : saves.length
          ? div({ class: 'section-options' }, saves.map(renderStation))
          : span({ class: 'section-notice' },
            'When you save a station, it will appear here.')
    ]),
    section({ class: 'section -messages' }, [
      h2({ class: 'section-title' },
        (user ? '' : 'Recent ') + 'Messages'),
      messages.length
        ? div({ class: 'section-options' }, messages.map(renderMessage))
        : span({ class: 'section-notice' },
          'No recent user activity!')
    ])
  ]))
}

function renderStation (station) {
  const [on, at] = normstn(station.name)
  function onclick () {

  }
  return div({ class: 'option', onclick }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'option-text' }, on),
      span({ class: 'option-subtext' },
        [station.route, ' ‧ ', station.id, ' · on ', strong(at)])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}

function renderMessage (message) {
  const now = Date.now()
  const ago = timediff(message.timestamp, now)
  return div({ class: 'option -message' }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'option-text' }, `"${message.content}"`),
      span({ class: 'option-subtext' },
        ['from ', strong(message.username), ' at ', strong(message.route)])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-iconlabel' }, ago),
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}
